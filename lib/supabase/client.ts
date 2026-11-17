"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let browserClient: SupabaseClient | null = null;

/**
 * Supabase client ฝั่ง browser ใช้ anon key (เปิดเผยได้)
 * อ่านได้เฉพาะตารางที่ RLS อนุญาต (categories / products / product_options)
 * คืนค่า null ถ้ายังไม่ได้ตั้งค่า env → แอปจะใช้เมนูโหมดทดสอบแทน
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  browserClient ??= createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return browserClient;
}
