import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, transactionsTable, betsTable, notificationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  UpdateProfileBody,
  ChangePasswordBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/user/profile", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    balance: user.balance,
    referralCode: user.referralCode,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  });
});

router.put("/user/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.fullName != null) updates["fullName"] = parsed.data.fullName;
  if (parsed.data.email !== undefined) updates["email"] = parsed.data.email;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.userId)).returning();
  res.json({
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    balance: user.balance,
    referralCode: user.referralCode,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/user/balance", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select({ balance: usersTable.balance }).from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ balance: user.balance });
});

router.post("/user/change-password", requireAuth, async (req, res): Promise<void> => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }
  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, req.user!.userId));
  res.json({ message: "Password changed successfully" });
});

router.get("/user/referrals", requireAuth, async (req, res): Promise<void> => {
  const referrals = await db.select({
    id: usersTable.id,
    fullName: usersTable.fullName,
    phone: usersTable.phone,
    createdAt: usersTable.createdAt,
  }).from(usersTable).where(eq(usersTable.referredById, req.user!.userId)).orderBy(desc(usersTable.createdAt));

  res.json(referrals.map(r => ({
    id: r.id,
    fullName: r.fullName,
    phone: r.phone,
    createdAt: r.createdAt.toISOString(),
    earnings: "0.00",
  })));
});

router.get("/user/analytics", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const bets = await db.select().from(betsTable).where(eq(betsTable.userId, userId));
  const totalBets = bets.length;
  const totalWagered = bets.reduce((s, b) => s + parseFloat(b.totalAmount), 0);
  const wonBets = bets.filter(b => b.status === "won");
  const totalWon = wonBets.reduce((s, b) => s + parseFloat(b.winAmount ?? "0"), 0);
  const totalLost = bets.filter(b => b.status === "lost").reduce((s, b) => s + parseFloat(b.totalAmount), 0);
  const winRate = totalBets > 0 ? (wonBets.length / totalBets) * 100 : 0;

  res.json({
    totalBets,
    totalWagered: totalWagered.toFixed(2),
    totalWon: totalWon.toFixed(2),
    totalLost: totalLost.toFixed(2),
    winRate: Math.round(winRate * 100) / 100,
    favoriteMarket: null,
    profitLoss: (totalWon - totalWagered).toFixed(2),
  });
});

router.get("/user/notifications", requireAuth, async (req, res): Promise<void> => {
  const notifs = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(notifs.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.post("/user/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.userId, req.user!.userId));
  res.json({ message: "All notifications marked as read" });
});

export default router;
