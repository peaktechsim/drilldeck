import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { drills } from "./drills";
import { shooters } from "./shooters";

export const trainingSessions = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  createdBy: integer("created_by")
    .references(() => shooters.id)
    .notNull(),
  drillOrder: text("drill_order").notNull().default("manual"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const sessionShooters = pgTable("session_shooters", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => trainingSessions.id)
    .notNull(),
  shooterId: integer("shooter_id")
    .references(() => shooters.id)
    .notNull(),
  position: integer("position").notNull(),
});

export const sessionDrills = pgTable("session_drills", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => trainingSessions.id)
    .notNull(),
  drillId: integer("drill_id")
    .references(() => drills.id)
    .notNull(),
  position: integer("position").notNull(),
});

export const sessionEntries = pgTable("session_entries", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .references(() => trainingSessions.id)
    .notNull(),
  shooterId: integer("shooter_id")
    .references(() => shooters.id)
    .notNull(),
  drillId: integer("drill_id")
    .references(() => drills.id)
    .notNull(),
  timeEntered: text("time_entered").notNull(),
  pass: boolean("pass").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
