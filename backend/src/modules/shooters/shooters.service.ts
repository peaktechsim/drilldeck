import { Inject, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcrypt";
import { DRIZZLE } from "../../config/drizzle.module";
import type { Database } from "../../config/database";
import { shooterLockouts, shooters } from "../../schema";
import type { RegisterShooterDto, UpdateShooterDto, VerifyPinDto } from "./dto";

type ShooterRow = typeof shooters.$inferSelect;
type LockoutRow = typeof shooterLockouts.$inferSelect;

type SafeShooter = Omit<ShooterRow, "pin">;
type ShooterSummary = Pick<ShooterRow, "id" | "name" | "email">;

@Injectable()
export class ShootersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async register(dto: RegisterShooterDto): Promise<SafeShooter> {
    const hashedPin = await bcrypt.hash(dto.pin, 10);

    const [created] = await this.db
      .insert(shooters)
      .values({
        email: dto.email,
        name: dto.name,
        pin: hashedPin,
        rifle: dto.rifle ?? null,
        pistol: dto.pistol ?? null,
      })
      .returning();

    return this.stripPin(created);
  }

  async listAll(): Promise<ShooterSummary[]> {
    return this.db.select({ id: shooters.id, name: shooters.name, email: shooters.email }).from(shooters);
  }

  async getById(id: number, requesterId?: number, isAdmin = false): Promise<SafeShooter> {
    this.assertSelfOrAdmin(id, requesterId, isAdmin);

    const shooter = await this.findShooterById(id);
    return this.stripPin(shooter);
  }

  async update(id: number, dto: UpdateShooterDto, requesterId?: number, isAdmin = false): Promise<SafeShooter> {
    this.assertSelfOrAdmin(id, requesterId, isAdmin);

    await this.findShooterById(id);

    const updates: Partial<typeof shooters.$inferInsert> = {};

    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.rifle !== undefined) updates.rifle = dto.rifle;
    if (dto.pistol !== undefined) updates.pistol = dto.pistol;

    const [updated] = await this.db
      .update(shooters)
      .set(updates)
      .where(eq(shooters.id, id))
      .returning();

    return this.stripPin(updated);
  }

  async verifyPin(dto: VerifyPinDto): Promise<SafeShooter> {
    const [shooter] = await this.db.select().from(shooters).where(eq(shooters.email, dto.email)).limit(1);

    if (!shooter) {
      throw new UnauthorizedException("Invalid email or PIN");
    }

    const now = new Date();
    const lockout = await this.findLockoutByShooterId(shooter.id);

    if (lockout?.lockedUntil && lockout.lockedUntil > now) {
      throw new UnauthorizedException("Account is locked. Try again later.");
    }

    const matches = await bcrypt.compare(dto.pin, shooter.pin);

    if (!matches) {
      await this.recordFailedAttempt(shooter.id, lockout, now);
      throw new UnauthorizedException("Invalid email or PIN");
    }

    await this.resetLockout(shooter.id, lockout);
    return this.stripPin(shooter);
  }

  private async findShooterById(id: number): Promise<ShooterRow> {
    const [shooter] = await this.db.select().from(shooters).where(eq(shooters.id, id)).limit(1);

    if (!shooter) {
      throw new NotFoundException("Shooter not found");
    }

    return shooter;
  }

  private async findLockoutByShooterId(shooterId: number): Promise<LockoutRow | undefined> {
    const [lockout] = await this.db
      .select()
      .from(shooterLockouts)
      .where(eq(shooterLockouts.targetShooterId, shooterId))
      .limit(1);

    return lockout;
  }

  private async recordFailedAttempt(shooterId: number, lockout: LockoutRow | undefined, now: Date): Promise<void> {
    const failedAttempts = (lockout?.failedAttempts ?? 0) + 1;
    const lockedUntil = failedAttempts >= 5 ? new Date(now.getTime() + 60 * 60 * 1000) : null;

    if (lockout) {
      await this.db
        .update(shooterLockouts)
        .set({ failedAttempts, lockedUntil })
        .where(eq(shooterLockouts.id, lockout.id));
      return;
    }

    await this.db.insert(shooterLockouts).values({
      targetShooterId: shooterId,
      failedAttempts,
      lockedUntil,
    });
  }

  private async resetLockout(shooterId: number, lockout: LockoutRow | undefined): Promise<void> {
    if (lockout) {
      await this.db
        .update(shooterLockouts)
        .set({ failedAttempts: 0, lockedUntil: null })
        .where(eq(shooterLockouts.id, lockout.id));
      return;
    }

    const [activeLockout] = await this.db
      .select()
      .from(shooterLockouts)
      .where(and(eq(shooterLockouts.targetShooterId, shooterId), gt(shooterLockouts.failedAttempts, 0)))
      .limit(1);

    if (activeLockout) {
      await this.db
        .update(shooterLockouts)
        .set({ failedAttempts: 0, lockedUntil: null })
        .where(eq(shooterLockouts.id, activeLockout.id));
    }
  }

  private assertSelfOrAdmin(targetId: number, requesterId?: number, isAdmin = false): void {
    if (!isAdmin && requesterId !== targetId) {
      throw new ForbiddenException("You can only access your own profile");
    }
  }

  private stripPin(shooter: ShooterRow): SafeShooter {
    const { pin: _pin, ...safeShooter } = shooter;
    return safeShooter;
  }
}
