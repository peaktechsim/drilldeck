import { describe, expect, it } from "@jest/globals";
import { AnalysisService } from "./analysis.service";

describe("AnalysisService.computeStats", () => {
  const service = new AnalysisService({} as never);

  it("computes personal best, average, pass rate, attempts, and current streak", () => {
    const stats = service.computeStats([
      {
        timeEntered: "2.5",
        pass: true,
        createdAt: new Date("2026-04-01T10:00:00Z"),
        sessionStartedAt: new Date("2026-04-01T09:55:00Z"),
      },
      {
        timeEntered: "3.0",
        pass: false,
        createdAt: new Date("2026-04-02T10:00:00Z"),
        sessionStartedAt: new Date("2026-04-02T09:55:00Z"),
      },
      {
        timeEntered: "2.0",
        pass: true,
        createdAt: new Date("2026-04-03T10:00:00Z"),
        sessionStartedAt: new Date("2026-04-03T09:55:00Z"),
      },
      {
        timeEntered: "2.2",
        pass: true,
        createdAt: new Date("2026-04-04T10:00:00Z"),
        sessionStartedAt: new Date("2026-04-04T09:55:00Z"),
      },
    ]);

    expect(stats).toEqual({
      personalBest: 2,
      average: 2.42,
      passRate: 75,
      totalAttempts: 4,
      currentStreak: {
        type: "pass",
        count: 2,
      },
    });
  });

  it("returns nulls and zeros for empty entry lists", () => {
    expect(service.computeStats([])).toEqual({
      personalBest: null,
      average: null,
      passRate: 0,
      totalAttempts: 0,
      currentStreak: {
        type: null,
        count: 0,
      },
    });
  });

  it("detects a failing streak from the end of the timeline", () => {
    const stats = service.computeStats([
      {
        timeEntered: "2.1",
        pass: true,
        createdAt: new Date("2026-04-01T10:00:00Z"),
        sessionStartedAt: new Date("2026-04-01T09:55:00Z"),
      },
      {
        timeEntered: "2.8",
        pass: false,
        createdAt: new Date("2026-04-02T10:00:00Z"),
        sessionStartedAt: new Date("2026-04-02T09:55:00Z"),
      },
      {
        timeEntered: "2.9",
        pass: false,
        createdAt: new Date("2026-04-03T10:00:00Z"),
        sessionStartedAt: new Date("2026-04-03T09:55:00Z"),
      },
    ]);

    expect(stats.currentStreak).toEqual({
      type: "fail",
      count: 2,
    });
  });
});
