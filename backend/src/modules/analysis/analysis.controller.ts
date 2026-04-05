import { Controller, Get, Headers, Param, ParseIntPipe, Query } from "@nestjs/common";
import type { AnalysisService } from "./analysis.service";

@Controller("analysis")
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get("shooter/:id")
  getShooterAnalysis(
    @Param("id", ParseIntPipe) shooterId: number,
    @Query("drills") drillsQuery?: string,
    @Headers("x-shooter-id") requesterIdHeader?: string,
    @Headers("x-shooter-admin") isAdminHeader?: string,
  ) {
    return this.analysisService.getShooterAnalysis(
      shooterId,
      this.parseDrillIds(drillsQuery),
      this.parseRequesterId(requesterIdHeader),
      isAdminHeader === "true",
    );
  }

  private parseRequesterId(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private parseDrillIds(value?: string): number[] {
    if (!value) {
      return [];
    }

    return value
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((part) => !Number.isNaN(part));
  }
}
