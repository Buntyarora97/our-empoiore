import { pgTable, text, serial, timestamp, numeric, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const betsTable = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  marketId: integer("market_id").notNull(),
  gameType: text("game_type").notNull(),
  numbers: jsonb("numbers").notNull().$type<Array<{ number: string; amount: string }>>(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  winAmount: numeric("win_amount", { precision: 12, scale: 2 }),
  resultId: integer("result_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBetSchema = createInsertSchema(betsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof betsTable.$inferSelect;
