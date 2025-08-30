import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vendors, activities } from '@/db/schema';
import { eq, desc, like, and } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-key';

async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development, return a default user ID
      return 'dev-user-id';
    }

    const token = authHeader.substring(7);
    if (!token || token === 'undefined' || token === 'null') {
      return 'dev-user-id';
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch (error) {
    // For development, return a default user ID instead of throwing
    return 'dev-user-id';
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = db.select().from(vendors).where(eq(vendors.userId, userId));

    if (category && category !== 'all') {
      query = query.where(and(eq(vendors.userId, userId), eq(vendors.category, category)));
    }

    if (search) {
      query = query.where(and(eq(vendors.userId, userId), like(vendors.name, `%${search}%`)));
    }

    const userVendors = await query.orderBy(desc(vendors.createdAt));

    return NextResponse.json({ vendors: userVendors });
  } catch (error) {
    console.error('Get vendors error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { 
      name, 
      category, 
      rating, 
      onTimeDelivery, 
      qualityScore, 
      avgPriceVsMarket, 
      completedOrders, 
      performanceTrend,
      contactInfo,
      capabilities
    } = await request.json();

    if (!name || !category) {
      return NextResponse.json(
        { message: 'Name and category are required' },
        { status: 400 }
      );
    }

    const vendorId = nanoid();
    const newVendor = {
      id: vendorId,
      userId,
      name,
      category,
      rating: rating || 0,
      onTimeDelivery: onTimeDelivery || 0,
      qualityScore: qualityScore || 0,
      avgPriceVsMarket: avgPriceVsMarket || 0,
      completedOrders: completedOrders || 0,
      performanceTrend: performanceTrend || 'stable',
      contactInfo: contactInfo || {},
      capabilities: capabilities || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(vendors).values(newVendor);

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'vendor_created',
      message: `Created new vendor: ${name}`,
      status: 'success',
      createdAt: new Date()
    });

    return NextResponse.json({ vendor: newVendor });
  } catch (error) {
    console.error('Create vendor error:', error);
    return NextResponse.json(
      { message: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('id');

    if (!vendorId) {
      return NextResponse.json(
        { message: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const deletedVendor = await db.delete(vendors)
      .where(and(eq(vendors.id, vendorId), eq(vendors.userId, userId)))
      .returning();

    if (deletedVendor.length === 0) {
      return NextResponse.json(
        { message: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'vendor_deleted',
      message: `Deleted vendor: ${deletedVendor[0].name}`,
      status: 'warning',
      createdAt: new Date()
    });

    return NextResponse.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    return NextResponse.json(
      { message: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}