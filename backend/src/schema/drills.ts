import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { shooters } from "./shooters";

export const drills = pgTable("drills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  timeStandard: text("time_standard").notNull(),
  targetZones: text("target_zones").array().notNull().default(sql`'{}'::text[]`),
  createdBy: integer("created_by").references(() => shooters.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
