import { NextRequest, NextResponse } from 'next/server';
import { databaseAIProviderService } from '@/services/databaseAIProviderService';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await databaseAIProviderService.deleteProvider(params.id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Failed to delete provider:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete provider' },
      { status: 500 }
    );
  }
}