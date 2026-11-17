"use client";

import { useEffect, useRef, useState } from "react";

const SLIDES = [
  {
    title: "สั่งล่วงหน้า ไม่ต้องรอคิว",
    subtitle: "เลือกเวลามารับ แล้วหยิบได้เลยที่ร้าน",
    tag: "Pre-order",
    className: "from-brand-500 to-emerald-600",
    emoji: "🧋",
  },
  {
    title: "จ่ายง่ายด้วยพร้อมเพย์",
    subtitle: "สแกน QR ได้ทุกแอปธนาคาร",
    tag: "PromptPay",
    className: "from-sky-500 to-indigo-500",
    emoji: "📱",
  },
  {
    title: "ครัวซองต์อบใหม่ทุกเช้า",
    subtitle: "เนยฝรั่งเศสแท้ หอมกรุ่นจากเตา",
    tag: "เมนูแนะนำ",
    className: "from-amber-500 to-orange-500",
    emoji: "🥐",
  },
];

export function PromoBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // เลื่อนสไลด์อัตโนมัติทุก 4 วินาที
  useEffect(() => {
    const id = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % SLIDES.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="px-4 pt-4">
      <div
        ref={ref}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl"
      >
        {SLIDES.map((s) => (
          <div
            key={s.title}
            className={`relative flex h-32 w-full shrink-0 snap-center items-center overflow-hidden bg-gradient-to-br p-5 text-white ${s.className}`}
          >
            <div className="relative z-10 max-w-[70%]">
              <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-semibold">
                {s.tag}
              </span>
              <p className="mt-2 text-lg leading-snug font-bold">{s.title}</p>
              <p className="text-xs text-white/90">{s.subtitle}</p>
            </div>
            <span className="absolute -right-2 -bottom-4 text-[88px] opacity-90 select-none">
              {s.emoji}
            </span>
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-center gap-1.5">
        {SLIDES.map((s, i) => (
          <span
            key={s.title}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-brand-500" : "w-1.5 bg-slate-300"}`}
          />
        ))}
      </div>
    </section>
  );
}
