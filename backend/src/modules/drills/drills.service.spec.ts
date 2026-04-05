import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { drills } from "../../schema";
import { DrillsService } from "./drills.service";

jest.mock("drizzle-orm", () => {
  const actual = jest.requireActual("drizzle-orm") as Record<string, unknown>;

  return {
    ...actual,
    eq: (column: unknown, value: unknown) => ({ op: "eq", column, value }),
  };
});

type DrillRow = typeof drills.$inferSelect;

class FakeDb {
  drills: DrillRow[] = [];
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
    if (table === drills) return this.db.drills;
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
    if (this.table === drills) {
      const row: DrillRow = {
        id: this.db.drillId++,
        name: String(values.name),
        description: String(values.description),
        timeStandard: String(values.timeStandard),
        distance: String(values.distance ?? "7"),
        targetZones: (values.targetZones as string[]) ?? [],
        createdBy: (values.createdBy as number | null | undefined) ?? null,
        createdAt: new Date(),
      };
      this.db.drills.push(row);
      this.insertedRow = row;
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
    if (this.table === drills) return this.db.drills;
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

describe("DrillsService", () => {
  let db: FakeDb;
  let service: DrillsService;

  beforeEach(() => {
    db = new FakeDb();
    service = new DrillsService(db as any);
  });

  it("creates a drill", async () => {
    const drill = await service.create({
      name: "Bill Drill",
      description: "Six shots from the holster",
      timeStandard: "2.5s",
      targetZones: ["A", "C"],
      createdBy: 7,
    });

    expect(db.drills).toHaveLength(1);
    expect(drill.name).toBe("Bill Drill");
    expect(drill.distance).toBe("7");
    expect(drill.targetZones).toEqual(["A", "C"]);
    expect(drill.createdBy).toBe(7);
  });

  it("lists all drills", async () => {
    await service.create({
      name: "El Presidente",
      description: "Classic classifier",
      timeStandard: "10s",
      targetZones: ["A", "C", "D"],
    });
    await service.create({
      name: "Dot Torture",
      description: "Accuracy test",
      timeStandard: "No standard",
      targetZones: ["A"],
    });

    const all = await service.findAll();

    expect(all).toHaveLength(2);
    expect(all.map((entry) => entry.name)).toEqual(["El Presidente", "Dot Torture"]);
  });

  it("finds a drill by id", async () => {
    const created = await service.create({
      name: "Blake Drill",
      description: "Transitions drill",
      timeStandard: "3.5s",
      targetZones: ["A"],
    });

    const drill = await service.findById(created.id);

    expect(drill.id).toBe(created.id);
    expect(drill.description).toBe("Transitions drill");
  });

  it("updates a drill", async () => {
    const created = await service.create({
      name: "One Reload One",
      description: "Reload practice",
      timeStandard: "4s",
      targetZones: ["A", "C"],
    });

    const updated = await service.update(created.id, {
      description: "Reload practice with movement",
      timeStandard: "4.5s",
      targetZones: ["A", "D"],
    });

    expect(updated.name).toBe("One Reload One");
    expect(updated.description).toBe("Reload practice with movement");
    expect(updated.timeStandard).toBe("4.5s");
    expect(updated.targetZones).toEqual(["A", "D"]);
  });

  it("throws when the drill does not exist", async () => {
    await expect(service.findById(999)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.update(999, { name: "Nope" })).rejects.toBeInstanceOf(NotFoundException);
  });
});
