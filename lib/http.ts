import "server-only";

import { NextResponse } from "next/server";
import { SupabaseNotConfiguredError } from "./supabase/server";

/** error ที่ตั้งใจส่งกลับไปให้ client (ข้อความเป็นภาษาไทย) */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...init?.headers },
  });
}

/** ห่อ route handler ให้แปลง error เป็น JSON response และไม่หลุดรายละเอียดภายในออกไป */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) {
      return json({ error: e.message, code: e.code }, { status: e.status });
    }
    if (e instanceof SupabaseNotConfiguredError) {
      return json(
        { error: "ระบบสั่งซื้อยังไม่พร้อมใช้งาน (ยังไม่ได้เชื่อมต่อฐานข้อมูล)", code: "not_configured" },
        { status: 503 }
      );
    }
    console.error(e);
    return json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองใหม่" }, { status: 500 });
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "รูปแบบข้อมูลไม่ถูกต้อง");
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}
