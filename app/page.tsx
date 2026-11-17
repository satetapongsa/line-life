"use client";

import { useEffect, useMemo, useState } from "react";
import { products } from "@/lib/products";

type Profile = { displayName: string; pictureUrl?: string; userId: string };
type Status = "loading" | "ready" | "error";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;

export default function Home() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [inLine, setInLine] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  // 1) เริ่มต้น LIFF แล้วดึงโปรไฟล์ LINE
  useEffect(() => {
    async function init() {
      // ยังไม่มี LIFF ID → โหมดทดสอบ เปิดในเบราว์เซอร์ได้
      if (!LIFF_ID) {
        setProfile({ displayName: "ผู้ใช้ทดสอบ", userId: "demo" });
        setStatus("ready");
        return;
      }
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: LIFF_ID });
        if (!liff.isLoggedIn()) {
          liff.login(); // พาไป login ด้วย LINE แล้วกลับมาหน้านี้
          return;
        }
        const p = await liff.getProfile();
        setProfile({
          displayName: p.displayName,
          pictureUrl: p.pictureUrl,
          userId: p.userId,
        });
        setInLine(liff.isInClient());
        setStatus("ready");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    }
    init();
  }, []);

  // 2) ตะกร้า
  const items = useMemo(
    () =>
      products
        .filter((p) => cart[p.id])
        .map((p) => ({ ...p, qty: cart[p.id] })),
    [cart]
  );
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  }
  function remove(id: string) {
    setCart((c) => {
      const next = { ...c };
      if ((next[id] ?? 0) <= 1) delete next[id];
      else next[id] -= 1;
      return next;
    });
  }

  // 3) สั่งซื้อ → ส่งสรุปออเดอร์กลับเข้าแชท LINE
  async function checkout() {
    if (!items.length) return;
    setSending(true);
    const summary =
      `🧾 ออเดอร์ของ ${profile?.displayName}\n` +
      items.map((i) => `• ${i.name} x${i.qty} = ${i.price * i.qty} บาท`).join("\n") +
      `\nรวม ${total} บาท`;

    try {
      if (LIFF_ID && inLine) {
        const liff = (await import("@line/liff")).default;
        await liff.sendMessages([{ type: "text", text: summary }]);
      }
      setDone(true);
      setCart({});
    } catch (e) {
      alert("ส่งข้อความไม่สำเร็จ: " + (e instanceof Error ? e.message : e));
    } finally {
      setSending(false);
    }
  }

  async function closeApp() {
    if (LIFF_ID && inLine) {
      const liff = (await import("@line/liff")).default;
      liff.closeWindow();
    } else {
      setDone(false);
    }
  }

  // ---------- UI ----------
  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-4xl">⚠️</p>
        <p className="font-semibold">เปิด LIFF ไม่สำเร็จ</p>
        <p className="text-sm text-gray-500 break-all">{error}</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-6xl">✅</p>
        <h1 className="text-xl font-bold">สั่งซื้อสำเร็จ</h1>
        <p className="text-gray-500">
          {inLine ? "ส่งสรุปออเดอร์เข้าแชทแล้ว" : "(โหมดทดสอบ: ไม่ได้เปิดในแอป LINE)"}
        </p>
        <button
          onClick={closeApp}
          className="rounded-full bg-green-500 px-6 py-3 font-semibold text-white"
        >
          {inLine ? "กลับไปที่แชท" : "สั่งเพิ่ม"}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md pb-32">
      {/* Header + โปรไฟล์ LINE */}
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-green-500 px-4 py-3 text-white shadow">
        {profile?.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.pictureUrl} alt="" className="h-10 w-10 rounded-full border-2 border-white" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-lg">👤</div>
        )}
        <div className="flex-1">
          <p className="text-xs opacity-80">สวัสดี</p>
          <p className="font-semibold leading-tight">{profile?.displayName}</p>
        </div>
        <span className="text-lg font-bold">Wave Shop</span>
      </header>

      {!LIFF_ID && (
        <p className="m-4 rounded-lg bg-yellow-100 p-3 text-sm text-yellow-800">
          โหมดทดสอบ: ยังไม่ได้ใส่ NEXT_PUBLIC_LIFF_ID
        </p>
      )}

      {/* รายการสินค้า */}
      <section className="grid grid-cols-2 gap-3 p-4">
        {products.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className={`flex h-28 items-center justify-center text-5xl ${p.bg}`}>{p.emoji}</div>
            <div className="p-3">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-green-600 font-semibold">{p.price} บาท</p>
              <div className="mt-2 flex items-center justify-between">
                {cart[p.id] ? (
                  <>
                    <button onClick={() => remove(p.id)} className="h-8 w-8 rounded-full bg-gray-100 font-bold">−</button>
                    <span className="font-semibold">{cart[p.id]}</span>
                    <button onClick={() => add(p.id)} className="h-8 w-8 rounded-full bg-green-500 font-bold text-white">+</button>
                  </>
                ) : (
                  <button onClick={() => add(p.id)} className="w-full rounded-full bg-green-500 py-1.5 text-sm font-semibold text-white">
                    ใส่ตะกร้า
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* แถบตะกร้าด้านล่าง */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t bg-white p-4 shadow-lg">
          <div className="mb-3 flex justify-between text-sm text-gray-600">
            <span>{count} ชิ้น</span>
            <span className="text-lg font-bold text-gray-900">รวม {total} บาท</span>
          </div>
          <button
            onClick={checkout}
            disabled={sending}
            className="w-full rounded-full bg-green-500 py-3 font-semibold text-white disabled:opacity-60"
          >
            {sending ? "กำลังสั่งซื้อ..." : "สั่งซื้อเลย"}
          </button>
        </div>
      )}
    </main>
  );
}
