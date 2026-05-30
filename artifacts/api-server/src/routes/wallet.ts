import { Router, type IRouter } from "express";
import { db, transactionsTable, usersTable, appSettingsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import {
  RequestAddMoneyBody,
  RequestWithdrawalBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/wallet/add-money", requireAuth, async (req, res): Promise<void> => {
  const parsed = RequestAddMoneyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, utrNumber, method } = parsed.data;
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const [tx] = await db.insert(transactionsTable).values({
    userId: req.user!.userId,
    type: "deposit",
    amount,
    status: "pending",
    method: method ?? "upi",
    utrNumber,
  }).returning();

  res.status(201).json({
    id: tx.id,
    userId: tx.userId,
    type: tx.type,
    amount: tx.amount,
    status: tx.status,
    method: tx.method,
    utrNumber: tx.utrNumber,
    adminNote: tx.adminNote,
    createdAt: tx.createdAt.toISOString(),
    userName: null,
  });
});

router.post("/wallet/withdraw", requireAuth, async (req, res): Promise<void> => {
  const parsed = RequestWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, method, upiId, accountNumber, ifscCode, accountHolderName } = parsed.data;
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user || parseFloat(user.balance) < amountNum) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} - ${amountNum}` })
    .where(eq(usersTable.id, req.user!.userId));

  const [tx] = await db.insert(transactionsTable).values({
    userId: req.user!.userId,
    type: "withdrawal",
    amount,
    status: "pending",
    method: method ?? "upi",
    upiId: upiId ?? null,
    accountNumber: accountNumber ?? null,
    ifscCode: ifscCode ?? null,
    accountHolderName: accountHolderName ?? null,
  }).returning();

  res.status(201).json({
    id: tx.id,
    userId: tx.userId,
    type: tx.type,
    amount: tx.amount,
    status: tx.status,
    method: tx.method,
    utrNumber: tx.utrNumber,
    adminNote: tx.adminNote,
    createdAt: tx.createdAt.toISOString(),
    userName: null,
  });
});

router.get("/wallet/transactions", requireAuth, async (req, res): Promise<void> => {
  const limit = parseInt(String(req.query.limit ?? "20"), 10);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);
  const typeFilter = req.query.type as string | undefined;

  const txs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, req.user!.userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const filtered = typeFilter ? txs.filter(t => t.type === typeFilter) : txs;

  res.json(filtered.map(t => ({
    id: t.id,
    userId: t.userId,
    type: t.type,
    amount: t.amount,
    status: t.status,
    method: t.method,
    utrNumber: t.utrNumber,
    adminNote: t.adminNote,
    createdAt: t.createdAt.toISOString(),
    userName: null,
  })));
});

router.get("/wallet/upi-info", requireAuth, async (req, res): Promise<void> => {
  const [settings] = await db.select().from(appSettingsTable).limit(1);
  const upiIds = (settings?.upiIds as string[]) ?? [];
  res.json({
    upiId: upiIds[0] ?? "",
    qrCodeUrl: null,
  });
});

export default router;
