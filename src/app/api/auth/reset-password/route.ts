import { NextRequest, NextResponse } from 'next/server';

// Mock user database - replace with real database
const users = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@aiorch.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', // password123
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json(
        { message: 'If an account with this email exists, you will receive a password reset link' },
        { status: 200 }
      );
    }

    // In production, you would:
    // 1. Generate a secure reset token
    // 2. Store it in database with expiration
    // 3. Send email with reset link
    // 4. Handle the reset process

    // For demo purposes, we'll just return success
    console.log(`Password reset requested for: ${email}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      message: 'If an account with this email exists, you will receive a password reset link'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}