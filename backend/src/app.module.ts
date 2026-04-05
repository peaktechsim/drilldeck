import { Module } from "@nestjs/common";
import { DrizzleModule } from "./config/drizzle.module";
import { AnalysisModule } from "./modules/analysis/analysis.module";
import { DrillsModule } from "./modules/drills/drills.module";
import { ShootersModule } from "./modules/shooters/shooters.module";
import { SessionsModule } from "./modules/sessions/sessions.module";

@Module({ imports: [DrizzleModule, ShootersModule, DrillsModule, SessionsModule, AnalysisModule] })
export class AppModule {}
