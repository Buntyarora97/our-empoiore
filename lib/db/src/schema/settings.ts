import { pgTable, text, serial, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const appSettingsTable = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  appName: text("app_name").notNull().default("Our Empire"),
  whatsappNumber: text("whatsapp_number").notNull().default(""),
  telegramLink: text("telegram_link").notNull().default(""),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  minDeposit: text("min_deposit").notNull().default("100"),
  minWithdrawal: text("min_withdrawal").notNull().default("200"),
  referralCommission: text("referral_commission").notNull().default("5"),
  upiIds: jsonb("upi_ids").notNull().default([]).$type<string[]>(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;

export const insertAppSettingsSchema = createInsertSchema(appSettingsTable).omit({ id: true });
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettingsTable.$inferSelect;
