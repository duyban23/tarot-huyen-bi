import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const SOCIALS = [
  {
    name: "TikTok",
    handle: "tiktok.com/@chemietarot_happy",
    href: "https://www.tiktok.com/@chemietarot_happy",
    icon: (
      <svg viewBox="0 0 24 24" className="w-12 h-12" aria-hidden="true" fill="#FFFFFF">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    handle: "facebook.com/hieumy.tarot",
    href: "https://www.facebook.com/hieumy.tarot",
    icon: (
      <svg viewBox="0 0 24 24" className="w-12 h-12" aria-hidden="true" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    handle: "youtube.com/@healingwithmy",
    href: "https://youtube.com/@healingwithmy",
    icon: (
      <svg viewBox="0 0 24 24" className="w-12 h-12" aria-hidden="true" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    handle: "instagram.com/healingwithmyy",
    href: "https://www.instagram.com/healingwithmyy",
    icon: (
      <svg viewBox="0 0 24 24" className="w-12 h-12" aria-hidden="true" fill="#E4405F">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069Zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073Zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162Zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4Zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44Z" />
      </svg>
    ),
  },
];

const SOCIALS_ORDER = ["TikTok", "Facebook", "YouTube", "Instagram"];

export default function Footer() {
  const sorted = [...SOCIALS].sort(
    (a, b) => SOCIALS_ORDER.indexOf(a.name) - SOCIALS_ORDER.indexOf(b.name)
  );

  return (
    <footer className="border-t border-arcane/30 bg-velvet/40">
      {/* Main footer content */}
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {/* Brand & description */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <BrandLogo size="bar" loading="lazy" className="rounded-lg bg-void/30" />
              <div>
                <p className="font-logo text-mist font-semibold tracking-wider text-lg leading-tight">Healing With My</p>
                <p className="font-body text-lilac/80 text-xs tracking-widest uppercase mt-0.5">Reader · Healer · Coaching</p>
              </div>
            </div>
            <p className="font-body text-lilac/85 text-sm leading-relaxed">
              Có những điều chẳng biết tỏ cùng ai — ở đây, bạn luôn có một nơi để trút lòng và được vỗ về bằng Tarot, Tea Leaf.
            </p>
          </div>

          {/* Company info */}
          <div>
            <h3 className="font-display font-semibold text-mist text-sm tracking-widest uppercase mb-3">Lamy Entertainment</h3>
            <ul className="space-y-2">
              <li>
                <span className="font-body text-candle-gold/90 text-xs font-medium tracking-wider uppercase block mb-0.5">Địa chỉ</span>
                <span className="font-body text-mist text-sm font-medium leading-relaxed">298 Lý Thường Kiệt, Phù Vân, Ninh Bình</span>
              </li>
              <li>
                <span className="font-body text-candle-gold/90 text-xs font-medium tracking-wider uppercase block mb-0.5">Mã số thuế</span>
                <span className="font-body text-mist text-sm font-medium">0700913728</span>
              </li>
              <li>
                <span className="font-body text-candle-gold/90 text-xs font-medium tracking-wider uppercase block mb-0.5">Điện thoại</span>
                <a href="tel:0343993456" className="font-body text-mist text-sm font-semibold hover:text-candle-gold transition-colors">0343993456</a>
              </li>
              <li>
                <span className="font-body text-candle-gold/90 text-xs font-medium tracking-wider uppercase block mb-0.5">Email</span>
                <a href="mailto:LamyEntertainment@gmail.com" className="font-body text-mist text-sm font-medium hover:text-candle-gold transition-colors break-all">LamyEntertainment@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* Social links */}
          <div>
            <h3 className="font-display font-semibold text-mist text-sm tracking-widest uppercase mb-3">CÁC NỀN TẢNG CỦA MY</h3>
            <ul className="space-y-1.5">
              {sorted.map((s) => (
                <li key={s.name}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.name} — ${s.handle}`}
                    title={`${s.name} — ${s.handle}`}
                    className="group flex items-center gap-2.5 rounded-lg border border-velvet/40 bg-void/40 px-2.5 py-1.5 hover:border-candle-gold/50 hover:bg-void/70 active:scale-[0.99] transition-all"
                  >
                    <span className="shrink-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] [&>svg]:w-7 [&>svg]:h-7">
                      {s.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-mist text-xs tracking-wider uppercase leading-tight">
                        {s.name}
                      </span>
                      <span className="block font-body text-candle-gold/90 text-xs leading-snug truncate group-hover:text-candle-gold group-hover:underline underline-offset-4">
                        {s.handle}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="font-body text-lilac/75 text-xs mt-3 leading-relaxed">
              Theo dõi Lamy Entertainment trên các nền tảng để cập nhật những thông tin mới nhất về huyền học và tâm linh.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-arcane/20 bg-void/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <p className="font-body text-lilac/70 text-xs">
            &copy; {new Date().getFullYear()} <span className="text-mist font-medium">Lamy Entertainment</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="font-body text-lilac/70 text-xs font-medium hover:text-mist transition-colors">Giới thiệu</Link>
            <Link to="/services" className="font-body text-lilac/70 text-xs font-medium hover:text-mist transition-colors">Dịch vụ</Link>
            <Link to="/contact" className="font-body text-lilac/70 text-xs font-medium hover:text-mist transition-colors">Liên hệ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
