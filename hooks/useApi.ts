"use client";

import { useCallback } from "react";
import { useLiff } from "./useLiff";

export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; formData?: FormData };

/** fetch ไปยัง API ของเรา พร้อมแนบ LINE ID token ใน Authorization header */
export function useApi() {
  const { getIdToken, relogin } = useLiff();

  return useCallback(
    async <T,>(path: string, opts: Options = {}): Promise<T> => {
      const token = await getIdToken();
      if (!token) throw new ClientApiError(401, "กำลังพาไปเข้าสู่ระบบใหม่...", "relogin");

      let res: Response;
      try {
        res = await fetch(path, {
          method: opts.method ?? (opts.body || opts.formData ? "POST" : "GET"),
          headers: {
            Authorization: `Bearer ${token}`,
            ...(opts.body ? { "Content-Type": "application/json" } : {}),
          },
          body: opts.formData ?? (opts.body ? JSON.stringify(opts.body) : undefined),
          cache: "no-store",
        });
      } catch {
        throw new ClientApiError(0, "เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาลองใหม่");
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "invalid_token") relogin();
        throw new ClientApiError(res.status, data.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่", data.code);
      }
      return data as T;
    },
    [getIdToken, relogin]
  );
}
