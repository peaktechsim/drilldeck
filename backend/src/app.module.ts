import { Module } from "@nestjs/common";
import { DrizzleModule } from "./config/drizzle.module";
import { ShootersModule } from "./modules/shooters/shooters.module";

@Module({ imports: [DrizzleModule, ShootersModule] })
export class AppModule {}
