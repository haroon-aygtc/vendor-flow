import { NextRequest, NextResponse } from 'next/server';
import { databaseAIProviderService } from '@/services/databaseAIProviderService';

export async function POST(request: NextRequest) {
  try {
    const { providerId, ...chatRequest } = await request.json();
    const response = await databaseAIProviderService.sendChatRequest(providerId, chatRequest);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to send chat request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}