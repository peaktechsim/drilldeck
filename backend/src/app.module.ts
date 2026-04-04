import { Module } from "@nestjs/common";
import { DrizzleModule } from "./config/drizzle.module";
import { DrillsModule } from "./modules/drills/drills.module";
import { ShootersModule } from "./modules/shooters/shooters.module";

@Module({ imports: [DrizzleModule, ShootersModule, DrillsModule] })
export class AppModule {}
