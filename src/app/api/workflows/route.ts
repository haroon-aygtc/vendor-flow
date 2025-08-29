import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workflows, activities } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
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
  if (!decoded.userId) {
    throw new Error('Invalid token');
  }
  return decoded.userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);

    const userWorkflows = await db.select()
      .from(workflows)
      .where(eq(workflows.userId, userId))
      .orderBy(desc(workflows.createdAt));

    return NextResponse.json({ workflows: userWorkflows });
  } catch (error) {
    console.error('Get workflows error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { name, description, nodes, edges } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Workflow name is required' },
        { status: 400 }
      );
    }

    const workflowId = nanoid();
    const newWorkflow = {
      id: workflowId,
      userId,
      name,
      description: description || '',
      nodes: JSON.stringify(nodes || []),
      edges: JSON.stringify(edges || []),
      status: 'draft' as const,
      executionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(workflows).values(newWorkflow);

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'workflow_created',
      message: `Created new workflow: ${name}`,
      status: 'success',
      createdAt: new Date()
    });

    // Return workflow with parsed nodes/edges
    const responseWorkflow = {
      ...newWorkflow,
      nodes: JSON.parse(newWorkflow.nodes as string),
      edges: JSON.parse(newWorkflow.edges as string)
    };

    return NextResponse.json({ workflow: responseWorkflow });
  } catch (error) {
    console.error('Create workflow error:', error);
    return NextResponse.json(
      { message: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { id, name, description, nodes, edges, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const updatedWorkflow = await db.update(workflows)
      .set({
        name,
        description,
        nodes: JSON.stringify(nodes || []),
        edges: JSON.stringify(edges || []),
        status,
        updatedAt: new Date()
      })
      .where(eq(workflows.id, id))
      .returning();

    if (updatedWorkflow.length === 0) {
      return NextResponse.json(
        { message: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'workflow_updated',
      message: `Updated workflow: ${name}`,
      status: 'success',
      createdAt: new Date()
    });

    // Return workflow with parsed nodes/edges
    const responseWorkflow = {
      ...updatedWorkflow[0],
      nodes: JSON.parse(updatedWorkflow[0].nodes as string),
      edges: JSON.parse(updatedWorkflow[0].edges as string)
    };

    return NextResponse.json({ workflow: responseWorkflow });
  } catch (error) {
    console.error('Update workflow error:', error);
    return NextResponse.json(
      { message: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('id');

    if (!workflowId) {
      return NextResponse.json(
        { message: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const deletedWorkflow = await db.delete(workflows)
      .where(eq(workflows.id, workflowId))
      .returning();

    if (deletedWorkflow.length === 0) {
      return NextResponse.json(
        { message: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'workflow_deleted',
      message: `Deleted workflow: ${deletedWorkflow[0].name}`,
      status: 'warning',
      createdAt: new Date()
    });

    return NextResponse.json({ message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Delete workflow error:', error);
    return NextResponse.json(
      { message: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}