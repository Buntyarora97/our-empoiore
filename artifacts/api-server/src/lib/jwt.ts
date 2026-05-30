import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "fallback_secret_dev_only";
const JWT_REFRESH_SECRET = process.env["JWT_REFRESH_SECRET"] ?? "fallback_refresh_secret_dev_only";

export interface UserPayload {
  userId: number;
  phone: string;
}

export interface AdminPayload {
  adminId: number;
  username: string;
  role: string;
}

export function signAccessToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function signRefreshToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): UserPayload {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
}

export function verifyRefreshToken(token: string): UserPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as UserPayload;
}

export function signAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyAdminToken(token: string): AdminPayload {
  return jwt.verify(token, JWT_SECRET) as AdminPayload;
}

export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
