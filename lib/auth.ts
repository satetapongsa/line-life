import "server-only";

import { ApiError } from "./http";
import { verifyLineIdToken, type LineUser } from "./line/verify";

/** อ่าน ID token จาก header `Authorization: Bearer <token>` แล้ว verify กับ LINE */
export async function requireUser(req: Request): Promise<LineUser> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new ApiError(401, "กรุณาเข้าสู่ระบบด้วย LINE", "invalid_token");
  return verifyLineIdToken(match[1].trim());
}

export function adminUserIds(): string[] {
  return (process.env.ADMIN_LINE_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAdmin(userId: string): boolean {
  return adminUserIds().includes(userId);
}

/** verify token ทุกครั้ง แล้วเช็คว่า userId อยู่ใน ADMIN_LINE_USER_IDS */
export async function requireAdmin(req: Request): Promise<LineUser> {
  const user = await requireUser(req);
  if (!isAdmin(user.userId)) throw new ApiError(403, "คุณไม่มีสิทธิ์เข้าถึงหน้านี้", "forbidden");
  return user;
}
