import { Router, type IRouter } from "express";
import { db, resultsTable, marketsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/results/recent", async (_req, res): Promise<void> => {
  const results = await db.select().from(resultsTable)
    .orderBy(desc(resultsTable.date), desc(resultsTable.createdAt))
    .limit(50);

  const markets = await db.select({ id: marketsTable.id, name: marketsTable.name }).from(marketsTable);
  const marketMap = new Map(markets.map(m => [m.id, m.name]));

  res.json(results.map(r => ({
    id: r.id,
    marketId: r.marketId,
    marketName: marketMap.get(r.marketId) ?? "",
    date: r.date,
    openNumber: r.openNumber,
    closeNumber: r.closeNumber,
    jodiNumber: r.jodiNumber,
    status: r.status,
  })));
});

export default router;
