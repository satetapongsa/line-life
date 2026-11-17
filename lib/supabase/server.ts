import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Supabase client ฝั่ง server ใช้ service role key (ข้าม RLS ได้)
 * ห้าม import ไฟล์นี้จาก client component (มี "server-only" กันไว้แล้ว)
 */
export function getServiceSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new SupabaseNotConfiguredError();

  adminClient ??= createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

export const PRODUCT_IMAGE_BUCKET = "product-images";
