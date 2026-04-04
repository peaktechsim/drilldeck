import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const shooters = pgTable("shooters", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  pin: text("pin").notNull(),
  name: text("name").notNull(),
  rifle: text("rifle"),
  pistol: text("pistol"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shooterLockouts = pgTable("shooter_lockouts", {
  id: serial("id").primaryKey(),
  targetShooterId: integer("target_shooter_id").references(() => shooters.id).notNull(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
});
