import { join } from "node:path";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  });
  app.setGlobalPrefix("api");

  if (process.env.NODE_ENV === "production") {
    app.useStaticAssets(join(__dirname, "..", "..", "public"));
  }

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
