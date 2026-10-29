import { useState } from "react";
import { useLocation } from "react-router-dom";

const HIDDEN_PREFIXES = ["/admin", "/phone"];

const ZALO_URL = "https://zalo.me/0343993456";
const FACEBOOK_URL = "https://www.facebook.com/hieumy.tarot";

/**
 * Nút contact nổi góc phải dưới: bấm bung ra 2 kênh Zalo + Messenger.
 * Hiện toàn web trừ trang admin (và khung demo /phone).
 * Trên mobile nằm phía trên thanh "Đặt lịch" dính đáy.
 */
export default function FloatingContact() {
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  if (HIDDEN_PREFIXES.some((p) => loc.pathname.startsWith(p))) return null;

  const channels = [
    {
      name: "Chat Zalo",
      href: ZALO_URL,
      icon: (
        <span className="w-9 h-9 rounded-full bg-[#0068FF] flex items-center justify-center shrink-0">
          <span className="font-display font-bold text-white text-lg leading-none">Z</span>
        </span>
      ),
    },
    {
      name: "Facebook",
      href: FACEBOOK_URL,
      icon: (
        <span className="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="#FFFFFF" className="w-5 h-5" aria-hidden="true">
            <path d="M24 12.073q0-5.018-3.55-8.568T12 .955 3.55 4.505 0 12.073q0 4.28 2.62 7.395t6.756 3.587v-5.23H6.76v-3.752h2.616V11.08q0-4.334 2.008-6.266t5.414-1.932q1.71 0 2.663.138v3.016h-1.52q-1.18 0-1.726.72t-.545 1.97v1.888h3.333l-.535 3.751h-2.798v5.23q4.136-.472 6.756-3.587T24 12.073Z" />
          </svg>
        </span>
      ),
    },
  ];

  return (
    <div className="fixed right-4 md:right-6 bottom-[84px] md:bottom-6 z-50 flex flex-col items-end gap-2.5">
      {/* Kênh chat bung ra */}
      <div
        className={`flex flex-col items-end gap-2.5 transition-all duration-200 origin-bottom ${
          open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {channels.map((c) => (
          <a
            key={c.name}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={open ? 0 : -1}
            className="flex items-center gap-2.5 bg-void/95 backdrop-blur-md border border-velvet rounded-full pl-1.5 pr-4 py-1.5 shadow-xl shadow-black/40 hover:border-candle-gold/60 active:scale-[0.97] transition-all"
          >
            {c.icon}
            <span className="font-body text-mist text-sm font-medium whitespace-nowrap">{c.name}</span>
          </a>
        ))}
      </div>

      {/* Nút chính */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng liên hệ" : "Liên hệ nhanh"}
        aria-expanded={open}
        className="relative w-14 h-14 rounded-full bg-candle-gold text-void flex items-center justify-center shadow-xl shadow-candle-gold/30 hover:bg-candle-gold/90 hover:shadow-candle-gold/50 active:scale-95 transition-all"
      >
        {/* Vòng lan tỏa nhẹ khi đang đóng — tắt khi mở để khỏi rối mắt */}
        {!open && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-candle-gold/40 motion-safe:animate-ping motion-safe:[animation-duration:2.2s] pointer-events-none"
          />
        )}
        <span className="relative">
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        </span>
      </button>
    </div>
  );
}
