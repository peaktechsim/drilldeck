import { sql } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { shooters } from "./shooters";

export const drills = pgTable("drills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  timeStandard: text("time_standard").notNull(),
  distance: text("distance").notNull().default("7"),
  targetZones: text("target_zones").array().notNull().default(sql`'{}'::text[]`),
  weapons: text("weapons").array().notNull().default(sql`'{pistol}'::text[]`),
  createdBy: integer("created_by").references(() => shooters.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
