import { NextRequest, NextResponse } from 'next/server';
import { databaseAIProviderService } from '@/services/databaseAIProviderService';

export async function GET() {
  try {
    const providers = await databaseAIProviderService.getProviders();
    return NextResponse.json(providers);
  } catch (error) {
    console.error('Failed to get providers:', error);
    return NextResponse.json([], { status: 200 }); // Return empty array on error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = await databaseAIProviderService.createProvider(body);
    return NextResponse.json(provider);
  } catch (error) {
    console.error('Failed to create provider:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create provider' },
      { status: 500 }
    );
  }
}