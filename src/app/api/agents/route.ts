import { NextRequest, NextResponse } from 'next/server';
import { databaseAIProviderService } from '@/services/databaseAIProviderService';

export async function GET() {
  try {
    const agents = await databaseAIProviderService.getAgents();
    return NextResponse.json(agents);
  } catch (error) {
    console.error('Failed to get agents:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const agent = await databaseAIProviderService.createAgent(body);
    return NextResponse.json(agent);
  } catch (error) {
    console.error('Failed to create agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create agent' },
      { status: 500 }
    );
  }
}