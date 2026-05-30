import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, marketsTable, resultsTable, betsTable, transactionsTable, notificationsTable, appSettingsTable, adminsTable } from "@workspace/db";
import { eq, desc, ilike, sql, and, count, sum } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth";
import { signAdminToken } from "../lib/jwt";
import {
  AdminLoginBody,
  AdminUpdateUserStatusBody,
  AdminUpdateUserBalanceBody,
  AdminCreateMarketBody,
  AdminUpdateMarketBody,
  AdminAddResultBody,
  AdminUpdateResultBody,
  AdminGetUsersQueryParams,
  AdminGetDepositsQueryParams,
  AdminGetWithdrawalsQueryParams,
  AdminGetBetsQueryParams,
  AdminGetBetAnalyticsQueryParams,
  AdminGetRevenueAnalyticsQueryParams,
  AdminRejectDepositBody,
  AdminUpdateSettingsBody,
  AdminSendNotificationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/admin/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, password } = parsed.data;

  let admin = await db.select().from(adminsTable).where(eq(adminsTable.username, username)).limit(1).then(r => r[0]);

  if (!admin) {
    if (username === "admin" && password === (process.env["ADMIN_DEFAULT_PASSWORD"] ?? "admin123")) {
      const hash = await bcrypt.hash(password, 10);
      const [created] = await db.insert(adminsTable).values({ username, passwordHash: hash, role: "superadmin" }).returning();
      admin = created;
    } else {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
  } else {
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
  }

  const accessToken = signAdminToken({ adminId: admin.id, username: admin.username, role: admin.role });
  res.json({
    accessToken,
    admin: { id: admin.id, username: admin.username, role: admin.role },
  });
});

router.get("/admin/dashboard", requireAdmin, async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0]!;
  const todayStart = new Date(today + "T00:00:00.000Z");
  const todayEnd = new Date(today + "T23:59:59.999Z");

  const [totalUsersRow] = await db.select({ count: count() }).from(usersTable);
  const [newUsersTodayRow] = await db.select({ count: count() }).from(usersTable)
    .where(sql`${usersTable.createdAt} >= ${todayStart} AND ${usersTable.createdAt} <= ${todayEnd}`);
  const [betsTodayRow] = await db.select({ count: count(), total: sum(betsTable.totalAmount) }).from(betsTable)
    .where(sql`${betsTable.createdAt} >= ${todayStart} AND ${betsTable.createdAt} <= ${todayEnd}`);
  const [pendingDepositsRow] = await db.select({ count: count() }).from(transactionsTable)
    .where(and(eq(transactionsTable.type, "deposit"), eq(transactionsTable.status, "pending")));
  const [pendingWithdrawalsRow] = await db.select({ count: count() }).from(transactionsTable)
    .where(and(eq(transactionsTable.type, "withdrawal"), eq(transactionsTable.status, "pending")));
  const [activeMarketsRow] = await db.select({ count: count() }).from(marketsTable).where(eq(marketsTable.status, "active"));
  const [revenueRow] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable)
    .where(and(eq(transactionsTable.type, "deposit"), eq(transactionsTable.status, "completed")));

  res.json({
    totalUsers: totalUsersRow?.count ?? 0,
    newUsersToday: newUsersTodayRow?.count ?? 0,
    totalBetsToday: betsTodayRow?.count ?? 0,
    totalAmountToday: (betsTodayRow?.total ?? "0").toString(),
    pendingDeposits: pendingDepositsRow?.count ?? 0,
    pendingWithdrawals: pendingWithdrawalsRow?.count ?? 0,
    activeMarkets: activeMarketsRow?.count ?? 0,
    totalRevenue: (revenueRow?.total ?? "0").toString(),
  });
});

router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminGetUsersQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = params.success ? (params.data.offset ?? 0) : 0;
  const search = params.success ? params.data.search : undefined;
  const statusFilter = params.success ? params.data.status : undefined;

  let users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
  if (search) users = users.filter(u => u.fullName.includes(search) || u.phone.includes(search));
  if (statusFilter) users = users.filter(u => u.status === statusFilter);

  const [totalRow] = await db.select({ count: count() }).from(usersTable);

  const betsPerUser = await db.select({ userId: betsTable.userId, cnt: count() }).from(betsTable).groupBy(betsTable.userId);
  const betMap = new Map(betsPerUser.map(b => [b.userId, b.cnt]));

  const depositsPerUser = await db.select({ userId: transactionsTable.userId, total: sum(transactionsTable.amount) })
    .from(transactionsTable).where(and(eq(transactionsTable.type, "deposit"), eq(transactionsTable.status, "completed")))
    .groupBy(transactionsTable.userId);
  const depositMap = new Map(depositsPerUser.map(d => [d.userId, d.total ?? "0"]));

  const withdrawalsPerUser = await db.select({ userId: transactionsTable.userId, total: sum(transactionsTable.amount) })
    .from(transactionsTable).where(and(eq(transactionsTable.type, "withdrawal"), eq(transactionsTable.status, "completed")))
    .groupBy(transactionsTable.userId);
  const withdrawMap = new Map(withdrawalsPerUser.map(w => [w.userId, w.total ?? "0"]));

  res.json({
    users: users.map(u => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      balance: u.balance,
      referralCode: u.referralCode,
      referredBy: u.referredById,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      totalBets: betMap.get(u.id) ?? 0,
      totalDeposits: (depositMap.get(u.id) ?? "0").toString(),
      totalWithdrawals: (withdrawMap.get(u.id) ?? "0").toString(),
    })),
    total: totalRow?.count ?? 0,
  });
});

router.get("/admin/users/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [betsRow] = await db.select({ cnt: count() }).from(betsTable).where(eq(betsTable.userId, id));
  const [depositsRow] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable)
    .where(and(eq(transactionsTable.userId, id), eq(transactionsTable.type, "deposit"), eq(transactionsTable.status, "completed")));
  const [withdrawalsRow] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable)
    .where(and(eq(transactionsTable.userId, id), eq(transactionsTable.type, "withdrawal"), eq(transactionsTable.status, "completed")));

  res.json({
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    balance: user.balance,
    referralCode: user.referralCode,
    referredBy: user.referredById,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    totalBets: betsRow?.cnt ?? 0,
    totalDeposits: (depositsRow?.total ?? "0").toString(),
    totalWithdrawals: (withdrawalsRow?.total ?? "0").toString(),
  });
});

router.put("/admin/users/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = AdminUpdateUserStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  await db.update(usersTable).set({ status: parsed.data.status }).where(eq(usersTable.id, id));
  res.json({ message: "User status updated" });
});

router.put("/admin/users/:id/balance", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = AdminUpdateUserBalanceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const amount = parseFloat(parsed.data.amount);
  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${amount}` })
    .where(eq(usersTable.id, id));
  await db.insert(transactionsTable).values({
    userId: id,
    type: "adjustment",
    amount: parsed.data.amount,
    status: "completed",
    adminNote: parsed.data.reason,
  });
  res.json({ message: "Balance updated" });
});

router.get("/admin/markets", requireAdmin, async (_req, res): Promise<void> => {
  const markets = await db.select().from(marketsTable).orderBy(marketsTable.openTime);
  const today = new Date().toISOString().split("T")[0]!;
  const results = await db.select().from(resultsTable).where(eq(resultsTable.date, today));
  const resultsByMarket = new Map(results.map(r => [r.marketId, r]));
  res.json(markets.map(m => {
    const tr = resultsByMarket.get(m.id);
    return {
      id: m.id, name: m.name, openTime: m.openTime, closeTime: m.closeTime,
      status: m.status, minBet: m.minBet, maxBet: m.maxBet, isBettingOpen: m.isBettingOpen,
      todayResult: tr ? { id: tr.id, marketId: tr.marketId, date: tr.date, openNumber: tr.openNumber, closeNumber: tr.closeNumber, jodiNumber: tr.jodiNumber, status: tr.status } : null,
    };
  }));
});

router.post("/admin/markets", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminCreateMarketBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [market] = await db.insert(marketsTable).values({
    name: parsed.data.name,
    openTime: parsed.data.openTime,
    closeTime: parsed.data.closeTime,
    minBet: parsed.data.minBet ?? "10.00",
    maxBet: parsed.data.maxBet ?? "10000.00",
    status: parsed.data.status ?? "active",
  }).returning();
  res.status(201).json({ id: market.id, name: market.name, openTime: market.openTime, closeTime: market.closeTime, status: market.status, minBet: market.minBet, maxBet: market.maxBet, isBettingOpen: market.isBettingOpen, todayResult: null });
});

router.put("/admin/markets/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = AdminUpdateMarketBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.openTime) updates.openTime = parsed.data.openTime;
  if (parsed.data.closeTime) updates.closeTime = parsed.data.closeTime;
  if (parsed.data.minBet) updates.minBet = parsed.data.minBet;
  if (parsed.data.maxBet) updates.maxBet = parsed.data.maxBet;
  if (parsed.data.status) updates.status = parsed.data.status;
  const [market] = await db.update(marketsTable).set(updates).where(eq(marketsTable.id, id)).returning();
  if (!market) { res.status(404).json({ error: "Market not found" }); return; }
  res.json({ id: market.id, name: market.name, openTime: market.openTime, closeTime: market.closeTime, status: market.status, minBet: market.minBet, maxBet: market.maxBet, isBettingOpen: market.isBettingOpen, todayResult: null });
});

router.delete("/admin/markets/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.delete(marketsTable).where(eq(marketsTable.id, id));
  res.sendStatus(204);
});

router.post("/admin/results", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminAddResultBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [result] = await db.insert(resultsTable).values({
    marketId: parsed.data.marketId,
    date: parsed.data.date,
    openNumber: parsed.data.openNumber ?? null,
    closeNumber: parsed.data.closeNumber ?? null,
    jodiNumber: parsed.data.jodiNumber ?? null,
    status: parsed.data.status ?? "declared",
  }).returning();
  const [market] = await db.select({ name: marketsTable.name }).from(marketsTable).where(eq(marketsTable.id, result.marketId));
  res.status(201).json({ id: result.id, marketId: result.marketId, marketName: market?.name ?? "", date: result.date, openNumber: result.openNumber, closeNumber: result.closeNumber, jodiNumber: result.jodiNumber, status: result.status });
});

router.put("/admin/results/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = AdminUpdateResultBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.openNumber !== undefined) updates.openNumber = parsed.data.openNumber;
  if (parsed.data.closeNumber !== undefined) updates.closeNumber = parsed.data.closeNumber;
  if (parsed.data.jodiNumber !== undefined) updates.jodiNumber = parsed.data.jodiNumber;
  if (parsed.data.status) updates.status = parsed.data.status;
  const [result] = await db.update(resultsTable).set(updates).where(eq(resultsTable.id, id)).returning();
  if (!result) { res.status(404).json({ error: "Result not found" }); return; }
  const [market] = await db.select({ name: marketsTable.name }).from(marketsTable).where(eq(marketsTable.id, result.marketId));
  res.json({ id: result.id, marketId: result.marketId, marketName: market?.name ?? "", date: result.date, openNumber: result.openNumber, closeNumber: result.closeNumber, jodiNumber: result.jodiNumber, status: result.status });
});

router.get("/admin/transactions/deposits", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminGetDepositsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = params.success ? (params.data.offset ?? 0) : 0;
  const statusFilter = params.success ? params.data.status : undefined;

  const txs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.type, "deposit"))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit).offset(offset);

  const filtered = statusFilter ? txs.filter(t => t.status === statusFilter) : txs;
  const userIds = [...new Set(filtered.map(t => t.userId))];
  const users = userIds.length > 0 ? await db.select({ id: usersTable.id, fullName: usersTable.fullName }).from(usersTable) : [];
  const userMap = new Map(users.map(u => [u.id, u.fullName]));
  const [totalRow] = await db.select({ count: count() }).from(transactionsTable).where(eq(transactionsTable.type, "deposit"));

  res.json({
    transactions: filtered.map(t => ({
      id: t.id, userId: t.userId, type: t.type, amount: t.amount, status: t.status,
      method: t.method, utrNumber: t.utrNumber, adminNote: t.adminNote,
      createdAt: t.createdAt.toISOString(), userName: userMap.get(t.userId) ?? null,
    })),
    total: totalRow?.count ?? 0,
  });
});

router.put("/admin/transactions/deposits/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
  if (!tx) { res.status(404).json({ error: "Transaction not found" }); return; }
  if (tx.status !== "pending") { res.status(400).json({ error: "Transaction is not pending" }); return; }
  await db.update(transactionsTable).set({ status: "completed" }).where(eq(transactionsTable.id, id));
  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${parseFloat(tx.amount)}` })
    .where(eq(usersTable.id, tx.userId));
  res.json({ message: "Deposit approved" });
});

router.put("/admin/transactions/deposits/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const parsed = AdminRejectDepositBody.safeParse(req.body);
  const reason = parsed.success ? parsed.data.reason : "Rejected by admin";
  await db.update(transactionsTable).set({ status: "rejected", adminNote: reason }).where(eq(transactionsTable.id, id));
  res.json({ message: "Deposit rejected" });
});

router.get("/admin/transactions/withdrawals", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminGetWithdrawalsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = params.success ? (params.data.offset ?? 0) : 0;
  const statusFilter = params.success ? params.data.status : undefined;

  const txs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.type, "withdrawal"))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit).offset(offset);

  const filtered = statusFilter ? txs.filter(t => t.status === statusFilter) : txs;
  const users = await db.select({ id: usersTable.id, fullName: usersTable.fullName }).from(usersTable);
  const userMap = new Map(users.map(u => [u.id, u.fullName]));
  const [totalRow] = await db.select({ count: count() }).from(transactionsTable).where(eq(transactionsTable.type, "withdrawal"));

  res.json({
    transactions: filtered.map(t => ({
      id: t.id, userId: t.userId, type: t.type, amount: t.amount, status: t.status,
      method: t.method, utrNumber: t.utrNumber, adminNote: t.adminNote,
      createdAt: t.createdAt.toISOString(), userName: userMap.get(t.userId) ?? null,
    })),
    total: totalRow?.count ?? 0,
  });
});

router.put("/admin/transactions/withdrawals/:id/complete", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.update(transactionsTable).set({ status: "completed" }).where(eq(transactionsTable.id, id));
  res.json({ message: "Withdrawal marked as completed" });
});

router.put("/admin/transactions/withdrawals/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
  if (!tx) { res.status(404).json({ error: "Not found" }); return; }
  await db.update(transactionsTable).set({ status: "rejected" }).where(eq(transactionsTable.id, id));
  if (tx.status === "pending") {
    await db.update(usersTable)
      .set({ balance: sql`${usersTable.balance} + ${parseFloat(tx.amount)}` })
      .where(eq(usersTable.id, tx.userId));
  }
  res.json({ message: "Withdrawal rejected and funds returned" });
});

router.get("/admin/bets", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminGetBetsQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = params.success ? (params.data.offset ?? 0) : 0;

  const bets = await db.select().from(betsTable).orderBy(desc(betsTable.createdAt)).limit(limit).offset(offset);
  const markets = await db.select({ id: marketsTable.id, name: marketsTable.name }).from(marketsTable);
  const marketMap = new Map(markets.map(m => [m.id, m.name]));
  const [totalRow] = await db.select({ count: count() }).from(betsTable);

  res.json({
    bets: bets.map(b => ({
      id: b.id, userId: b.userId, marketId: b.marketId,
      marketName: marketMap.get(b.marketId) ?? "",
      gameType: b.gameType, numbers: b.numbers,
      totalAmount: b.totalAmount, status: b.status,
      winAmount: b.winAmount, createdAt: b.createdAt.toISOString(),
    })),
    total: totalRow?.count ?? 0,
  });
});

router.get("/admin/bets/analytics", requireAdmin, async (req, res): Promise<void> => {
  const [totalsRow] = await db.select({ count: count(), total: sum(betsTable.totalAmount) }).from(betsTable);
  const bets = await db.select({ numbers: betsTable.numbers, totalAmount: betsTable.totalAmount }).from(betsTable);

  const numberStats = new Map<string, { betCount: number; totalAmount: number }>();
  for (const bet of bets) {
    const nums = bet.numbers as Array<{ number: string; amount: string }>;
    for (const n of nums) {
      const existing = numberStats.get(n.number) ?? { betCount: 0, totalAmount: 0 };
      existing.betCount++;
      existing.totalAmount += parseFloat(n.amount);
      numberStats.set(n.number, existing);
    }
  }

  res.json({
    totalBets: totalsRow?.count ?? 0,
    totalAmount: (totalsRow?.total ?? "0").toString(),
    numberStats: Array.from(numberStats.entries())
      .map(([number, stats]) => ({ number, betCount: stats.betCount, totalAmount: stats.totalAmount.toFixed(2) }))
      .sort((a, b) => b.betCount - a.betCount)
      .slice(0, 50),
  });
});

router.get("/admin/settings", requireAdmin, async (_req, res): Promise<void> => {
  let [settings] = await db.select().from(appSettingsTable).limit(1);
  if (!settings) {
    [settings] = await db.insert(appSettingsTable).values({}).returning();
  }
  res.json({
    appName: settings.appName,
    whatsappNumber: settings.whatsappNumber,
    telegramLink: settings.telegramLink,
    maintenanceMode: settings.maintenanceMode,
    minDeposit: settings.minDeposit,
    minWithdrawal: settings.minWithdrawal,
    referralCommission: settings.referralCommission,
    upiIds: settings.upiIds as string[],
  });
});

router.put("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminUpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.appName != null) updates.appName = parsed.data.appName;
  if (parsed.data.whatsappNumber != null) updates.whatsappNumber = parsed.data.whatsappNumber;
  if (parsed.data.telegramLink != null) updates.telegramLink = parsed.data.telegramLink;
  if (parsed.data.maintenanceMode != null) updates.maintenanceMode = parsed.data.maintenanceMode;
  if (parsed.data.minDeposit != null) updates.minDeposit = parsed.data.minDeposit;
  if (parsed.data.minWithdrawal != null) updates.minWithdrawal = parsed.data.minWithdrawal;
  if (parsed.data.referralCommission != null) updates.referralCommission = parsed.data.referralCommission;
  if (parsed.data.upiIds != null) updates.upiIds = parsed.data.upiIds;

  let [settings] = await db.select().from(appSettingsTable).limit(1);
  if (!settings) {
    [settings] = await db.insert(appSettingsTable).values(updates as Record<string, unknown>).returning();
  } else {
    [settings] = await db.update(appSettingsTable).set(updates).where(eq(appSettingsTable.id, settings.id)).returning();
  }
  res.json({
    appName: settings.appName,
    whatsappNumber: settings.whatsappNumber,
    telegramLink: settings.telegramLink,
    maintenanceMode: settings.maintenanceMode,
    minDeposit: settings.minDeposit,
    minWithdrawal: settings.minWithdrawal,
    referralCommission: settings.referralCommission,
    upiIds: settings.upiIds as string[],
  });
});

router.post("/admin/notifications/send", requireAdmin, async (req, res): Promise<void> => {
  const parsed = AdminSendNotificationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { title, message, targetType, targetUserIds } = parsed.data;

  let userIds: number[] = [];
  if (targetType === "specific" && targetUserIds && targetUserIds.length > 0) {
    userIds = targetUserIds;
  } else {
    const users = await db.select({ id: usersTable.id }).from(usersTable);
    userIds = users.map(u => u.id);
  }

  for (const userId of userIds) {
    await db.insert(notificationsTable).values({ userId, title, message });
  }

  res.json({ message: `Notification sent to ${userIds.length} users` });
});

router.get("/admin/analytics/revenue", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminGetRevenueAnalyticsQueryParams.safeParse(req.query);
  const period = params.success ? (params.data.period ?? "week") : "week";

  const days = period === "month" ? 30 : period === "year" ? 365 : 7;
  const data: Array<{ date: string; revenue: string; deposits: string; withdrawals: string }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]!;
    const dayStart = new Date(dateStr + "T00:00:00.000Z");
    const dayEnd = new Date(dateStr + "T23:59:59.999Z");

    const [depositsRow] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable)
      .where(and(
        eq(transactionsTable.type, "deposit"),
        eq(transactionsTable.status, "completed"),
        sql`${transactionsTable.createdAt} >= ${dayStart} AND ${transactionsTable.createdAt} <= ${dayEnd}`
      ));
    const [withdrawalsRow] = await db.select({ total: sum(transactionsTable.amount) }).from(transactionsTable)
      .where(and(
        eq(transactionsTable.type, "withdrawal"),
        eq(transactionsTable.status, "completed"),
        sql`${transactionsTable.createdAt} >= ${dayStart} AND ${transactionsTable.createdAt} <= ${dayEnd}`
      ));

    const deps = parseFloat((depositsRow?.total ?? "0").toString());
    const wths = parseFloat((withdrawalsRow?.total ?? "0").toString());
    data.push({
      date: dateStr,
      deposits: deps.toFixed(2),
      withdrawals: wths.toFixed(2),
      revenue: (deps - wths).toFixed(2),
    });
  }

  const totalRevenue = data.reduce((s, d) => s + parseFloat(d.revenue), 0);
  const totalDeposits = data.reduce((s, d) => s + parseFloat(d.deposits), 0);
  const totalWithdrawals = data.reduce((s, d) => s + parseFloat(d.withdrawals), 0);

  res.json({
    period,
    totalRevenue: totalRevenue.toFixed(2),
    totalDeposits: totalDeposits.toFixed(2),
    totalWithdrawals: totalWithdrawals.toFixed(2),
    data,
  });
});

export default router;
