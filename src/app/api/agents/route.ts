import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, activities } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
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

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);

    const userAgents = await db.select()
      .from(agents)
      .where(eq(agents.userId, userId))
      .orderBy(desc(agents.createdAt));

    return NextResponse.json({ agents: userAgents });
  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { name, description, prompt, provider, model } = await request.json();

    if (!name || !prompt || !provider || !model) {
      return NextResponse.json(
        { message: 'Name, prompt, provider, and model are required' },
        { status: 400 }
      );
    }

    const agentId = nanoid();
    const newAgent = {
      id: agentId,
      userId,
      name,
      description: description || '',
      prompt,
      provider,
      model,
      status: 'active' as const,
      totalRuns: 0,
      successfulRuns: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(agents).values(newAgent);

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'agent_created',
      message: `Created new agent: ${name}`,
      status: 'success',
      createdAt: new Date()
    });

    return NextResponse.json({ agent: newAgent });
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json(
      { message: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { id, name, description, prompt, provider, model, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const updatedAgent = await db.update(agents)
      .set({
        name,
        description,
        prompt,
        provider,
        model,
        status,
        updatedAt: new Date()
      })
      .where(eq(agents.id, id))
      .returning();

    if (updatedAgent.length === 0) {
      return NextResponse.json(
        { message: 'Agent not found' },
        { status: 404 }
      );
    }

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'agent_updated',
      message: `Updated agent: ${name}`,
      status: 'success',
      createdAt: new Date()
    });

    return NextResponse.json({ agent: updatedAgent[0] });
  } catch (error) {
    console.error('Update agent error:', error);
    return NextResponse.json(
      { message: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('id');

    if (!agentId) {
      return NextResponse.json(
        { message: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const deletedAgent = await db.delete(agents)
      .where(eq(agents.id, agentId))
      .returning();

    if (deletedAgent.length === 0) {
      return NextResponse.json(
        { message: 'Agent not found' },
        { status: 404 }
      );
    }

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'agent_deleted',
      message: `Deleted agent: ${deletedAgent[0].name}`,
      status: 'warning',
      createdAt: new Date()
    });

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    return NextResponse.json(
      { message: 'Failed to delete agent' },
      { status: 500 }
    );
  }
}