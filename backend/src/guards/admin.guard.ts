import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const isAdmin = req.headers["x-shooter-admin"] === "true";
    if (!isAdmin) throw new ForbiddenException("Admin access required");
    return true;
  }
}
