// Agent test execution API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, aiProviders, aiModels, agentExecutions, activityFeed } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { message } = await request.json();
    const agentId = params.id;

    if (!message) {
      return NextResponse.json(
        { message: 'Message is required' },
        { status: 400 }
      );
    }

    // Get agent with provider and model info
    const agentResult = await db
      .select({
        agent: agents,
        provider: aiProviders,
        model: aiModels
      })
      .from(agents)
      .leftJoin(aiProviders, eq(agents.provider, aiProviders.id))
      .leftJoin(aiModels, eq(agents.model, aiModels.id))
      .where(eq(agents.id, agentId))
      .limit(1);

    if (agentResult.length === 0) {
      return NextResponse.json(
        { message: 'Agent not found' },
        { status: 404 }
      );
    }

    const { agent, provider, model } = agentResult[0];

    if (!provider || !model) {
      return NextResponse.json(
        { message: 'Agent configuration incomplete' },
        { status: 400 }
      );
    }

    // Create execution record
    const executionId = nanoid();
    const startTime = new Date();

    await db.insert(agentExecutions).values({
      id: executionId,
      agentId: agent.id,
      userId: agent.userId, // Use the agent's userId
      input: { message },
      status: 'running',
      startedAt: startTime
    });

    try {
      // Execute the AI request based on provider type
      let response;
      const startExecution = Date.now();

      switch (provider.type) {
        case 'openai':
          response = await executeOpenAI(provider, model, agent, message);
          break;
        case 'anthropic':
          response = await executeAnthropic(provider, model, agent, message);
          break;
        case 'google':
          response = await executeGoogle(provider, model, agent, message);
          break;
        default:
          throw new Error(`Unsupported provider type: ${provider.type}`);
      }

      const duration = Date.now() - startExecution;
      const completedAt = new Date();

      // Update execution record with success
      await db.update(agentExecutions)
        .set({
          output: response,
          status: 'completed',
          completedAt,
          duration,
          tokenUsage: response.usage || null
        })
        .where(eq(agentExecutions.id, executionId));

      // Update agent stats
      await db.update(agents)
        .set({
          totalRuns: agent.totalRuns + 1,
          lastRun: completedAt,
          status: 'active',
          updatedAt: completedAt
        })
        .where(eq(agents.id, agent.id));

      // Log activity
      await db.insert(activityFeed).values({
        id: nanoid(),
        userId: agent.userId,
        type: 'agent_executed',
        title: `Agent "${agent.name}" executed successfully`,
        description: `Processed message in ${duration}ms`,
        message: `Agent execution completed`,
        entityType: 'agent',
        entityId: agent.id,
        createdAt: completedAt
      });

      return NextResponse.json({
        success: true,
        response: response.content,
        executionId,
        duration,
        tokenUsage: response.usage
      });

    } catch (error) {
      // Update execution record with error
      await db.update(agentExecutions)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        })
        .where(eq(agentExecutions.id, executionId));

      throw error;
    }

  } catch (error) {
    console.error('Agent execution error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Execution failed'
      },
      { status: 500 }
    );
  }
}

async function executeOpenAI(provider: any, model: any, agent: any, message: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model.modelId,
      messages: [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: parseFloat(agent.temperature),
      max_tokens: agent.maxTokens
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || 'No response',
    usage: data.usage
  };
}

async function executeAnthropic(provider: any, model: any, agent: any, message: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model.modelId,
      max_tokens: agent.maxTokens,
      system: agent.systemPrompt,
      messages: [
        { role: 'user', content: message }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    content: data.content[0]?.text || 'No response',
    usage: data.usage
  };
}

async function executeGoogle(provider: any, model: any, agent: any, message: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.modelId}:generateContent?key=${provider.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${agent.systemPrompt}\n\nUser: ${message}`
        }]
      }],
      generationConfig: {
        temperature: parseFloat(agent.temperature),
        maxOutputTokens: agent.maxTokens
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google AI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    content: data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response',
    usage: data.usageMetadata
  };
}