"use client";

import type { Liff } from "@line/liff";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type LiffMessages = Parameters<Liff["sendMessages"]>[0];

export type LiffProfile = {
  userId: string;
  displayName: string;
  pictureUrl?: string;
};

type LiffContextValue = {
  status: "loading" | "ready" | "error";
  error: string | null;
  profile: LiffProfile | null;
  /** เปิดอยู่ในแอป LINE หรือไม่ (ฟีเจอร์ส่งข้อความ/ปิดหน้าต่างใช้ได้เฉพาะกรณีนี้) */
  isInClient: boolean;
  /** ไม่มี NEXT_PUBLIC_LIFF_ID → โหมดทดสอบสำหรับเปิดในเบราว์เซอร์ */
  isDemo: boolean;
  /** ID token สำหรับส่งให้ server verify (null ถ้าต้อง login ใหม่) */
  getIdToken: () => Promise<string | null>;
  /** ส่งข้อความเข้าแชท คืนค่า false ถ้าส่งไม่ได้ (ไม่ throw) */
  sendMessages: (messages: LiffMessages) => Promise<boolean>;
  closeWindow: () => void;
  relogin: () => void;
};

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;
const DEMO_PROFILE: LiffProfile = { userId: "demo", displayName: "ผู้ใช้ทดสอบ" };

const LiffContext = createContext<LiffContextValue | null>(null);

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const liffRef = useRef<Liff | null>(null);
  const [status, setStatus] = useState<LiffContextValue["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [isInClient, setIsInClient] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!LIFF_ID) {
        setProfile(DEMO_PROFILE);
        setStatus("ready");
        return;
      }
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: LIFF_ID });
        liffRef.current = liff;
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }
        const p = await liff.getProfile();
        if (cancelled) return;
        setProfile({ userId: p.userId, displayName: p.displayName, pictureUrl: p.pictureUrl });
        setIsInClient(liff.isInClient());
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const relogin = useCallback(() => {
    const liff = liffRef.current;
    if (!liff) return;
    if (liff.isLoggedIn()) liff.logout();
    liff.login({ redirectUri: window.location.href });
  }, []);

  const getIdToken = useCallback(async () => {
    if (!LIFF_ID) return "demo";
    const liff = liffRef.current;
    if (!liff || !liff.isLoggedIn()) return null;

    // ID token มีอายุจำกัด ถ้าใกล้หมดอายุให้ login ใหม่เพื่อรับ token ใหม่
    const decoded = liff.getDecodedIDToken();
    if (!decoded?.exp || decoded.exp * 1000 < Date.now() + 30_000) {
      relogin();
      return null;
    }
    return liff.getIDToken();
  }, [relogin]);

  const sendMessages = useCallback(
    async (messages: LiffMessages) => {
      const liff = liffRef.current;
      if (!liff || !isInClient) return false;
      try {
        await liff.sendMessages(messages);
        return true;
      } catch (e) {
        // เช่น เปิด LIFF จากที่ที่ไม่ใช่ห้องแชท หรือไม่ได้ให้สิทธิ์ chat_message.write
        console.warn("sendMessages failed", e);
        return false;
      }
    },
    [isInClient]
  );

  const closeWindow = useCallback(() => {
    liffRef.current?.closeWindow();
  }, []);

  const value = useMemo<LiffContextValue>(
    () => ({
      status,
      error,
      profile,
      isInClient,
      isDemo: !LIFF_ID,
      getIdToken,
      sendMessages,
      closeWindow,
      relogin,
    }),
    [status, error, profile, isInClient, getIdToken, sendMessages, closeWindow, relogin]
  );

  return <LiffContext value={value}>{children}</LiffContext>;
}

export function useLiff() {
  const ctx = useContext(LiffContext);
  if (!ctx) throw new Error("useLiff must be used inside <LiffProvider>");
  return ctx;
}
