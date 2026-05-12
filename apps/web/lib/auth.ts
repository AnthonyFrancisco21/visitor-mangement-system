import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'vms_session';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'fallback-dev-secret-change-in-prod'
);

export type SessionPayload = {
  userId: string;
  role: 'ADMIN' | 'RECEPTIONIST';
};

/**
 * Signs a JWT with user payload and returns the token string.
 */
export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);
}

/**
 * Verifies a JWT string and returns the payload, or null if invalid.
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Sets the session cookie after login.
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });
}

/**
 * Reads and verifies the session cookie.
 * Returns the session payload or null if not authenticated.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Deletes the session cookie (logout).
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
