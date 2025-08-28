import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, activities } from '@/db/schema';
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

async function callAIProvider(provider: string, model: string, prompt: string, message: string, apiKey?: string) {
  const fullPrompt = `${prompt}\n\nUser message: ${message}`;
  
  switch (provider.toLowerCase()) {
    case 'openai':
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey || process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const openaiData = await openaiResponse.json();
      return openaiData.choices[0].message.content;

    case 'anthropic':
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey || process.env.ANTHROPIC_API_KEY || '',
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-3-sonnet-20240229',
          max_tokens: 500,
          messages: [
            { role: 'user', content: fullPrompt }
          ],
        }),
      });

      if (!anthropicResponse.ok) {
        throw new Error(`Anthropic API error: ${anthropicResponse.statusText}`);
      }

      const anthropicData = await anthropicResponse.json();
      return anthropicData.content[0].text;

    case 'google':
      const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-pro'}:generateContent?key=${apiKey || process.env.GOOGLE_AI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      });

      if (!googleResponse.ok) {
        throw new Error(`Google AI API error: ${googleResponse.statusText}`);
      }

      const googleData = await googleResponse.json();
      return googleData.candidates[0].content.parts[0].text;

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { agentId, message } = await request.json();

    if (!agentId || !message) {
      return NextResponse.json(
        { message: 'Agent ID and message are required' },
        { status: 400 }
      );
    }

    // Get agent details
    const agentResult = await db.select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (agentResult.length === 0) {
      return NextResponse.json(
        { message: 'Agent not found' },
        { status: 404 }
      );
    }

    const agent = agentResult[0];

    // Call AI provider
    const startTime = Date.now();
    let response: string;
    let success = true;
    let error: string | null = null;

    try {
      response = await callAIProvider(agent.provider, agent.model, agent.prompt, message);
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      response = `Error: ${error}`;
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Update agent statistics
    await db.update(agents)
      .set({
        totalRuns: agent.totalRuns + 1,
        successfulRuns: success ? agent.successfulRuns + 1 : agent.successfulRuns,
        lastRun: new Date(),
        updatedAt: new Date()
      })
      .where(eq(agents.id, agentId));

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'agent_tested',
      message: `Tested agent: ${agent.name} - ${success ? 'Success' : 'Failed'}`,
      status: success ? 'success' : 'error',
      metadata: {
        agentId,
        processingTime,
        error: error || undefined
      },
      createdAt: new Date()
    });

    return NextResponse.json({
      response,
      success,
      processingTime,
      error,
      agent: {
        ...agent,
        totalRuns: agent.totalRuns + 1,
        successfulRuns: success ? agent.successfulRuns + 1 : agent.successfulRuns,
        lastRun: new Date()
      }
    });

  } catch (error) {
    console.error('Test agent error:', error);
    return NextResponse.json(
      { message: 'Failed to test agent' },
      { status: 500 }
    );
  }
}