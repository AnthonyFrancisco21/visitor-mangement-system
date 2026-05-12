import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';

const LoginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

/**
 * POST /api/auth/login
 * Authenticates a user (Admin or Receptionist) and creates a session.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Look up user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Use generic message to avoid user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Verify password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // Create session cookie
    await createSession({ userId: user.id, role: user.role });

    return NextResponse.json({
      success: true,
      role: user.role,
      name: user.name,
    });
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
