import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, passwordResets } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import nodemailer from 'nodemailer';

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
    const userResult = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    
    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'If an account with this email exists, you will receive a password reset link';
    
    if (userResult.length === 0) {
      return NextResponse.json({ message: successMessage });
    }

    const user = userResult[0];

    // Generate reset token
    const resetToken = nanoid(32);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in database
    await db.insert(passwordResets).values({
      id: nanoid(),
      userId: user.id,
      token: resetToken,
      expiresAt,
      createdAt: new Date()
    });

    // Send email with reset link
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset Your AxonStreamAI Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Reset Your Password</h2>
          <p>You requested a password reset for your AxonStreamAI account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: successMessage });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}