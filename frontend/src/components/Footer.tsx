import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import PlatformIcon, { type PlatformName } from "./PlatformIcon";

const SOCIALS: {
  name: string;
  handle: string;
  href: string;
  platform: PlatformName;
}[] = [
  {
    name: "Facebook",
    handle: "facebook.com/ChemieTarot",
    href: "https://www.facebook.com/ChemieTarot",
    platform: "facebook",
  },
  {
    name: "YouTube",
    handle: "youtube.com/@healingwithmy",
    href: "https://youtube.com/@healingwithmy",
    platform: "youtube",
  },
  {
    name: "Instagram",
    handle: "instagram.com/healingwithmyy",
    href: "https://www.instagram.com/healingwithmyy",
    platform: "instagram",
  },
  {
    name: "TikTok",
    handle: "tiktok.com/@chemietarot_happy",
    href: "https://www.tiktok.com/@chemietarot_happy",
    platform: "tiktok",
  },
  {
    name: "Threads",
    handle: "threads.net/@healingwithmyy",
    href: "https://www.threads.net/@healingwithmyy",
    platform: "threads",
  },
];

type CompanyItem = { label: string; value: string; href?: string };

const COMPANY: CompanyItem[] = [
  { label: "Địa chỉ", value: "298 Lý Thường Kiệt, Phù Vân, Ninh Bình" },
  { label: "Mã số thuế", value: "0700913728" },
  { label: "Điện thoại", value: "0343993456", href: "tel:0343993456" },
  {
    label: "Email",
    value: "LamyEntertainment@gmail.com",
    href: "mailto:LamyEntertainment@gmail.com",
  },
];

const BOTTOM_LINKS = [
  { path: "/about", label: "Giới thiệu" },
  { path: "/services", label: "Dịch vụ" },
  { path: "/contact", label: "Liên hệ" },
];

export default function Footer() {
  return (
    <footer className="border-t border-arcane/30 bg-velvet/40">
      {/* Main footer content — dàn đều theo bề ngang, chiều cao gọn */}
      <div className="mx-auto w-full max-w-5xl px-4 py-5 md:py-6">
        <div className="flex flex-col items-center gap-5 text-center md:flex-row md:flex-wrap md:items-start md:justify-center md:gap-x-10 md:gap-y-4 md:text-left lg:flex-nowrap lg:justify-between lg:gap-x-8">
          {/* Brand */}
          <div className="md:max-w-[260px] lg:max-w-[320px]">
            <Link
              to="/"
              aria-label="Healing With My — về trang chủ"
              className="inline-flex items-center gap-2.5 rounded-xl transition-opacity hover:opacity-90"
            >
              <BrandLogo size="bar" loading="lazy" className="rounded-lg bg-void/30" />
              <span className="text-left">
                <span className="block font-logo text-lg font-semibold leading-tight tracking-wider text-mist">
                  Healing With My
                </span>
                <span className="mt-0.5 block font-body text-[11px] uppercase tracking-[0.18em] text-lilac/75">
                  Reader · Healer · Coaching
                </span>
              </span>
            </Link>
            <p className="mx-auto mt-2.5 max-w-xs font-body text-sm leading-relaxed text-lilac/80 md:mx-0">
              Có những điều chẳng biết tỏ cùng ai — ở đây, bạn luôn có một nơi để trút lòng và được vỗ về bằng Tarot, Tea Leaf.
            </p>
          </div>

          {/* Company info — các dòng gọn, không chiếm nhiều chiều dọc */}
          <div>
            <h3 className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-candle-gold/90">
              Lamy Entertainment
            </h3>
            <ul className="mt-2.5 flex flex-col items-center gap-y-1 font-body text-sm text-mist/85 md:items-start">
              {COMPANY.map((item) => (
                <li key={item.label} className="flex items-baseline gap-2">
                  <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-lilac/55">
                    {item.label}
                  </span>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="font-medium text-mist/90 transition-colors hover:text-candle-gold break-all"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="font-medium text-mist/90">{item.value}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Social links */}
          <div>
            <h3 className="font-display text-xs font-semibold uppercase tracking-[0.22em] text-candle-gold/90">
              Kết nối
            </h3>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2.5 md:justify-start lg:justify-end">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.name} — ${s.handle}`}
                  title={`${s.name} — ${s.handle}`}
                  className="rounded-2xl transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-candle-gold"
                >
                  <PlatformIcon name={s.platform} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-arcane/20 bg-void/60">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-1.5 px-4 py-2.5 sm:flex-row">
          <p className="font-body text-xs text-lilac/70">
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-medium text-mist">Lamy Entertainment</span>. All rights reserved.
          </p>
          <nav aria-label="Liên kết chân trang" className="flex items-center gap-3">
            {BOTTOM_LINKS.map((link, i) => (
              <span key={link.path} className="flex items-center gap-3">
                {i > 0 && (
                  <span aria-hidden className="font-body text-xs text-lilac/30">
                    ·
                  </span>
                )}
                <Link
                  to={link.path}
                  className="font-body text-xs font-medium text-lilac/70 transition-colors hover:text-mist"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
