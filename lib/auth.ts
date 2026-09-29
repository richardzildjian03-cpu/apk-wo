import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import type { Role } from "./constants";
import { INTERNAL_ROLES } from "./constants";

const COOKIE_NAME = "wo_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "wo-app-secret-key-ubah-di-produksi-2026",
);

export type SessionUser = {
  id: number;
  nama: string;
  role: Role;
};

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(): string {
  return randomBytes(16).toString("hex");
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ id: user.id, nama: user.nama, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.id !== "number" || typeof payload.nama !== "string") return null;
    return { id: payload.id, nama: payload.nama, role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await requireUser();
  if (!roles.includes(session.role)) {
    redirect(session.role === "KLIEN" ? "/klien" : "/dashboard");
  }
  return session;
}

export async function requireInternal(): Promise<SessionUser> {
  return requireRole(...INTERNAL_ROLES);
}

export function homePathFor(role: Role): string {
  return role === "KLIEN" ? "/klien" : "/dashboard";
}
