import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { Database } from "../../config/database";
import { DRIZZLE } from "../../config/drizzle.module";
import {
  drills,
  sessionDrills,
  sessionEntries,
  sessionShooters,
  trainingSessions,
} from "../../schema";
import { ShootersService } from "../shooters/shooters.service";
import type { AddShooterDto, CreateSessionDto, RecordEntryDto, SetDrillsDto } from "./dto";

type SessionRow = typeof trainingSessions.$inferSelect;
type SessionShooterRow = typeof sessionShooters.$inferSelect;
type SessionDrillRow = typeof sessionDrills.$inferSelect;
type SessionEntryRow = typeof sessionEntries.$inferSelect;

type SessionDetails = {
  session: SessionRow;
  shooters: SessionShooterRow[];
  drills: SessionDrillRow[];
  entries: SessionEntryRow[];
};

@Injectable()
export class SessionsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly shootersService: ShootersService,
  ) {}

  async create(dto: CreateSessionDto): Promise<SessionRow> {
    if (dto.createdBy === undefined) {
      throw new NotFoundException("Created by shooter is required");
    }

    const [created] = await this.db
      .insert(trainingSessions)
      .values({
        createdBy: dto.createdBy,
        drillOrder: dto.drillOrder ?? "manual",
      })
      .returning();

    return created;
  }

  async getById(id: number): Promise<SessionDetails> {
    const session = await this.findSessionById(id);
    const [shooters, drillsForSession, entries] = await Promise.all([
      this.db.select().from(sessionShooters).where(eq(sessionShooters.sessionId, id)),
      this.db.select().from(sessionDrills).where(eq(sessionDrills.sessionId, id)),
      this.db.select().from(sessionEntries).where(eq(sessionEntries.sessionId, id)),
    ]);

    return {
      session,
      shooters,
      drills: drillsForSession,
      entries,
    };
  }

  async addShooter(sessionId: number, dto: AddShooterDto): Promise<SessionShooterRow> {
    await this.findSessionById(sessionId);
    const shooter = await this.shootersService.verifyPin({ email: dto.email, pin: dto.pin });

    const [created] = await this.db
      .insert(sessionShooters)
      .values({
        sessionId,
        shooterId: shooter.id,
        position: dto.position,
      })
      .returning();

    return created;
  }

  async setDrills(sessionId: number, dto: SetDrillsDto): Promise<SessionDrillRow[]> {
    await this.findSessionById(sessionId);

    await this.db.delete(sessionDrills).where(eq(sessionDrills.sessionId, sessionId));

    if (dto.drillIds.length === 0) {
      return [];
    }

    return this.db
      .insert(sessionDrills)
      .values(
        dto.drillIds.map((drillId, index) => ({
          sessionId,
          drillId,
          position: index + 1,
        })),
      )
      .returning();
  }

  async recordEntry(dto: RecordEntryDto): Promise<SessionEntryRow> {
    await this.findSessionById(dto.sessionId);

    const [drill] = await this.db.select().from(drills).where(eq(drills.id, dto.drillId)).limit(1);

    if (!drill) {
      throw new NotFoundException("Drill not found");
    }

    const pass = parseFloat(dto.timeEntered) <= parseFloat(drill.timeStandard);

    const [created] = await this.db
      .insert(sessionEntries)
      .values({
        sessionId: dto.sessionId,
        shooterId: dto.shooterId,
        drillId: dto.drillId,
        timeEntered: dto.timeEntered,
        pass,
      })
      .returning();

    return created;
  }

  async complete(id: number): Promise<SessionRow> {
    await this.findSessionById(id);

    const [updated] = await this.db
      .update(trainingSessions)
      .set({ completedAt: new Date() })
      .where(eq(trainingSessions.id, id))
      .returning();

    return updated;
  }

  private async findSessionById(id: number): Promise<SessionRow> {
    const [session] = await this.db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.id, id))
      .limit(1);

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    return session;
  }
}
