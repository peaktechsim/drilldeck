import { Module } from "@nestjs/common";
import { DrizzleModule } from "./config/drizzle.module";

@Module({ imports: [DrizzleModule] })
export class AppModule {}
