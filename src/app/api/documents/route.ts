import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, activities } from '@/db/schema';
import { eq, desc, like, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
  return decoded.userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = db.select().from(documents).where(eq(documents.userId, userId));

    if (search) {
      query = query.where(and(eq(documents.userId, userId), like(documents.name, `%${search}%`)));
    }

    const userDocuments = await query.orderBy(desc(documents.createdAt));

    return NextResponse.json({ documents: userDocuments });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json(
        { message: 'Document ID is required' },
        { status: 400 }
      );
    }

    const deletedDocument = await db.delete(documents)
      .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
      .returning();

    if (deletedDocument.length === 0) {
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    }

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'document_deleted',
      message: `Deleted document: ${deletedDocument[0].name}`,
      status: 'warning',
      createdAt: new Date()
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { message: 'Failed to delete document' },
      { status: 500 }
    );
  }
}