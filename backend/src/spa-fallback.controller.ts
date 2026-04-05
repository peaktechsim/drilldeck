import { Controller, Get, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { join } from "node:path";

@Controller()
export class SpaFallbackController {
  @Get("*")
  serveSpa(@Req() req: Request, @Res() res: Response) {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ message: "Not Found" });
      return;
    }

    if (process.env.NODE_ENV === "production") {
      res.sendFile(join(__dirname, "..", "..", "public", "index.html"));
      return;
    }

    res.status(404).json({ message: "Not Found" });
  }
}
