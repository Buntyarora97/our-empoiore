import { pgTable, text, serial, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketsTable = pgTable("markets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  openTime: text("open_time").notNull(),
  closeTime: text("close_time").notNull(),
  status: text("status").notNull().default("active"),
  minBet: numeric("min_bet", { precision: 10, scale: 2 }).notNull().default("10.00"),
  maxBet: numeric("max_bet", { precision: 10, scale: 2 }).notNull().default("10000.00"),
  isBettingOpen: boolean("is_betting_open").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMarketSchema = createInsertSchema(marketsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof marketsTable.$inferSelect;
