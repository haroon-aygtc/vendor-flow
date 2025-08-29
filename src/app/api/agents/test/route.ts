import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, activities } from '@/db/schema';
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
    const { agentId, message } = await request.json();

    if (!agentId || !message) {
      return NextResponse.json(
        { message: 'Agent ID and message are required' },
        { status: 400 }
      );
    }

    // Get agent details
    const [agent] = await db.select()
      .from(agents)
      .where(eq(agents.id, agentId));

    if (!agent) {
      return NextResponse.json(
        { message: 'Agent not found' },
        { status: 404 }
      );
    }

    const startTime = Date.now();
    let success = false;
    let response = '';
    let error = null;

    try {
      // Simulate AI response (replace with actual AI provider call)
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Mock response based on agent prompt
      response = `Agent "${agent.name}" processed your message: "${message}". This is a simulated response based on the agent's configuration.`;
      success = true;

      // Update agent stats
      await db.update(agents)
        .set({
          totalRuns: agent.totalRuns + 1,
          successfulRuns: agent.successfulRuns + (success ? 1 : 0),
          lastRun: new Date().toISOString(),
          updatedAt: new Date()
        })
        .where(eq(agents.id, agentId));

    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      success = false;
    }

    const processingTime = Date.now() - startTime;

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'agent_test',
      message: `Tested agent: ${agent.name} - ${success ? 'Success' : 'Failed'}`,
      status: success ? 'success' : 'error',
      createdAt: new Date()
    });

    // Get updated agent
    const [updatedAgent] = await db.select()
      .from(agents)
      .where(eq(agents.id, agentId));

    return NextResponse.json({
      success,
      response,
      error,
      processingTime,
      agent: updatedAgent
    });

  } catch (error) {
    console.error('Test agent error:', error);
    return NextResponse.json(
      { message: 'Failed to test agent' },
      { status: 500 }
    );
  }
}