import { Router, type IRouter } from "express";
import { db, marketsTable, resultsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/markets", async (_req, res): Promise<void> => {
  const markets = await db.select().from(marketsTable).where(eq(marketsTable.status, "active")).orderBy(marketsTable.openTime);
  const today = new Date().toISOString().split("T")[0];

  const results = await db.select().from(resultsTable).where(eq(resultsTable.date, today!));
  const resultsByMarket = new Map(results.map(r => [r.marketId, r]));

  res.json(markets.map(m => {
    const todayResult = resultsByMarket.get(m.id);
    return {
      id: m.id,
      name: m.name,
      openTime: m.openTime,
      closeTime: m.closeTime,
      status: m.status,
      minBet: m.minBet,
      maxBet: m.maxBet,
      isBettingOpen: m.isBettingOpen,
      todayResult: todayResult ? {
        id: todayResult.id,
        marketId: todayResult.marketId,
        date: todayResult.date,
        openNumber: todayResult.openNumber,
        closeNumber: todayResult.closeNumber,
        jodiNumber: todayResult.jodiNumber,
        status: todayResult.status,
      } : null,
    };
  }));
});

router.get("/markets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid market ID" });
    return;
  }

  const [market] = await db.select().from(marketsTable).where(eq(marketsTable.id, id));
  if (!market) {
    res.status(404).json({ error: "Market not found" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const [todayResult] = await db.select().from(resultsTable).where(
    eq(resultsTable.marketId, id)
  ).orderBy(desc(resultsTable.date)).limit(1);

  res.json({
    id: market.id,
    name: market.name,
    openTime: market.openTime,
    closeTime: market.closeTime,
    status: market.status,
    minBet: market.minBet,
    maxBet: market.maxBet,
    isBettingOpen: market.isBettingOpen,
    todayResult: todayResult?.date === today ? {
      id: todayResult.id,
      marketId: todayResult.marketId,
      date: todayResult.date,
      openNumber: todayResult.openNumber,
      closeNumber: todayResult.closeNumber,
      jodiNumber: todayResult.jodiNumber,
      status: todayResult.status,
    } : null,
  });
});

router.get("/markets/:id/results", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw ?? "", 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid market ID" });
    return;
  }

  const results = await db.select().from(resultsTable)
    .where(eq(resultsTable.marketId, id))
    .orderBy(desc(resultsTable.date))
    .limit(30);

  const [market] = await db.select({ name: marketsTable.name }).from(marketsTable).where(eq(marketsTable.id, id));

  res.json(results.map(r => ({
    id: r.id,
    marketId: r.marketId,
    marketName: market?.name ?? "",
    date: r.date,
    openNumber: r.openNumber,
    closeNumber: r.closeNumber,
    jodiNumber: r.jodiNumber,
    status: r.status,
  })));
});

export default router;
