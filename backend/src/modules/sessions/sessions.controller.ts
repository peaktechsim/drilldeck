import { Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import type { AddShooterDto, CreateSessionDto, RecordEntryDto, SetDrillsDto } from "./dto";
import { SessionsService } from "./sessions.service";

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Body() dto: CreateSessionDto, @Headers("x-shooter-id") shooterIdHeader?: string) {
    return this.sessionsService.create({
      ...dto,
      createdBy: this.parseRequesterId(shooterIdHeader),
    });
  }

  @Get(":id")
  getById(@Param("id", ParseIntPipe) id: number) {
    return this.sessionsService.getById(id);
  }

  @Post(":id/shooters")
  addShooter(@Param("id", ParseIntPipe) id: number, @Body() dto: AddShooterDto) {
    return this.sessionsService.addShooter(id, dto);
  }

  @Post(":id/drills")
  setDrills(@Param("id", ParseIntPipe) id: number, @Body() dto: SetDrillsDto) {
    return this.sessionsService.setDrills(id, dto);
  }

  @Post(":id/entries")
  recordEntry(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: Omit<RecordEntryDto, "sessionId">,
  ) {
    return this.sessionsService.recordEntry({
      ...dto,
      sessionId: id,
    });
  }

  @Patch(":id/complete")
  complete(@Param("id", ParseIntPipe) id: number) {
    return this.sessionsService.complete(id);
  }

  private parseRequesterId(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
