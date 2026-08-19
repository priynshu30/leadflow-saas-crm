import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface SuperAdminSession {
  adminId: number;
  email: string;
  name: string;
  isSuperAdmin: true;
}

const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ||
    process.env.JWT_SECRET ||
    "leadflow_super_admin_secret_key_2026_separate_auth"
);

export const ADMIN_COOKIE_NAME = "admin_session";

export async function createAdminSessionToken(
  admin: Omit<SuperAdminSession, "isSuperAdmin">
): Promise<string> {
  return new SignJWT({ ...admin, isSuperAdmin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(ADMIN_JWT_SECRET);
}

export async function verifyAdminSessionToken(
  token: string
): Promise<SuperAdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    if (!payload.isSuperAdmin || !payload.adminId) {
      return null;
    }
    return payload as unknown as SuperAdminSession;
  } catch (error) {
    return null;
  }
}

export async function getAdminSession(): Promise<SuperAdminSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function requireAdminSession(): Promise<SuperAdminSession> {
  const session = await getAdminSession();
  if (!session || !session.adminId || !session.isSuperAdmin) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }
  return session;
}

export function setAdminSessionCookie(token: string) {
  cookies().set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function clearAdminSessionCookie() {
  cookies().delete(ADMIN_COOKIE_NAME);
}
