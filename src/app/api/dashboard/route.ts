import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, workflows, documents, activities } from '@/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Get dashboard statistics
    const [agentStats] = await db.select({ count: count() }).from(agents).where(eq(agents.userId, userId));
    const [workflowStats] = await db.select({ count: count() }).from(workflows).where(eq(workflows.userId, userId));
    const [documentStats] = await db.select({ count: count() }).from(documents).where(eq(documents.userId, userId));

    // Get recent activities
    const recentActivities = await db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(10);

    // Get active agents
    const activeAgents = await db.select()
      .from(agents)
      .where(eq(agents.userId, userId))
      .limit(5);

    // Get recent workflows
    const recentWorkflows = await db.select()
      .from(workflows)
      .where(eq(workflows.userId, userId))
      .orderBy(desc(workflows.updatedAt))
      .limit(5);

    return NextResponse.json({
      stats: {
        activeAgents: agentStats.count,
        workflows: workflowStats.count,
        documents: documentStats.count,
        uptime: 99.9 // This would come from monitoring service
      },
      activities: recentActivities,
      agents: activeAgents,
      workflows: recentWorkflows
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}