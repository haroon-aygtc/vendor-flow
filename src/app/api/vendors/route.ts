import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { vendors, activities } from '@/db/schema';
import { eq, desc, like, and } from 'drizzle-orm';
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

    const userVendors = await query.orderBy(desc(vendors.rating));

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
    const vendorData = await request.json();

    // Validate required fields
    const requiredFields = ['name', 'category', 'rating', 'onTimeDelivery', 'qualityScore', 'avgPriceVsMarket'];
    for (const field of requiredFields) {
      if (vendorData[field] === undefined || vendorData[field] === null) {
        return NextResponse.json(
          { message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const vendorId = nanoid();
    const newVendor = {
      id: vendorId,
      userId,
      name: vendorData.name,
      category: vendorData.category,
      rating: parseFloat(vendorData.rating),
      onTimeDelivery: parseFloat(vendorData.onTimeDelivery),
      qualityScore: parseFloat(vendorData.qualityScore),
      avgPriceVsMarket: parseFloat(vendorData.avgPriceVsMarket),
      completedOrders: parseInt(vendorData.completedOrders) || 0,
      performanceTrend: vendorData.performanceTrend || 'stable',
      contactInfo: vendorData.contactInfo || {},
      capabilities: vendorData.capabilities || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(vendors).values(newVendor);

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'vendor_added',
      message: `Added new vendor: ${newVendor.name}`,
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

export async function PUT(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const updatedVendor = await db.update(vendors)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(and(eq(vendors.id, id), eq(vendors.userId, userId)))
      .returning();

    if (updatedVendor.length === 0) {
      return NextResponse.json(
        { message: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Log activity
    await db.insert(activities).values({
      id: nanoid(),
      userId,
      type: 'vendor_updated',
      message: `Updated vendor: ${updatedVendor[0].name}`,
      status: 'success',
      createdAt: new Date()
    });

    return NextResponse.json({ vendor: updatedVendor[0] });
  } catch (error) {
    console.error('Update vendor error:', error);
    return NextResponse.json(
      { message: 'Failed to update vendor' },
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