import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import {
  drills,
  sessionDrills,
  sessionEntries,
  sessionShooters,
  trainingSessions,
} from "../../schema";
import { SessionsService } from "./sessions.service";

jest.mock("drizzle-orm", () => {
  const actual = jest.requireActual("drizzle-orm") as Record<string, unknown>;

  return {
    ...actual,
    eq: (column: unknown, value: unknown) => ({ op: "eq", column, value }),
  };
});

type SessionRow = typeof trainingSessions.$inferSelect;
type SessionShooterRow = typeof sessionShooters.$inferSelect;
type SessionDrillRow = typeof sessionDrills.$inferSelect;
type SessionEntryRow = typeof sessionEntries.$inferSelect;
type DrillRow = typeof drills.$inferSelect;

class FakeDb {
  trainingSessions: SessionRow[] = [];
  sessionShooters: SessionShooterRow[] = [];
  sessionDrills: SessionDrillRow[] = [];
  sessionEntries: SessionEntryRow[] = [];
  drills: DrillRow[] = [];
  trainingSessionId = 1;
  sessionShooterId = 1;
  sessionDrillId = 1;
  sessionEntryId = 1;
  drillId = 1;

  select() {
    return new FakeSelectBuilder(this);
  }

  insert(table: unknown) {
    return new FakeInsertBuilder(this, table);
  }

  update(table: unknown) {
    return new FakeUpdateBuilder(this, table);
  }

  delete(table: unknown) {
    return new FakeDeleteBuilder(this, table);
  }
}

class FakeSelectBuilder {
  private rows: Record<string, unknown>[] = [];

  constructor(private readonly db: FakeDb) {}

  from(table: unknown) {
    this.rows = this.getTableRows(table).map((row) => ({ ...row }));
    return this;
  }

  where(condition: any) {
    this.rows = this.rows.filter((row) => matchesCondition(row, condition));
    return this;
  }

  limit(count: number) {
    return this.rows.slice(0, count);
  }

  then(resolve: (value: unknown[]) => unknown, reject?: (reason?: unknown) => unknown) {
    return Promise.resolve(this.rows).then(resolve, reject);
  }

  private getTableRows(table: unknown) {
    if (table === trainingSessions) return this.db.trainingSessions;
    if (table === sessionShooters) return this.db.sessionShooters;
    if (table === sessionDrills) return this.db.sessionDrills;
    if (table === sessionEntries) return this.db.sessionEntries;
    if (table === drills) return this.db.drills;
    return [];
  }
}

class FakeInsertBuilder {
  private insertedRows: Record<string, unknown>[] = [];

  constructor(
    private readonly db: FakeDb,
    private readonly table: unknown,
  ) {}

  values(values: Record<string, unknown> | Record<string, unknown>[]) {
    const entries = Array.isArray(values) ? values : [values];

    for (const entry of entries) {
      if (this.table === trainingSessions) {
        const row: SessionRow = {
          id: this.db.trainingSessionId++,
          createdBy: Number(entry.createdBy),
          drillOrder: String(entry.drillOrder ?? "manual"),
          startedAt: new Date(),
          completedAt: (entry.completedAt as Date | null | undefined) ?? null,
        };
        this.db.trainingSessions.push(row);
        this.insertedRows.push(row);
        continue;
      }

      if (this.table === sessionShooters) {
        const row: SessionShooterRow = {
          id: this.db.sessionShooterId++,
          sessionId: Number(entry.sessionId),
          shooterId: Number(entry.shooterId),
          position: Number(entry.position),
        };
        this.db.sessionShooters.push(row);
        this.insertedRows.push(row);
        continue;
      }

      if (this.table === sessionDrills) {
        const row: SessionDrillRow = {
          id: this.db.sessionDrillId++,
          sessionId: Number(entry.sessionId),
          drillId: Number(entry.drillId),
          position: Number(entry.position),
        };
        this.db.sessionDrills.push(row);
        this.insertedRows.push(row);
        continue;
      }

      if (this.table === sessionEntries) {
        const row: SessionEntryRow = {
          id: this.db.sessionEntryId++,
          sessionId: Number(entry.sessionId),
          shooterId: Number(entry.shooterId),
          drillId: Number(entry.drillId),
          timeEntered: String(entry.timeEntered),
          pass: Boolean(entry.pass),
          createdAt: new Date(),
        };
        this.db.sessionEntries.push(row);
        this.insertedRows.push(row);
        continue;
      }

      if (this.table === drills) {
        const row: DrillRow = {
          id: this.db.drillId++,
          name: String(entry.name),
          description: String(entry.description),
          timeStandard: String(entry.timeStandard),
          distance: String(entry.distance ?? "7"),
          targetZones: (entry.targetZones as string[]) ?? [],
          createdBy: (entry.createdBy as number | null | undefined) ?? null,
          createdAt: new Date(),
        };
        this.db.drills.push(row);
        this.insertedRows.push(row);
      }
    }

    return this;
  }

  returning() {
    return this.insertedRows.map((row) => ({ ...row }));
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
    if (this.table === trainingSessions) return this.db.trainingSessions;
    return [] as Record<string, unknown>[];
  }
}

class FakeDeleteBuilder {
  constructor(
    private readonly db: FakeDb,
    private readonly table: unknown,
  ) {}

  where(condition: any) {
    const rows = this.getTableRows();
    const kept = rows.filter((row) => !matchesCondition(row, condition));
    rows.splice(0, rows.length, ...kept);
    return Promise.resolve();
  }

  private getTableRows() {
    if (this.table === sessionDrills) return this.db.sessionDrills;
    return [] as Record<string, unknown>[];
  }
}

function matchesCondition(row: Record<string, unknown>, condition: any): boolean {
  if (!condition) return true;

  const key = columnToPropertyName(condition.column);
  const current = row[key];

  if (condition.op === "eq") return current === condition.value;
  return true;
}

function columnToPropertyName(column: any): string {
  const raw = String(column?.name ?? column?.config?.name ?? "");
  return raw.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

describe("SessionsService", () => {
  let db: FakeDb;
  let shootersService: { verifyPin: jest.Mock };
  let service: SessionsService;

  beforeEach(() => {
    db = new FakeDb();
    shootersService = {
      verifyPin: jest.fn(async () => ({ id: 22, email: "sam@example.com", name: "Sam" })),
    };
    service = new SessionsService(db as any, shootersService as any);
  });

  it("creates a session", async () => {
    const session = await service.create({ createdBy: 7, drillOrder: "manual" });

    expect(session.createdBy).toBe(7);
    expect(db.trainingSessions).toHaveLength(1);
  });

  it("adds a shooter after PIN verification", async () => {
    const session = await service.create({ createdBy: 7 });

    const joined = await service.addShooter(session.id, {
      email: "sam@example.com",
      pin: "4321",
      position: 2,
    });

    expect(shootersService.verifyPin).toHaveBeenCalledWith({
      email: "sam@example.com",
      pin: "4321",
    });
    expect(joined.shooterId).toBe(22);
    expect(joined.position).toBe(2);
  });

  it("replaces drill list in order", async () => {
    const session = await service.create({ createdBy: 7 });
    db.sessionDrills.push({ id: 1, sessionId: session.id, drillId: 99, position: 1 });

    const updated = await service.setDrills(session.id, { drillIds: [3, 4] });

    expect(updated).toHaveLength(2);
    expect(db.sessionDrills.map((entry) => entry.drillId)).toEqual([3, 4]);
    expect(db.sessionDrills.map((entry) => entry.position)).toEqual([1, 2]);
  });

  it("marks an entry as pass when time is within the standard", async () => {
    const session = await service.create({ createdBy: 7 });
    db.drills.push({
      id: 5,
      name: "Bill Drill",
      description: "Six shots",
      timeStandard: "2.5",
      distance: "7",
      targetZones: ["A"],
      createdBy: 7,
      createdAt: new Date(),
    });

    const entry = await service.recordEntry({
      sessionId: session.id,
      shooterId: 22,
      drillId: 5,
      timeEntered: "2.40",
    });

    expect(entry.pass).toBe(true);
  });

  it("marks an entry as fail when time exceeds the standard", async () => {
    const session = await service.create({ createdBy: 7 });
    db.drills.push({
      id: 6,
      name: "Bill Drill",
      description: "Six shots",
      timeStandard: "2.5",
      distance: "7",
      targetZones: ["A"],
      createdBy: 7,
      createdAt: new Date(),
    });

    const entry = await service.recordEntry({
      sessionId: session.id,
      shooterId: 22,
      drillId: 6,
      timeEntered: "2.75",
    });

    expect(entry.pass).toBe(false);
  });

  it("returns session details with shooters, drills, and entries", async () => {
    const session = await service.create({ createdBy: 7 });
    db.sessionShooters.push({ id: 1, sessionId: session.id, shooterId: 22, position: 1 });
    db.sessionDrills.push({ id: 1, sessionId: session.id, drillId: 5, position: 1 });
    db.sessionEntries.push({
      id: 1,
      sessionId: session.id,
      shooterId: 22,
      drillId: 5,
      timeEntered: "2.40",
      pass: true,
      createdAt: new Date(),
    });

    const details = await service.getById(session.id);

    expect(details.session.id).toBe(session.id);
    expect(details.shooters).toHaveLength(1);
    expect(details.drills).toHaveLength(1);
    expect(details.entries).toHaveLength(1);
  });

  it("completes a session", async () => {
    const session = await service.create({ createdBy: 7 });

    const completed = await service.complete(session.id);

    expect(completed.completedAt).toBeInstanceOf(Date);
  });

  it("throws when the session does not exist", async () => {
    await expect(service.getById(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});
