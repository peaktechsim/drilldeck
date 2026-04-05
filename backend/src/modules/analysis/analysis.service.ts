import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { and, asc, eq, inArray } from "drizzle-orm";
import { DRIZZLE } from "../../config/drizzle.module";
import type { Database } from "../../config/database";
import { drills, sessionEntries, trainingSessions } from "../../schema";

type AnalysisEntry = {
  id?: number;
  sessionId?: number;
  shooterId?: number;
  drillId?: number;
  timeEntered: string | number;
  pass: boolean;
  createdAt?: Date;
  sessionStartedAt?: Date;
};

type StreakType = "pass" | "fail" | null;

type ComputedStats = {
  personalBest: number | null;
  average: number | null;
  passRate: number;
  totalAttempts: number;
  currentStreak: {
    type: StreakType;
    count: number;
  };
};

type DrillAnalysis = {
  drillId: number;
  drillName: string;
  timeStandard: number;
  stats: ComputedStats;
  entries: Array<{
    id: number;
    sessionId: number;
    shooterId: number;
    drillId: number;
    timeEntered: number;
    pass: boolean;
    createdAt: Date;
    sessionStartedAt: Date;
  }>;
};

@Injectable()
export class AnalysisService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  computeStats(entries: AnalysisEntry[]): ComputedStats {
    if (entries.length === 0) {
      return {
        personalBest: null,
        average: null,
        passRate: 0,
        totalAttempts: 0,
        currentStreak: {
          type: null,
          count: 0,
        },
      };
    }

    const orderedEntries = [...entries].sort((left, right) => {
      const leftStartedAt = left.sessionStartedAt?.getTime() ?? 0;
      const rightStartedAt = right.sessionStartedAt?.getTime() ?? 0;

      if (leftStartedAt !== rightStartedAt) {
        return leftStartedAt - rightStartedAt;
      }

      const leftCreatedAt = left.createdAt?.getTime() ?? 0;
      const rightCreatedAt = right.createdAt?.getTime() ?? 0;

      return leftCreatedAt - rightCreatedAt;
    });

    const times = orderedEntries.map((entry) => Number.parseFloat(String(entry.timeEntered)));
    const passedAttempts = orderedEntries.filter((entry) => entry.pass).length;
    const totalAttempts = orderedEntries.length;
    const lastPass = orderedEntries[totalAttempts - 1]?.pass ?? null;

    let streakCount = 0;

    if (lastPass !== null) {
      for (let index = totalAttempts - 1; index >= 0; index -= 1) {
        if (orderedEntries[index]?.pass !== lastPass) {
          break;
        }

        streakCount += 1;
      }
    }

    return {
      personalBest: roundToTwo(Math.min(...times)),
      average: roundToTwo(times.reduce((sum, time) => sum + time, 0) / totalAttempts),
      passRate: roundToTwo((passedAttempts / totalAttempts) * 100),
      totalAttempts,
      currentStreak: {
        type: lastPass === null ? null : lastPass ? "pass" : "fail",
        count: streakCount,
      },
    };
  }

  async getShooterAnalysis(shooterId: number, drillIds: number[], requesterId?: number, isAdmin = false) {
    this.assertSelfOrAdmin(shooterId, requesterId, isAdmin);

    if (drillIds.length === 0) {
      return {
        shooterId,
        drills: [],
      };
    }

    const drillRows = await this.db
      .select({
        id: drills.id,
        name: drills.name,
        timeStandard: drills.timeStandard,
      })
      .from(drills)
      .where(inArray(drills.id, drillIds));

    const entryRows = await this.db
      .select({
        id: sessionEntries.id,
        sessionId: sessionEntries.sessionId,
        shooterId: sessionEntries.shooterId,
        drillId: sessionEntries.drillId,
        timeEntered: sessionEntries.timeEntered,
        pass: sessionEntries.pass,
        createdAt: sessionEntries.createdAt,
        sessionStartedAt: trainingSessions.startedAt,
      })
      .from(sessionEntries)
      .innerJoin(trainingSessions, eq(trainingSessions.id, sessionEntries.sessionId))
      .where(and(eq(sessionEntries.shooterId, shooterId), inArray(sessionEntries.drillId, drillIds)))
      .orderBy(asc(trainingSessions.startedAt), asc(sessionEntries.createdAt));

    const entriesByDrill = new Map<number, typeof entryRows>();

    for (const entry of entryRows) {
      const drillEntryList = entriesByDrill.get(entry.drillId) ?? [];
      drillEntryList.push(entry);
      entriesByDrill.set(entry.drillId, drillEntryList);
    }

    const requestedDrills = drillIds
      .map((drillId) => drillRows.find((drill) => drill.id === drillId))
      .filter((drill): drill is (typeof drillRows)[number] => drill !== undefined);

    const analysis: DrillAnalysis[] = requestedDrills.map((drill) => {
      const drillEntries = entriesByDrill.get(drill.id) ?? [];

      return {
        drillId: drill.id,
        drillName: drill.name,
        timeStandard: Number.parseFloat(drill.timeStandard),
        stats: this.computeStats(drillEntries),
        entries: drillEntries.map((entry) => ({
          id: entry.id,
          sessionId: entry.sessionId,
          shooterId: entry.shooterId,
          drillId: entry.drillId,
          timeEntered: Number.parseFloat(entry.timeEntered),
          pass: entry.pass,
          createdAt: entry.createdAt,
          sessionStartedAt: entry.sessionStartedAt,
        })),
      };
    });

    return {
      shooterId,
      drills: analysis,
    };
  }

  private assertSelfOrAdmin(targetId: number, requesterId?: number, isAdmin = false): void {
    if (!isAdmin && requesterId !== targetId) {
      throw new ForbiddenException("You can only access your own analysis");
    }
  }
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
