import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents, activities, workflows, documents, vendors, agentExecutions } from '@/db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

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
  const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string };
  return decoded.userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);

    // Get dashboard statistics
    const [agentStats] = await db.select({
      activeAgents: count(),
      totalRuns: sql<number>`COALESCE(sum(${agents.totalRuns}), 0)`,
      successfulRuns: sql<number>`COALESCE(sum(${agents.successfulRuns}), 0)`
    }).from(agents).where(eq(agents.userId, userId));

    // Calculate success rate
    const successRate = agentStats.totalRuns > 0
      ? Math.round((agentStats.successfulRuns / agentStats.totalRuns) * 100)
      : 0;

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
      .orderBy(desc(agents.updatedAt))
      .limit(5);

    // Get real workflow data
    const userWorkflows = await db.select()
      .from(workflows)
      .where(eq(workflows.userId, userId))
      .orderBy(desc(workflows.updatedAt))
      .limit(5);

    // Get real document count
    const [documentStats] = await db.select({
      totalDocuments: count(),
      completedDocuments: count()
    }).from(documents).where(eq(documents.userId, userId));

    // Get real vendor count
    const [vendorStats] = await db.select({
      totalVendors: count()
    }).from(vendors).where(eq(vendors.userId, userId));

    // Calculate real uptime based on agent executions
    const [executionStats] = await db.select({
      totalExecutions: count(),
      successfulExecutions: count()
    }).from(agentExecutions).where(eq(agentExecutions.userId, userId));

    const uptime = executionStats.totalExecutions > 0
      ? Math.round((executionStats.successfulExecutions / executionStats.totalExecutions) * 100)
      : 100;

    return NextResponse.json({
      stats: {
        activeAgents: agentStats.activeAgents,
        workflows: userWorkflows.length,
        documents: documentStats.totalDocuments,
        vendors: vendorStats.totalVendors,
        uptime: uptime,
        successRate: successRate
      },
      activities: recentActivities,
      agents: activeAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        status: agent.status,
        lastRun: agent.lastRun
      })),
      workflows: userWorkflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        status: workflow.status,
        updatedAt: workflow.updatedAt
      }))
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}