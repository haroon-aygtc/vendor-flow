import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, activities } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { unlink } from 'fs/promises';
import { join } from 'path';

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

    const userDocuments = await db.select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));

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

    // Get document details before deletion
    const documentResult = await db.select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (documentResult.length === 0) {
      return NextResponse.json(
        { message: 'Document not found' },
        { status: 404 }
      );
    }

    const document = documentResult[0];

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'uploads', document.url.replace('/uploads/', ''));
      await unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await db.delete(documents).where(eq(documents.id, documentId));

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'document_deleted',
      message: `Deleted document: ${document.name}`,
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