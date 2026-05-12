import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Destroys the user's session cookie.
 */
export async function POST(): Promise<NextResponse> {
  await deleteSession();
  return NextResponse.json({ success: true });
}
