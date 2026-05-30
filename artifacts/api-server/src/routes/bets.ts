import { Router, type IRouter } from "express";
import { db, betsTable, marketsTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { PlaceBetBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/bets/place", requireAuth, async (req, res): Promise<void> => {
  const parsed = PlaceBetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { marketId, gameType, numbers, totalAmount } = parsed.data;

  const [market] = await db.select().from(marketsTable).where(eq(marketsTable.id, marketId));
  if (!market) {
    res.status(400).json({ error: "Market not found" });
    return;
  }
  if (!market.isBettingOpen || market.status !== "active") {
    res.status(400).json({ error: "Betting is closed for this market" });
    return;
  }

  const amount = parseFloat(totalAmount);
  if (isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: "Invalid bet amount" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  if (parseFloat(user.balance) < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }
  if (amount < parseFloat(market.minBet)) {
    res.status(400).json({ error: `Minimum bet is ${market.minBet}` });
    return;
  }
  if (amount > parseFloat(market.maxBet)) {
    res.status(400).json({ error: `Maximum bet is ${market.maxBet}` });
    return;
  }

  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} - ${amount}` })
    .where(eq(usersTable.id, req.user!.userId));

  const [bet] = await db.insert(betsTable).values({
    userId: req.user!.userId,
    marketId,
    gameType,
    numbers: numbers as Array<{ number: string; amount: string }>,
    totalAmount,
    status: "pending",
  }).returning();

  await db.insert(transactionsTable).values({
    userId: req.user!.userId,
    type: "bet",
    amount: totalAmount,
    status: "completed",
    adminNote: `Bet #${bet.id} on ${market.name}`,
  });

  res.status(201).json({
    id: bet.id,
    userId: bet.userId,
    marketId: bet.marketId,
    marketName: market.name,
    gameType: bet.gameType,
    numbers: bet.numbers,
    totalAmount: bet.totalAmount,
    status: bet.status,
    winAmount: bet.winAmount,
    createdAt: bet.createdAt.toISOString(),
  });
});

router.get("/bets/my-bets", requireAuth, async (req, res): Promise<void> => {
  const limit = parseInt(String(req.query.limit ?? "20"), 10);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);
  const statusFilter = req.query.status as string | undefined;
  const marketIdFilter = req.query.marketId ? parseInt(String(req.query.marketId), 10) : undefined;

  let query = db.select().from(betsTable).where(eq(betsTable.userId, req.user!.userId));

  const bets = await db.select().from(betsTable)
    .where(eq(betsTable.userId, req.user!.userId))
    .orderBy(desc(betsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const marketIds = [...new Set(bets.map(b => b.marketId))];
  const markets = marketIds.length > 0 ? await db.select({ id: marketsTable.id, name: marketsTable.name }).from(marketsTable) : [];
  const marketMap = new Map(markets.map(m => [m.id, m.name]));

  const filtered = bets
    .filter(b => !statusFilter || b.status === statusFilter)
    .filter(b => !marketIdFilter || b.marketId === marketIdFilter);

  res.json(filtered.map(b => ({
    id: b.id,
    userId: b.userId,
    marketId: b.marketId,
    marketName: marketMap.get(b.marketId) ?? "",
    gameType: b.gameType,
    numbers: b.numbers,
    totalAmount: b.totalAmount,
    status: b.status,
    winAmount: b.winAmount,
    createdAt: b.createdAt.toISOString(),
  })));
});

router.get("/bets/winnings", requireAuth, async (req, res): Promise<void> => {
  const wonBets = await db.select().from(betsTable).where(
    and(eq(betsTable.userId, req.user!.userId), eq(betsTable.status, "won"))
  ).orderBy(desc(betsTable.createdAt));

  const totalWinnings = wonBets.reduce((s, b) => s + parseFloat(b.winAmount ?? "0"), 0);

  const markets = await db.select({ id: marketsTable.id, name: marketsTable.name }).from(marketsTable);
  const marketMap = new Map(markets.map(m => [m.id, m.name]));

  res.json({
    totalWinnings: totalWinnings.toFixed(2),
    bets: wonBets.map(b => ({
      id: b.id,
      userId: b.userId,
      marketId: b.marketId,
      marketName: marketMap.get(b.marketId) ?? "",
      gameType: b.gameType,
      numbers: b.numbers,
      totalAmount: b.totalAmount,
      status: b.status,
      winAmount: b.winAmount,
      createdAt: b.createdAt.toISOString(),
    })),
  });
});

router.post("/bets/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid bet ID" });
    return;
  }

  const [bet] = await db.select().from(betsTable).where(
    and(eq(betsTable.id, id), eq(betsTable.userId, req.user!.userId))
  );
  if (!bet) {
    res.status(404).json({ error: "Bet not found" });
    return;
  }
  if (bet.status !== "pending") {
    res.status(400).json({ error: "Only pending bets can be cancelled" });
    return;
  }

  await db.update(betsTable).set({ status: "cancelled" }).where(eq(betsTable.id, id));
  await db.update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${parseFloat(bet.totalAmount)}` })
    .where(eq(usersTable.id, req.user!.userId));

  res.json({ message: "Bet cancelled and refunded" });
});

export default router;
