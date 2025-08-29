import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiProviders, activities } from '@/db/schema';
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

    const userProviders = await db.select()
      .from(aiProviders)
      .where(eq(aiProviders.userId, userId))
      .orderBy(desc(aiProviders.createdAt));

    return NextResponse.json({ providers: userProviders });
  } catch (error) {
    console.error('Get AI providers error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch AI providers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { name, type, apiKey, endpoint, model, rateLimitRpm, rateLimitTpm } = await request.json();

    if (!name || !type || !apiKey) {
      return NextResponse.json(
        { message: 'Name, type, and API key are required' },
        { status: 400 }
      );
    }

    // Validate provider type
    const validTypes = ['openai', 'anthropic', 'google', 'azure', 'cohere', 'huggingface'];
    if (!validTypes.includes(type.toLowerCase())) {
      return NextResponse.json(
        { message: 'Invalid provider type' },
        { status: 400 }
      );
    }

    // Test the API key by making a simple request
    let isValidKey = false;
    try {
      switch (type.toLowerCase()) {
        case 'openai':
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          });
          isValidKey = openaiResponse.ok;
          break;

        case 'anthropic':
          const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-3-sonnet-20240229',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'test' }],
            }),
          });
          isValidKey = anthropicResponse.status !== 401;
          break;

        case 'google':
          const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
          isValidKey = googleResponse.ok;
          break;

        default:
          isValidKey = true; // Skip validation for other providers
      }
    } catch (error) {
      console.error('API key validation error:', error);
      isValidKey = false;
    }

    if (!isValidKey) {
      return NextResponse.json(
        { message: 'Invalid API key or provider configuration' },
        { status: 400 }
      );
    }

    const providerId = nanoid();
    const newProvider = {
      id: providerId,
      userId,
      name,
      type: type.toLowerCase(),
      apiKey, // In production, encrypt this
      endpoint: endpoint || null,
      model: model || null,
      isActive: true,
      rateLimitRpm: rateLimitRpm || null,
      rateLimitTpm: rateLimitTpm || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(aiProviders).values(newProvider);

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'ai_provider_added',
      message: `Added new AI provider: ${name} (${type})`,
      status: 'success',
      createdAt: new Date()
    });

    // Return provider without API key
    const { apiKey: _, ...providerWithoutKey } = newProvider;
    return NextResponse.json({ provider: providerWithoutKey });
  } catch (error) {
    console.error('Create AI provider error:', error);
    return NextResponse.json(
      { message: 'Failed to create AI provider' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { id, name, endpoint, model, isActive, rateLimitRpm, rateLimitTpm } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const updatedProvider = await db.update(aiProviders)
      .set({
        name,
        endpoint,
        model,
        isActive,
        rateLimitRpm,
        rateLimitTpm,
        updatedAt: new Date()
      })
      .where(eq(aiProviders.id, id))
      .returning();

    if (updatedProvider.length === 0) {
      return NextResponse.json(
        { message: 'Provider not found' },
        { status: 404 }
      );
    }

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'ai_provider_updated',
      message: `Updated AI provider: ${name}`,
      status: 'success',
      createdAt: new Date()
    });

    // Return provider without API key
    const { apiKey: _, ...providerWithoutKey } = updatedProvider[0];
    return NextResponse.json({ provider: providerWithoutKey });
  } catch (error) {
    console.error('Update AI provider error:', error);
    return NextResponse.json(
      { message: 'Failed to update AI provider' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('id');

    if (!providerId) {
      return NextResponse.json(
        { message: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const deletedProvider = await db.delete(aiProviders)
      .where(eq(aiProviders.id, providerId))
      .returning();

    if (deletedProvider.length === 0) {
      return NextResponse.json(
        { message: 'Provider not found' },
        { status: 404 }
      );
    }

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'ai_provider_deleted',
      message: `Deleted AI provider: ${deletedProvider[0].name}`,
      status: 'warning',
      createdAt: new Date()
    });

    return NextResponse.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('Delete AI provider error:', error);
    return NextResponse.json(
      { message: 'Failed to delete AI provider' },
      { status: 500 }
    );
  }
}