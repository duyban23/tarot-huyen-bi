/**
 * Logo thương hiệu — **một chỗ duy nhất** định kích cỡ và độ sáng.
 *
 *  - `size="hero"`: logo lớn ở đầu trang giới thiệu (trang chủ, /services, /about)
 *    + quầng vàng `aura` cho rực rỡ (giống hệt nhau ở cả 3 trang).
 *  - `size="bar"`: logo nhỏ trong thanh dính (navbar, footer, thanh đặt lịch nổi).
 *
 * Muốn đổi cỡ logo thì sửa `SIZES` ở đây — tất cả các chỗ dùng theo ngay.
 */

const SIZES = {
  hero: {
    box: "w-48 md:w-60 h-auto",
    sizes: "(max-width: 768px) 192px, 240px",
    src: "/logo/logo-192.webp",
    srcSet: "/logo/logo-192.webp 192w, /logo/logo-512.webp 512w",
  },
  bar: {
    box: "h-12 w-auto",
    sizes: "48px",
    src: "/logo/logo-128.webp",
    srcSet: "/logo/logo-128.webp 128w, /logo/logo-192.webp 192w",
  },
} as const;

export type LogoSize = keyof typeof SIZES;

/** Làm sáng: `brightness-125` + quầng vàng (logo lớn thì quầng đậm & xa hơn). */
const GLOW: Record<LogoSize, string> = {
  hero: "brightness-125 drop-shadow-[0_0_35px_rgba(212,168,67,0.7)] drop-shadow-[0_0_90px_rgba(212,168,67,0.4)]",
  bar: "brightness-125 drop-shadow-[0_0_12px_rgba(212,168,67,0.6)]",
};

export default function BrandLogo({
  size = "hero",
  aura = size === "hero",
  loading = "eager",
  className = "",
}: {
  size?: LogoSize;
  /** Vầng sáng vàng mờ phía sau (chỉ nên bật cho logo lớn) */
  aura?: boolean;
  loading?: "eager" | "lazy";
  /** Thêm cho ảnh (vd "rounded-lg bg-void/30" ở footer) */
  className?: string;
}) {
  const s = SIZES[size];
  const img = (
    <img
      src={s.src}
      srcSet={s.srcSet}
      sizes={s.sizes}
      width={192}
      height={225}
      alt="Healing With My"
      loading={loading}
      decoding="async"
      className={`${aura ? "relative " : ""}${s.box} ${GLOW[size]}${className ? ` ${className}` : ""}`}
    />
  );

  if (!aura) return img;

  return (
    <div className="relative w-fit mx-auto">
      <div
        aria-hidden
        className="absolute inset-0 -m-10 rounded-full bg-[radial-gradient(circle,rgba(212,168,67,0.38)_0%,rgba(184,132,159,0.18)_45%,transparent_70%)] blur-2xl"
      />
      {img}
    </div>
  );
}
