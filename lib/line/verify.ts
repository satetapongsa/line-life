import "server-only";

import { ApiError } from "../http";

const VERIFY_ENDPOINT = "https://api.line.me/oauth2/v2.1/verify";

export type LineUser = {
  /** LINE userId (ค่า sub ใน ID token) */
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

type VerifyResponse = {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  name?: string;
  picture?: string;
};

/**
 * ตรวจสอบ ID token จาก liff.getIDToken() กับ LINE server
 * ข้อมูลผู้ใช้ทั้งหมดต้องมาจากผลลัพธ์นี้ ห้ามเชื่อ userId ที่ client ส่งมาเอง
 */
export async function verifyLineIdToken(idToken: string): Promise<LineUser> {
  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;

  // โหมดทดสอบบนเครื่อง dev เท่านั้น (production จะไม่เข้าเงื่อนไขนี้)
  if (process.env.NODE_ENV === "development" && !channelId && idToken === "demo") {
    return { userId: "demo", displayName: "ผู้ใช้ทดสอบ" };
  }

  if (!channelId) {
    console.error("LINE_LOGIN_CHANNEL_ID is not set");
    throw new ApiError(503, "ระบบยืนยันตัวตนยังไม่พร้อมใช้งาน", "not_configured");
  }

  let res: Response;
  try {
    res = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: idToken, client_id: channelId }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new ApiError(502, "เชื่อมต่อ LINE ไม่สำเร็จ กรุณาลองใหม่");
  }

  if (!res.ok) {
    // เช่น token หมดอายุ / ไม่ได้ออกให้ channel นี้
    throw new ApiError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", "invalid_token");
  }

  const data = (await res.json()) as VerifyResponse;

  // LINE ตรวจให้แล้ว แต่เช็คซ้ำอีกชั้นเพื่อความชัวร์
  if (
    data.iss !== "https://access.line.me" ||
    data.aud !== channelId ||
    !data.sub ||
    data.exp * 1000 < Date.now()
  ) {
    throw new ApiError(401, "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่", "invalid_token");
  }

  return { userId: data.sub, displayName: data.name ?? "ลูกค้า LINE", pictureUrl: data.picture };
}
