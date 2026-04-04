import { Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../../guards/admin.guard";
import type { CreateDrillDto, UpdateDrillDto } from "./dto";
import { DrillsService } from "./drills.service";

@Controller("drills")
export class DrillsController {
  constructor(private readonly drillsService: DrillsService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateDrillDto, @Headers("x-shooter-id") shooterIdHeader?: string) {
    return this.drillsService.create({
      ...dto,
      createdBy: this.parseRequesterId(shooterIdHeader),
    });
  }

  @Get()
  findAll() {
    return this.drillsService.findAll();
  }

  @Get(":id")
  findById(@Param("id", ParseIntPipe) id: number) {
    return this.drillsService.findById(id);
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateDrillDto) {
    return this.drillsService.update(id, dto);
  }

  private parseRequesterId(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
