import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workflows, agents, activities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET;

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    agentId?: string;
    prompt?: string;
    condition?: string;
    [key: string]: any;
  };
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

async function executeNode(node: WorkflowNode, context: any, userId: string): Promise<any> {
  switch (node.type) {
    case 'agent':
      if (!node.data.agentId) {
        throw new Error(`Agent node ${node.id} missing agentId`);
      }

      // Get agent details
      const agentResult = await db.select()
        .from(agents)
        .where(eq(agents.id, node.data.agentId))
        .limit(1);

      if (agentResult.length === 0) {
        throw new Error(`Agent ${node.data.agentId} not found`);
      }

      const agent = agentResult[0];

      // Execute agent with context
      const prompt = `${agent.prompt}\n\nContext: ${JSON.stringify(context)}\n\nTask: ${node.data.prompt || 'Process the given context'}`;

      // Call AI provider
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: agent.model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: agent.prompt },
            { role: 'user', content: node.data.prompt || 'Process the given context' }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.choices[0].message.content;

      // Update agent stats
      await db.update(agents)
        .set({
          totalRuns: agent.totalRuns + 1,
          successfulRuns: agent.successfulRuns + 1,
          lastRun: new Date(),
          updatedAt: new Date()
        })
        .where(eq(agents.id, agent.id));

      return {
        ...context,
        [`${node.id}_result`]: result,
        lastNodeResult: result
      };

    case 'decision':
      const condition = node.data.condition || 'true';
      const conditionResult = evaluateCondition(condition, context);
      
      return {
        ...context,
        [`${node.id}_decision`]: conditionResult,
        lastDecision: conditionResult
      };

    case 'input':
      return {
        ...context,
        [`${node.id}_input`]: node.data.value || '',
        input: node.data.value || ''
      };

    case 'output':
      return {
        ...context,
        [`${node.id}_output`]: context.lastNodeResult || 'No result',
        finalOutput: context.lastNodeResult || 'No result'
      };

    default:
      return context;
  }
}

function evaluateCondition(condition: string, context: any): boolean {
  try {
    // Simple condition evaluation - in production, use a proper expression evaluator
    const sanitizedCondition = condition
      .replace(/\$\{([^}]+)\}/g, (match, key) => {
        return JSON.stringify(context[key] || '');
      });

    // Basic condition evaluation (extend as needed)
    if (sanitizedCondition.includes('contains')) {
      const [left, right] = sanitizedCondition.split('contains').map(s => s.trim().replace(/['"]/g, ''));
      return (context[left] || '').toString().toLowerCase().includes(right.toLowerCase());
    }

    if (sanitizedCondition.includes('equals')) {
      const [left, right] = sanitizedCondition.split('equals').map(s => s.trim().replace(/['"]/g, ''));
      return (context[left] || '').toString() === right;
    }

    // Default to true for simple conditions
    return true;
  } catch (error) {
    console.error('Condition evaluation error:', error);
    return false;
  }
}

function findNextNodes(currentNodeId: string, edges: WorkflowEdge[], context: any): string[] {
  const outgoingEdges = edges.filter(edge => edge.source === currentNodeId);
  
  // For decision nodes, filter based on condition result
  if (context[`${currentNodeId}_decision`] !== undefined) {
    const decision = context[`${currentNodeId}_decision`];
    return outgoingEdges
      .filter(edge => {
        // Simple edge filtering based on decision
        if (edge.type === 'true' && decision) return true;
        if (edge.type === 'false' && !decision) return true;
        if (!edge.type) return true; // Default edge
        return false;
      })
      .map(edge => edge.target);
  }

  return outgoingEdges.map(edge => edge.target);
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { workflowId, initialContext = {} } = await request.json();

    if (!workflowId) {
      return NextResponse.json(
        { message: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Get workflow
    const workflowResult = await db.select()
      .from(workflows)
      .where(eq(workflows.id, workflowId))
      .limit(1);

    if (workflowResult.length === 0) {
      return NextResponse.json(
        { message: 'Workflow not found' },
        { status: 404 }
      );
    }

    const workflow = workflowResult[0];
    const nodes = workflow.nodes as WorkflowNode[];
    const edges = workflow.edges as WorkflowEdge[];

    // Find start node
    const startNode = nodes.find(node => node.type === 'input' || 
      !edges.some(edge => edge.target === node.id));

    if (!startNode) {
      return NextResponse.json(
        { message: 'No start node found in workflow' },
        { status: 400 }
      );
    }

    // Execute workflow
    let context = { ...initialContext };
    let currentNodes = [startNode.id];
    const executionLog: any[] = [];
    const maxSteps = 50; // Prevent infinite loops
    let stepCount = 0;

    while (currentNodes.length > 0 && stepCount < maxSteps) {
      const nextNodes: string[] = [];

      for (const nodeId of currentNodes) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        try {
          const startTime = Date.now();
          context = await executeNode(node, context, userId);
          const endTime = Date.now();

          executionLog.push({
            nodeId,
            nodeType: node.type,
            nodeLabel: node.data.label,
            executionTime: endTime - startTime,
            success: true,
            result: context[`${nodeId}_result`] || context[`${nodeId}_decision`] || 'Executed'
          });

          // Find next nodes
          const next = findNextNodes(nodeId, edges, context);
          nextNodes.push(...next);

        } catch (error) {
          executionLog.push({
            nodeId,
            nodeType: node.type,
            nodeLabel: node.data.label,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          // Log error activity
          await db.insert(activities).values({
            id: nanoid(),
            userId,
            type: 'workflow_execution_error',
            message: `Workflow execution failed at node: ${node.data.label}`,
            status: 'error',
            metadata: {
              workflowId,
              nodeId,
              error: error instanceof Error ? error.message : 'Unknown error'
            },
            createdAt: new Date()
          });

          return NextResponse.json({
            success: false,
            error: `Execution failed at node: ${node.data.label}`,
            executionLog,
            context
          });
        }
      }

      currentNodes = [...new Set(nextNodes)]; // Remove duplicates
      stepCount++;
    }

    // Update workflow execution count
    await db.update(workflows)
      .set({
        executionCount: workflow.executionCount + 1,
        lastExecuted: new Date(),
        updatedAt: new Date()
      })
      .where(eq(workflows.id, workflowId));

    // Log successful execution
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'workflow_executed',
      message: `Workflow executed successfully: ${workflow.name}`,
      status: 'success',
      metadata: {
        workflowId,
        executionTime: executionLog.reduce((sum, log) => sum + (log.executionTime || 0), 0),
        nodesExecuted: executionLog.length
      },
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      executionLog,
      finalContext: context,
      result: context.finalOutput || context.lastNodeResult || 'Workflow completed',
      executionTime: executionLog.reduce((sum, log) => sum + (log.executionTime || 0), 0)
    });

  } catch (error) {
    console.error('Workflow execution error:', error);
    return NextResponse.json(
      { message: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}