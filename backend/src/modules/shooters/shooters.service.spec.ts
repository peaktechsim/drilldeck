import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcrypt";
import { shooterLockouts, shooters } from "../../schema";
import { ShootersService } from "./shooters.service";

jest.mock("drizzle-orm", () => {
  const actual = jest.requireActual("drizzle-orm") as Record<string, unknown>;

  return {
    ...actual,
    eq: (column: unknown, value: unknown) => ({ op: "eq", column, value }),
    gt: (column: unknown, value: unknown) => ({ op: "gt", column, value }),
    and: (...conditions: unknown[]) => ({ op: "and", conditions }),
  };
});

type ShooterRow = typeof shooters.$inferSelect;
type LockoutRow = typeof shooterLockouts.$inferSelect;

class FakeDb {
  shooters: ShooterRow[] = [];
  lockouts: LockoutRow[] = [];
  shooterId = 1;
  lockoutId = 1;

  select(selection?: Record<string, unknown>) {
    return new FakeSelectBuilder(this, selection);
  }

  insert(table: unknown) {
    return new FakeInsertBuilder(this, table);
  }

  update(table: unknown) {
    return new FakeUpdateBuilder(this, table);
  }
}

class FakeSelectBuilder {
  private table?: unknown;
  private rows: Record<string, unknown>[] = [];

  constructor(
    private readonly db: FakeDb,
    private readonly selection?: Record<string, unknown>,
  ) {}

  from(table: unknown) {
    this.table = table;
    this.rows = this.getTableRows(table).map((row) => ({ ...row }));
    return this;
  }

  where(condition: any) {
    this.rows = this.rows.filter((row) => matchesCondition(row, condition));
    return this;
  }

  limit(count: number) {
    return this.materialize().slice(0, count);
  }

  then(resolve: (value: unknown[]) => unknown, reject?: (reason?: unknown) => unknown) {
    return Promise.resolve(this.materialize()).then(resolve, reject);
  }

  private materialize() {
    if (!this.selection) {
      return this.rows;
    }

    return this.rows.map((row) => {
      const picked: Record<string, unknown> = {};
      for (const key of Object.keys(this.selection ?? {})) {
        picked[key] = row[key];
      }
      return picked;
    });
  }

  private getTableRows(table: unknown) {
    if (table === shooters) return this.db.shooters;
    if (table === shooterLockouts) return this.db.lockouts;
    return [];
  }
}

class FakeInsertBuilder {
  private insertedRow: Record<string, unknown> | undefined;

  constructor(
    private readonly db: FakeDb,
    private readonly table: unknown,
  ) {}

  values(values: Record<string, unknown>) {
    if (this.table === shooters) {
      const row: ShooterRow = {
        id: this.db.shooterId++,
        email: String(values.email),
        pin: String(values.pin),
        name: String(values.name),
        rifle: (values.rifle as string | null | undefined) ?? null,
        pistol: (values.pistol as string | null | undefined) ?? null,
        isAdmin: false,
        createdAt: new Date(),
      };
      this.db.shooters.push(row);
      this.insertedRow = row;
      return this;
    }

    if (this.table === shooterLockouts) {
      const row: LockoutRow = {
        id: this.db.lockoutId++,
        targetShooterId: Number(values.targetShooterId),
        failedAttempts: Number(values.failedAttempts ?? 0),
        lockedUntil: (values.lockedUntil as Date | null | undefined) ?? null,
      };
      this.db.lockouts.push(row);
      this.insertedRow = row;
      return this;
    }

    return this;
  }

  returning() {
    return this.insertedRow ? [{ ...this.insertedRow }] : [];
  }
}

class FakeUpdateBuilder {
  private changes: Record<string, unknown> = {};
  private condition: any;

  constructor(
    private readonly db: FakeDb,
    private readonly table: unknown,
  ) {}

  set(changes: Record<string, unknown>) {
    this.changes = changes;
    return this;
  }

  where(condition: any) {
    this.condition = condition;
    const rows = this.getTableRows().filter((row) => matchesCondition(row, condition));
    for (const row of rows) {
      Object.assign(row, this.changes);
    }
    return this;
  }

  returning() {
    return this.getTableRows()
      .filter((row) => matchesCondition(row, this.condition))
      .map((row) => ({ ...row }));
  }

  private getTableRows() {
    if (this.table === shooters) return this.db.shooters;
    if (this.table === shooterLockouts) return this.db.lockouts;
    return [] as Record<string, unknown>[];
  }
}

function matchesCondition(row: Record<string, unknown>, condition: any): boolean {
  if (!condition) return true;
  if (condition.op === "and")
    return condition.conditions.every((entry: any) => matchesCondition(row, entry));

  const key = columnToPropertyName(condition.column);
  const current = row[key];

  if (condition.op === "eq") return current === condition.value;
  if (condition.op === "gt") return Number(current) > Number(condition.value);
  return true;
}

function columnToPropertyName(column: any): string {
  const raw = String(column?.name ?? column?.config?.name ?? "");
  return raw.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

describe("ShootersService", () => {
  let db: FakeDb;
  let service: ShootersService;

  beforeEach(() => {
    db = new FakeDb();
    service = new ShootersService(db as any);
  });

  it("hashes PIN on registration", async () => {
    const shooter = await service.register({
      email: "alex@example.com",
      name: "Alex",
      pin: "1234",
      rifle: "AR",
      pistol: "Glock",
    });

    expect(shooter).not.toHaveProperty("pin");
    expect(db.shooters).toHaveLength(1);
    expect(db.shooters[0].pin).not.toBe("1234");
    expect(await bcrypt.compare("1234", db.shooters[0].pin)).toBe(true);
  });

  it("verifyPin succeeds with the correct PIN", async () => {
    const registered = await service.register({
      email: "sam@example.com",
      name: "Sam",
      pin: "4321",
    });

    db.lockouts.push({
      id: 1,
      targetShooterId: registered.id,
      failedAttempts: 3,
      lockedUntil: null,
    });

    const shooter = await service.verifyPin({ email: "sam@example.com", pin: "4321" });

    expect(shooter.email).toBe("sam@example.com");
    expect(shooter).not.toHaveProperty("pin");
    expect(db.lockouts[0].failedAttempts).toBe(0);
    expect(db.lockouts[0].lockedUntil).toBeNull();
  });

  it("verifyPin fails with the wrong PIN", async () => {
    await service.register({
      email: "pat@example.com",
      name: "Pat",
      pin: "9999",
    });

    await expect(
      service.verifyPin({ email: "pat@example.com", pin: "0000" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(db.lockouts).toHaveLength(1);
    expect(db.lockouts[0].failedAttempts).toBe(1);
    expect(db.lockouts[0].lockedUntil).toBeNull();
  });

  it("locks the shooter after 5 failed attempts", async () => {
    await service.register({
      email: "lock@example.com",
      name: "Lock",
      pin: "2468",
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        service.verifyPin({ email: "lock@example.com", pin: "1111" }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }

    expect(db.lockouts).toHaveLength(1);
    expect(db.lockouts[0].failedAttempts).toBe(5);
    expect(db.lockouts[0].lockedUntil).toBeInstanceOf(Date);

    await expect(
      service.verifyPin({ email: "lock@example.com", pin: "2468" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("blocks non-admins from reading or updating other shooters", async () => {
    const one = await service.register({ email: "one@example.com", name: "One", pin: "1111" });
    const two = await service.register({ email: "two@example.com", name: "Two", pin: "2222" });

    await expect(service.getById(two.id, one.id, false)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.update(two.id, { name: "Nope" }, one.id, false)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("throws when the shooter does not exist", async () => {
    await expect(service.getById(999, 999, true)).rejects.toBeInstanceOf(NotFoundException);
  });
});
