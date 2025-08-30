import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workflows, agents, aiProviders, workflowExecutions, activities } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-key';

async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return 'dev-user-id';
    }

    const token = authHeader.substring(7);
    if (!token || token === 'undefined' || token === 'null') {
      return 'dev-user-id';
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    return 'dev-user-id';
  }
}

interface WorkflowNode {
  id: string;
  type: 'agent' | 'condition' | 'input' | 'output' | 'delay' | 'webhook';
  data: {
    agentId?: string;
    condition?: string;
    delay?: number;
    webhookUrl?: string;
    [key: string]: any;
  };
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface ExecutionContext {
  variables: Record<string, any>;
  nodeResults: Record<string, any>;
  currentInput: any;
}

class WorkflowExecutor {
  private userId: string;
  private workflowId: string;
  private nodes: WorkflowNode[];
  private edges: WorkflowEdge[];
  private context: ExecutionContext;
  private executionId: string;

  constructor(userId: string, workflowId: string, nodes: WorkflowNode[], edges: WorkflowEdge[], initialInput: any) {
    this.userId = userId;
    this.workflowId = workflowId;
    this.nodes = nodes;
    this.edges = edges;
    this.executionId = nanoid();
    this.context = {
      variables: {},
      nodeResults: {},
      currentInput: initialInput
    };
  }

  async execute(): Promise<any> {
    const startTime = new Date();
    
    try {
      // Find start node (input node or first node)
      const startNode = this.nodes.find(node => 
        node.type === 'input' || 
        !this.edges.some(edge => edge.target === node.id)
      );

      if (!startNode) {
        throw new Error('No start node found in workflow');
      }

      const result = await this.executeNode(startNode.id);
      const endTime = new Date();

      // Log successful execution
      await db.insert(workflowExecutions).values({
        id: this.executionId,
        userId: this.userId,
        workflowId: this.workflowId,
        agentId: null,
        status: 'completed',
        input: this.context.currentInput,
        output: result,
        executionTime: endTime.getTime() - startTime.getTime(),
        createdAt: startTime,
        completedAt: endTime
      });

      return {
        success: true,
        executionId: this.executionId,
        result,
        executionTime: endTime.getTime() - startTime.getTime(),
        nodesExecuted: Object.keys(this.context.nodeResults).length
      };

    } catch (error) {
      const endTime = new Date();
      
      // Log failed execution
      await db.insert(workflowExecutions).values({
        id: this.executionId,
        userId: this.userId,
        workflowId: this.workflowId,
        agentId: null,
        status: 'failed',
        input: this.context.currentInput,
        output: { error: error instanceof Error ? error.message : 'Unknown error' },
        executionTime: endTime.getTime() - startTime.getTime(),
        createdAt: startTime,
        completedAt: endTime
      });

      throw error;
    }
  }

  private async executeNode(nodeId: string): Promise<any> {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Prevent infinite loops
    if (this.context.nodeResults[nodeId]) {
      return this.context.nodeResults[nodeId];
    }

    let result: any;

    switch (node.type) {
      case 'input':
        result = this.context.currentInput;
        break;

      case 'agent':
        result = await this.executeAgentNode(node);
        break;

      case 'condition':
        result = await this.executeConditionNode(node);
        break;

      case 'delay':
        result = await this.executeDelayNode(node);
        break;

      case 'webhook':
        result = await this.executeWebhookNode(node);
        break;

      case 'output':
        result = this.context.currentInput;
        break;

      default:
        throw new Error(`Unsupported node type: ${node.type}`);
    }

    this.context.nodeResults[nodeId] = result;
    this.context.currentInput = result;

    // Execute next nodes
    const nextEdges = this.edges.filter(edge => edge.source === nodeId);
    
    if (nextEdges.length === 0) {
      return result; // End of workflow
    }

    if (nextEdges.length === 1) {
      return await this.executeNode(nextEdges[0].target);
    }

    // Multiple paths - execute all and return combined results
    const nextResults = await Promise.all(
      nextEdges.map(edge => this.executeNode(edge.target))
    );

    return nextResults.length === 1 ? nextResults[0] : nextResults;
  }

  private async executeAgentNode(node: WorkflowNode): Promise<any> {
    const { agentId } = node.data;
    if (!agentId) {
      throw new Error('Agent ID not specified in agent node');
    }

    // Get agent configuration
    const agent = await db.select()
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.userId, this.userId)))
      .limit(1);

    if (agent.length === 0) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const agentConfig = agent[0];

    // Get AI provider
    const provider = await db.select()
      .from(aiProviders)
      .where(and(eq(aiProviders.id, agentConfig.provider), eq(aiProviders.userId, this.userId)))
      .limit(1);

    if (provider.length === 0) {
      throw new Error(`AI provider for agent ${agentId} not found`);
    }

    const providerConfig = provider[0];

    // Execute agent
    const client = this.createProviderClient(providerConfig);
    const input = typeof this.context.currentInput === 'string' 
      ? this.context.currentInput 
      : JSON.stringify(this.context.currentInput);

    const response = await client.generateResponse(
      agentConfig.prompt,
      input,
      agentConfig.model
    );

    // Update agent execution count
    await db.update(agents)
      .set({ 
        executionCount: agentConfig.executionCount + 1,
        updatedAt: new Date()
      })
      .where(eq(agents.id, agentId));

    return response;
  }

  private async executeConditionNode(node: WorkflowNode): Promise<any> {
    const { condition } = node.data;
    if (!condition) {
      throw new Error('Condition not specified in condition node');
    }

    // Simple condition evaluation (can be enhanced with a proper expression parser)
    try {
      const result = this.evaluateCondition(condition, this.context.currentInput);
      return result;
    } catch (error) {
      throw new Error(`Failed to evaluate condition: ${condition}`);
    }
  }

  private async executeDelayNode(node: WorkflowNode): Promise<any> {
    const { delay } = node.data;
    const delayMs = delay || 1000;

    await new Promise(resolve => setTimeout(resolve, delayMs));
    return this.context.currentInput;
  }

  private async executeWebhookNode(node: WorkflowNode): Promise<any> {
    const { webhookUrl, method = 'POST', headers = {} } = node.data;
    if (!webhookUrl) {
      throw new Error('Webhook URL not specified');
    }

    const response = await fetch(webhookUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(this.context.currentInput)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }

  private evaluateCondition(condition: string, input: any): boolean {
    // Simple condition evaluation - can be enhanced
    const inputStr = typeof input === 'string' ? input.toLowerCase() : JSON.stringify(input).toLowerCase();
    
    if (condition.includes('contains')) {
      const match = condition.match(/contains\s+"([^"]+)"/);
      if (match) {
        return inputStr.includes(match[1].toLowerCase());
      }
    }
    
    if (condition.includes('equals')) {
      const match = condition.match(/equals\s+"([^"]+)"/);
      if (match) {
        return inputStr === match[1].toLowerCase();
      }
    }

    if (condition.includes('length >')) {
      const match = condition.match(/length\s*>\s*(\d+)/);
      if (match) {
        return inputStr.length > parseInt(match[1]);
      }
    }

    // Default to true if condition can't be parsed
    return true;
  }

  private createProviderClient(provider: any): any {
    switch (provider.type) {
      case 'openai':
        return new OpenAIClient(provider.configuration.apiKey);
      case 'anthropic':
        return new AnthropicClient(provider.configuration.apiKey);
      default:
        throw new Error(`Unsupported provider type: ${provider.type}`);
    }
  }
}

class OpenAIClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(prompt: string, input: string, model: string = 'gpt-4'): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: input }
        ],
        temperature: 0.7,
        max_tokens: 2048
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';
  }
}

class AnthropicClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(prompt: string, input: string, model: string = 'claude-3-sonnet-20240229'): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        messages: [
          { role: 'user', content: `${prompt}\n\nUser Input: ${input}` }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.content[0]?.text || 'No response generated';
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { workflowId, input } = await request.json();

    if (!workflowId || input === undefined) {
      return NextResponse.json(
        { message: 'Workflow ID and input are required' },
        { status: 400 }
      );
    }

    // Get workflow configuration
    const workflow = await db.select()
      .from(workflows)
      .where(and(eq(workflows.id, workflowId), eq(workflows.userId, userId)))
      .limit(1);

    if (workflow.length === 0) {
      return NextResponse.json(
        { message: 'Workflow not found' },
        { status: 404 }
      );
    }

    const workflowConfig = workflow[0];

    if (workflowConfig.status !== 'active') {
      return NextResponse.json(
        { message: 'Workflow is not active' },
        { status: 400 }
      );
    }

    // Execute workflow
    const executor = new WorkflowExecutor(
      userId,
      workflowId,
      workflowConfig.nodes as WorkflowNode[],
      workflowConfig.edges as WorkflowEdge[],
      input
    );

    const result = await executor.execute();

    // Update workflow execution count
    await db.update(workflows)
      .set({ 
        executionCount: workflowConfig.executionCount + 1,
        updatedAt: new Date()
      })
      .where(eq(workflows.id, workflowId));

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'workflow_executed',
      message: `Executed workflow: ${workflowConfig.name}`,
      status: 'success',
      createdAt: new Date()
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Workflow execution error:', error);
    
    // Log failed execution activity
    try {
      const userId = await verifyAuth(request);
      await db.insert(activities).values({
        id: nanoid(),
        userId,
        type: 'workflow_execution_failed',
        message: `Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error',
        createdAt: new Date()
      });
    } catch (logError) {
      console.error('Failed to log workflow execution error:', logError);
    }

    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Workflow execution failed' 
      },
      { status: 500 }
    );
  }
}