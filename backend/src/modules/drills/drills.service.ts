import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { Database } from "../../config/database";
import { DRIZZLE } from "../../config/drizzle.module";
import { drills } from "../../schema";
import type { CreateDrillDto, UpdateDrillDto } from "./dto";

type DrillRow = typeof drills.$inferSelect;

@Injectable()
export class DrillsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async create(dto: CreateDrillDto): Promise<DrillRow> {
    const [created] = await this.db
      .insert(drills)
      .values({
        name: dto.name,
        description: dto.description,
        timeStandard: dto.timeStandard,
        distance: dto.distance ?? "7",
        targetZones: dto.targetZones,
        createdBy: dto.createdBy ?? null,
      })
      .returning();

    return created;
  }

  findAll(): Promise<DrillRow[]> {
    return this.db.select().from(drills);
  }

  async findById(id: number): Promise<DrillRow> {
    const [drill] = await this.db.select().from(drills).where(eq(drills.id, id)).limit(1);

    if (!drill) {
      throw new NotFoundException("Drill not found");
    }

    return drill;
  }

  async update(id: number, dto: UpdateDrillDto): Promise<DrillRow> {
    await this.findById(id);

    const updates: Partial<typeof drills.$inferInsert> = {};

    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.timeStandard !== undefined) updates.timeStandard = dto.timeStandard;
    if (dto.distance !== undefined) updates.distance = dto.distance;
    if (dto.targetZones !== undefined) updates.targetZones = dto.targetZones;

    const [updated] = await this.db
      .update(drills)
      .set(updates)
      .where(eq(drills.id, id))
      .returning();
    return updated;
  }
}
