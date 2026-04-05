import type { DrillAnalysis } from "@/lib/api";

export type AnnotationEvent = {
  drillId: number;
  attempt: number;
  label: "New PB" | "Regression";
  color: string;
  value: number;
};

export type SessionHistoryItem = {
  sessionId: number;
  sessionStartedAt: string;
  drillIds: number[];
  drillNames: string[];
  entries: Array<{
    id: number;
    drillId: number;
    drillName: string;
    timeEntered: number;
    pass: boolean;
    createdAt: string;
  }>;
  passCount: number;
  failCount: number;
  bestTime: number | null;
  worstTime: number | null;
};

export const DRILL_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#7c3aed"] as const;

export function formatSeconds(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(2)}s`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function getDrillColor(index: number): string {
  return DRILL_COLORS[index % DRILL_COLORS.length] ?? DRILL_COLORS[0];
}

export function findAnnotations(drills: DrillAnalysis[]): AnnotationEvent[] {
  const annotations: AnnotationEvent[] = [];

  for (const drill of drills) {
    let bestTime = Number.POSITIVE_INFINITY;
    let passStreak = 0;
    let failStreak = 0;

    drill.entries.forEach((entry, index) => {
      const attempt = index + 1;

      if (index > 0 && entry.timeEntered < bestTime) {
        annotations.push({
          drillId: drill.drillId,
          attempt,
          label: "New PB",
          color: "#16a34a",
          value: entry.timeEntered,
        });
      }

      bestTime = Math.min(bestTime, entry.timeEntered);

      if (entry.pass) {
        passStreak += 1;
        failStreak = 0;
        return;
      }

      const priorPassStreak = passStreak;
      failStreak += 1;
      passStreak = 0;

      if (priorPassStreak >= 10 && failStreak >= 3) {
        annotations.push({
          drillId: drill.drillId,
          attempt,
          label: "Regression",
          color: "#dc2626",
          value: entry.timeEntered,
        });
      }
    });
  }

  return annotations;
}

export function buildSessionHistory(drills: DrillAnalysis[]): SessionHistoryItem[] {
  const sessionMap = new Map<number, SessionHistoryItem>();

  for (const drill of drills) {
    for (const entry of drill.entries) {
      const existing = sessionMap.get(entry.sessionId);

      if (existing) {
        if (!existing.drillIds.includes(drill.drillId)) {
          existing.drillIds.push(drill.drillId);
          existing.drillNames.push(drill.drillName);
        }

        existing.entries.push({
          id: entry.id,
          drillId: drill.drillId,
          drillName: drill.drillName,
          timeEntered: entry.timeEntered,
          pass: entry.pass,
          createdAt: entry.createdAt,
        });
        existing.passCount += entry.pass ? 1 : 0;
        existing.failCount += entry.pass ? 0 : 1;
        existing.bestTime = existing.bestTime === null ? entry.timeEntered : Math.min(existing.bestTime, entry.timeEntered);
        existing.worstTime = existing.worstTime === null ? entry.timeEntered : Math.max(existing.worstTime, entry.timeEntered);
        continue;
      }

      sessionMap.set(entry.sessionId, {
        sessionId: entry.sessionId,
        sessionStartedAt: entry.sessionStartedAt,
        drillIds: [drill.drillId],
        drillNames: [drill.drillName],
        entries: [
          {
            id: entry.id,
            drillId: drill.drillId,
            drillName: drill.drillName,
            timeEntered: entry.timeEntered,
            pass: entry.pass,
            createdAt: entry.createdAt,
          },
        ],
        passCount: entry.pass ? 1 : 0,
        failCount: entry.pass ? 0 : 1,
        bestTime: entry.timeEntered,
        worstTime: entry.timeEntered,
      });
    }
  }

  return [...sessionMap.values()]
    .map((session) => ({
      ...session,
      drillIds: [...session.drillIds].sort((left, right) => left - right),
      drillNames: [...session.drillNames].sort((left, right) => left.localeCompare(right)),
      entries: [...session.entries].sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      ),
    }))
    .sort((left, right) => new Date(right.sessionStartedAt).getTime() - new Date(left.sessionStartedAt).getTime());
}

export function buildHistogram(values: number[], bucketCount = 15) {
  if (values.length === 0) {
    return [];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const rawSize = span === 0 ? 0.1 : span / bucketCount;
  const bucketSize = Number(Math.max(rawSize, 0.1).toFixed(2));

  const bins = Array.from({ length: bucketCount }, (_, index) => {
    const start = Number((min + index * bucketSize).toFixed(2));
    const end = Number((start + bucketSize).toFixed(2));
    return {
      bucket: `${start.toFixed(2)}-${end.toFixed(2)}s`,
      mid: Number(((start + end) / 2).toFixed(2)),
      count: 0,
    };
  });

  values.forEach((value) => {
    const index = span === 0 ? 0 : Math.min(Math.floor((value - min) / bucketSize), bucketCount - 1);
    const target = bins[index];
    if (target) {
      target.count += 1;
    }
  });

  return bins;
}

export function computeConsistencyScore(values: number[]): number {
  if (values.length <= 1) {
    return 100;
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) {
    return 100;
  }

  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const stdev = Math.sqrt(variance);
  const coefficientOfVariation = (stdev / mean) * 100;

  return Math.max(0, Math.min(100, Number((100 - coefficientOfVariation).toFixed(1))));
}
