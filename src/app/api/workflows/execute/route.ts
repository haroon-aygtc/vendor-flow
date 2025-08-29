import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workflows, agents, activities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  return decoded.userId;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { workflowId, initialContext } = await request.json();

    if (!workflowId) {
      return NextResponse.json(
        { message: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Get workflow details
    const [workflow] = await db.select()
      .from(workflows)
      .where(eq(workflows.id, workflowId));

    if (!workflow) {
      return NextResponse.json(
        { message: 'Workflow not found' },
        { status: 404 }
      );
    }

    const startTime = Date.now();
    let success = false;
    let result = '';
    let error = null;
    let executionLog: any[] = [];

    try {
      const nodes = JSON.parse(workflow.nodes);
      const edges = JSON.parse(workflow.edges);

      // Execute workflow nodes in sequence
      let currentContext = initialContext || {};

      for (const node of nodes) {
        const nodeStartTime = Date.now();
        let nodeSuccess = false;
        let nodeResult = '';
        let nodeError = null;

        try {
          switch (node.type) {
            case 'input':
              nodeResult = `Input node processed: ${node.data.label}`;
              nodeSuccess = true;
              break;

            case 'agent':
              // Get agent details
              const [agent] = await db.select()
                .from(agents)
                .where(eq(agents.id, node.data.agentId));

              if (agent) {
                // Simulate agent execution
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                nodeResult = `Agent "${agent.name}" executed successfully with prompt: ${node.data.prompt || agent.prompt}`;
                nodeSuccess = true;

                // Update agent stats
                await db.update(agents)
                  .set({
                    totalRuns: agent.totalRuns + 1,
                    successfulRuns: agent.successfulRuns + 1,
                    lastRun: new Date().toISOString(),
                    updatedAt: new Date()
                  })
                  .where(eq(agents.id, agent.id));
              } else {
                throw new Error(`Agent not found: ${node.data.agentId}`);
              }
              break;

            case 'decision':
              // Simulate decision logic
              const condition = node.data.condition || 'true';
              nodeResult = `Decision evaluated: ${condition}`;
              nodeSuccess = true;
              break;

            case 'output':
              nodeResult = `Output generated: ${node.data.label}`;
              nodeSuccess = true;
              break;

            default:
              nodeResult = `Unknown node type: ${node.type}`;
              nodeSuccess = true;
          }

          currentContext[node.id] = nodeResult;
        } catch (err) {
          nodeError = err instanceof Error ? err.message : 'Unknown error';
          nodeSuccess = false;
        }

        const nodeExecutionTime = Date.now() - nodeStartTime;
        executionLog.push({
          nodeId: node.id,
          nodeLabel: node.data.label,
          nodeType: node.type,
          success: nodeSuccess,
          result: nodeResult,
          error: nodeError,
          executionTime: nodeExecutionTime
        });

        if (!nodeSuccess) {
          throw new Error(`Node execution failed: ${nodeError}`);
        }
      }

      result = 'Workflow executed successfully';
      success = true;

      // Update workflow execution count
      await db.update(workflows)
        .set({
          executionCount: workflow.executionCount + 1,
          lastExecuted: new Date().toISOString(),
          updatedAt: new Date()
        })
        .where(eq(workflows.id, workflowId));

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      success = false;
    }

    const executionTime = Date.now() - startTime;

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'workflow_executed',
      message: `Executed workflow: ${workflow.name} - ${success ? 'Success' : 'Failed'}`,
      status: success ? 'success' : 'error',
      createdAt: new Date()
    });

    return NextResponse.json({
      success,
      result,
      error,
      executionTime,
      executionLog,
      workflowId
    });

  } catch (error) {
    console.error('Execute workflow error:', error);
    return NextResponse.json(
      { message: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}