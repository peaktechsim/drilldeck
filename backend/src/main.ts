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

  // SPA fallback: serve index.html for any non-API, non-static GET request
  // Must be registered AFTER all NestJS routes and static assets
  if (process.env.NODE_ENV === "production") {
    const expressApp = app.getHttpAdapter().getInstance();
    const indexPath = join(__dirname, "..", "..", "public", "index.html");
    expressApp.get("/{*path}", (req: { path: string }, res: { sendFile: (p: string) => void }) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(indexPath);
      }
    });
  }

  await app.listen(process.env.PORT || 3000);
}

bootstrap();
