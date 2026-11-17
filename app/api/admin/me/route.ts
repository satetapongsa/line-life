import { isAdmin, requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";

/**
 * เช็คว่าผู้ใช้เป็นแอดมินหรือไม่ (verify ID token ทุกครั้ง)
 * คืน userId ของตัวเองกลับไปด้วย เพื่อให้เจ้าของร้านคัดลอกไปใส่ ADMIN_LINE_USER_IDS ได้
 */
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    return json({ userId: user.userId, displayName: user.displayName, isAdmin: isAdmin(user.userId) });
  });
}
