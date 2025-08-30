import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, aiProviders, activities, workflowExecutions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
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

interface AIProviderClient {
  generateResponse(prompt: string, input: string, model?: string): Promise<string>;
}

class OpenAIClient implements AIProviderClient {
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

class AnthropicClient implements AIProviderClient {
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

function createProviderClient(provider: any): AIProviderClient {
  switch (provider.type) {
    case 'openai':
      return new OpenAIClient(provider.configuration.apiKey);
    case 'anthropic':
      return new AnthropicClient(provider.configuration.apiKey);
    default:
      throw new Error(`Unsupported provider type: ${provider.type}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { agentId, input, testMode = false } = await request.json();

    if (!agentId || !input) {
      return NextResponse.json(
        { message: 'Agent ID and input are required' },
        { status: 400 }
      );
    }

    // Get agent configuration
    const agent = await db.select()
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.userId, userId)))
      .limit(1);

    if (agent.length === 0) {
      return NextResponse.json(
        { message: 'Agent not found' },
        { status: 404 }
      );
    }

    const agentConfig = agent[0];

    // Get AI provider configuration
    const provider = await db.select()
      .from(aiProviders)
      .where(and(eq(aiProviders.id, agentConfig.provider), eq(aiProviders.userId, userId)))
      .limit(1);

    if (provider.length === 0) {
      return NextResponse.json(
        { message: 'AI provider not found or not configured' },
        { status: 404 }
      );
    }

    const providerConfig = provider[0];

    if (!providerConfig.isActive) {
      return NextResponse.json(
        { message: 'AI provider is not active' },
        { status: 400 }
      );
    }

    const executionId = nanoid();
    const startTime = new Date();

    try {
      // Create provider client and execute
      const client = createProviderClient(providerConfig);
      const response = await client.generateResponse(
        agentConfig.prompt,
        input,
        agentConfig.model
      );

      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      // Log execution if not in test mode
      if (!testMode) {
        await db.insert(workflowExecutions).values({
          id: executionId,
          userId,
          workflowId: null, // Single agent execution
          agentId,
          status: 'completed',
          input: { userInput: input },
          output: { response },
          executionTime,
          createdAt: startTime,
          completedAt: endTime
        });

        // Update agent execution count
        await db.update(agents)
          .set({ 
            executionCount: agentConfig.executionCount + 1,
            updatedAt: new Date()
          })
          .where(eq(agents.id, agentId));

        // Log activity
        await db.insert(activities).values({
          id: nanoid(),
          userId,
          type: 'agent_executed',
          message: `Executed agent: ${agentConfig.name}`,
          status: 'success',
          createdAt: new Date()
        });
      }

      return NextResponse.json({
        success: true,
        executionId,
        response,
        executionTime,
        testMode,
        agent: {
          id: agentConfig.id,
          name: agentConfig.name,
          model: agentConfig.model
        }
      });

    } catch (providerError) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      // Log failed execution
      if (!testMode) {
        await db.insert(workflowExecutions).values({
          id: executionId,
          userId,
          workflowId: null,
          agentId,
          status: 'failed',
          input: { userInput: input },
          output: { error: providerError instanceof Error ? providerError.message : 'Unknown error' },
          executionTime,
          createdAt: startTime,
          completedAt: endTime
        });

        // Log activity
        await db.insert(activities).values({
          id: nanoid(),
          userId,
          type: 'agent_execution_failed',
          message: `Failed to execute agent: ${agentConfig.name}`,
          status: 'error',
          createdAt: new Date()
        });
      }

      return NextResponse.json({
        success: false,
        executionId,
        error: providerError instanceof Error ? providerError.message : 'Agent execution failed',
        executionTime,
        testMode
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Agent test error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test agent' 
      },
      { status: 500 }
    );
  }
}