import { Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import type { RegisterShooterDto, UpdateShooterDto, VerifyPinDto } from "./dto";
import { ShootersService } from "./shooters.service";

@Controller("shooters")
export class ShootersController {
  constructor(private readonly shootersService: ShootersService) {}

  @Post()
  register(@Body() dto: RegisterShooterDto) {
    return this.shootersService.register(dto);
  }

  @Get()
  listAll() {
    return this.shootersService.listAll();
  }

  @Get(":id")
  getById(
    @Param("id", ParseIntPipe) id: number,
    @Headers("x-shooter-id") requesterIdHeader?: string,
    @Headers("x-shooter-admin") isAdminHeader?: string,
  ) {
    return this.shootersService.getById(
      id,
      this.parseRequesterId(requesterIdHeader),
      isAdminHeader === "true",
    );
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateShooterDto,
    @Headers("x-shooter-id") requesterIdHeader?: string,
    @Headers("x-shooter-admin") isAdminHeader?: string,
  ) {
    return this.shootersService.update(
      id,
      dto,
      this.parseRequesterId(requesterIdHeader),
      isAdminHeader === "true",
    );
  }

  @Post("verify-pin")
  verifyPin(@Body() dto: VerifyPinDto) {
    return this.shootersService.verifyPin(dto);
  }

  private parseRequesterId(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
}
