// Create API route for dashboard metrics
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, workflows, documents, activityFeed, agentExecutions } from '@/db/schema';
import { count, desc, eq, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Get active agents count
    const activeAgentsResult = await db
      .select({ count: count() })
      .from(agents)
      .where(eq(agents.status, 'active'));

    // Get workflows count
    const workflowsResult = await db
      .select({ count: count() })
      .from(workflows)
      .where(eq(workflows.status, 'active'));

    // Get documents count
    const documentsResult = await db
      .select({ count: count() })
      .from(documents);

    // Get recent activity (last 10 items)
    const recentActivity = await db
      .select()
      .from(activityFeed)
      .orderBy(desc(activityFeed.createdAt))
      .limit(10);

    // Get execution stats for the last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentExecutions = await db
      .select({ count: count() })
      .from(agentExecutions)
      .where(gte(agentExecutions.startedAt, last24Hours));

    return NextResponse.json({
      metrics: {
        activeAgents: activeAgentsResult[0]?.count || 0,
        workflows: workflowsResult[0]?.count || 0,
        documents: documentsResult[0]?.count || 0,
        executions24h: recentExecutions[0]?.count || 0
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        createdAt: activity.createdAt,
        metadata: activity.metadata
      }))
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  }
}