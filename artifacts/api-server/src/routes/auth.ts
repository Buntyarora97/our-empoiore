import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, otpsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  RegisterUserBody,
  LoginUserBody,
  RefreshTokenBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "@workspace/api-zod";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateReferralCode,
} from "../lib/jwt";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { fullName, phone, email, password, referralCode } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (existing.length > 0) {
    res.status(400).json({ error: "Phone number already registered" });
    return;
  }

  let referredById: number | undefined;
  if (referralCode) {
    const referrer = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode));
    if (referrer.length > 0) {
      referredById = referrer[0].id;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let newReferralCode = generateReferralCode();
  let codeExists = true;
  while (codeExists) {
    const check = await db.select().from(usersTable).where(eq(usersTable.referralCode, newReferralCode));
    if (check.length === 0) codeExists = false;
    else newReferralCode = generateReferralCode();
  }

  const [user] = await db.insert(usersTable).values({
    fullName,
    phone,
    email: email ?? null,
    passwordHash,
    referralCode: newReferralCode,
    referredById: referredById ?? null,
    status: "active",
  }).returning();

  const accessToken = signAccessToken({ userId: user.id, phone: user.phone });
  const refreshToken = signRefreshToken({ userId: user.id, phone: user.phone });

  res.status(201).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      balance: user.balance,
      referralCode: user.referralCode,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) {
    res.status(401).json({ error: "Invalid phone or password" });
    return;
  }

  if (user.status === "blocked") {
    res.status(401).json({ error: "Account blocked. Contact support." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid phone or password" });
    return;
  }

  const accessToken = signAccessToken({ userId: user.id, phone: user.phone });
  const refreshToken = signRefreshToken({ userId: user.id, phone: user.phone });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      balance: user.balance,
      referralCode: user.referralCode,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const parsed = RefreshTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    const accessToken = signAccessToken({ userId: payload.userId, phone: payload.phone });
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
  if (!user) {
    res.json({ message: "If the number is registered, an OTP has been sent" });
    return;
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await db.insert(otpsTable).values({ phone, otp, expiresAt });
  req.log.info({ phone, otp }, "OTP generated (would send via SMS in production)");
  res.json({ message: "OTP sent" });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { phone, otp, newPassword } = parsed.data;

  const now = new Date();
  const [otpRecord] = await db.select().from(otpsTable).where(
    and(
      eq(otpsTable.phone, phone),
      eq(otpsTable.otp, otp),
      eq(otpsTable.used, false),
      gt(otpsTable.expiresAt, now),
    )
  );

  if (!otpRecord) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.phone, phone));
  await db.update(otpsTable).set({ used: true }).where(eq(otpsTable.id, otpRecord.id));

  res.json({ message: "Password reset successfully" });
});

export default router;
