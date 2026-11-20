import { useRef, useState } from "react";
import { Icon } from "./icons";
import ServiceLightbox from "./ServiceLightbox";
import { GALLERY_SLIDES, type ServiceSlide } from "../data/serviceImages";

type Props = {
  /** Mặc định lấy GALLERY_SLIDES trong data/serviceImages.ts */
  slides?: ServiceSlide[];
  className?: string;
  /** Có handler thì mỗi ảnh hiện nút đặt đúng dịch vụ đó */
  onPick?: (slide: ServiceSlide) => void;
};

const ARROW_LEFT = "M15 19l-7-7 7-7";
const ARROW_RIGHT = "M9 5l7 7-7 7";

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={dir === "left" ? ARROW_LEFT : ARROW_RIGHT}
      />
    </svg>
  );
}

/**
 * Carousel ảnh bảng giá dịch vụ ở `/booking`.
 *
 * Ảnh gốc có nhiều tỉ lệ khác nhau (1.5 → 1.83) và là bảng chữ dày, nên khung
 * dùng một tỉ lệ cố định + `object-contain` trên nền mờ lấy từ chính ảnh: mọi
 * ảnh đều cùng khung, không bị cắt mất chữ. Chạm vào ảnh mở lightbox để đọc rõ.
 */
export default function ServiceGallery({
  slides = GALLERY_SLIDES,
  className = "",
  onPick,
}: Props) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const dragStart = useRef<number | null>(null);
  const swipedAt = useRef(0);

  const count = slides.length;
  const safeIndex = count > 0 ? Math.min(index, count - 1) : 0;
  const slide = count > 0 ? slides[safeIndex] : null;

  function go(delta: number) {
    if (count < 2) return;
    setIndex((i) => (i + delta + count) % count);
  }

  if (!slide) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border border-velvet/60 bg-gradient-to-br from-velvet/55 via-void/70 to-arcane/15 ${className}`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-44 w-64 -translate-x-1/2 rounded-full bg-candle-gold/15 blur-3xl"
        />
        <div className="relative flex aspect-[3/2] flex-col items-center justify-center gap-3 px-6 text-center sm:aspect-[16/10]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-candle-gold/40 bg-candle-gold/10 text-candle-gold shadow-[0_0_28px_-10px_rgba(212,168,67,0.8)]">
            <Icon name="sparkles" className="h-6 w-6" />
          </span>
          <p className="font-display text-base text-mist sm:text-lg">Bảng giá đang được cập nhật</p>
          <p className="max-w-xs font-body text-sm leading-relaxed text-lilac/70">
            My sẽ sớm thêm ảnh bảng giá đầy đủ. Trong lúc chờ, bạn chọn dịch vụ ở trang
            Dịch vụ rồi quay lại đây chọn ngày giờ nhé.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Ảnh bảng giá dịch vụ"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        }
      }}
    >
      <figure className="relative m-0 overflow-hidden rounded-3xl border border-velvet/60 bg-void/70 shadow-[0_40px_100px_-70px_rgba(0,0,0,1)]">
        <span
          aria-hidden
          className="absolute inset-x-10 top-0 z-20 h-px bg-gradient-to-r from-transparent via-candle-gold/45 to-transparent"
        />

        <div
          className="relative aspect-[3/2] touch-pan-y select-none overflow-hidden sm:aspect-[16/10]"
          onPointerDown={(e) => {
            dragStart.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (dragStart.current === null) return;
            const dx = e.clientX - dragStart.current;
            dragStart.current = null;
            if (Math.abs(dx) > 40) {
              swipedAt.current = Date.now();
              go(dx < 0 ? 1 : -1);
            }
          }}
          onPointerCancel={() => {
            dragStart.current = null;
          }}
          onPointerLeave={() => {
            dragStart.current = null;
          }}
        >
          {/* Nền mờ lấy từ chính ảnh — lấp phần trống của các tỉ lệ khác nhau */}
          <img
            src={slide.src}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
          />
          <div aria-hidden className="absolute inset-0 bg-void/45" />

          <button
            type="button"
            onClick={() => {
              if (Date.now() - swipedAt.current < 350) return;
              setZoomOpen(true);
            }}
            aria-label={`Xem lớn ảnh: ${slide.name}`}
            className="group absolute inset-0 flex items-center justify-center p-1.5 sm:p-3"
          >
            <img
              key={slide.src}
              src={slide.srcSmall ?? slide.src}
              srcSet={
                slide.srcSmall
                  ? `${slide.srcSmall} 900w, ${slide.src} 1600w`
                  : undefined
              }
              sizes="(min-width: 640px) 768px, 100vw"
              alt={slide.name}
              draggable={false}
              className="max-h-full w-auto max-w-full animate-fade-in rounded-lg object-contain shadow-2xl shadow-black/60"
            />

            <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full border border-candle-gold/35 bg-void/60 px-2.5 py-1 font-body text-[10px] uppercase tracking-[0.15em] text-candle-gold/85 backdrop-blur-sm transition-all group-hover:border-candle-gold/70 group-hover:text-candle-gold">
              <Icon name="search" className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Xem lớn</span>
            </span>
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Ảnh trước"
                className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-candle-gold/45 bg-void/65 text-mist backdrop-blur-sm transition-all hover:border-candle-gold hover:text-candle-gold active:scale-95 sm:left-3 sm:flex sm:h-11 sm:w-11"
              >
                <Arrow dir="left" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Ảnh sau"
                className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-candle-gold/45 bg-void/65 text-mist backdrop-blur-sm transition-all hover:border-candle-gold hover:text-candle-gold active:scale-95 sm:right-3 sm:flex sm:h-11 sm:w-11"
              >
                <Arrow dir="right" />
              </button>
            </>
          )}
        </div>

        <figcaption className="flex items-start justify-between gap-3 border-t border-velvet/60 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="min-w-0">
            <p className="font-body text-[11px] uppercase tracking-[0.2em] text-candle-gold/90">
              {safeIndex + 1} / {count}
            </p>
            <h3 className="mt-1 font-display text-base leading-tight text-mist sm:text-lg">
              {slide.name}
            </h3>
            {slide.caption && (
              <p className="mt-1 max-w-lg font-body text-xs leading-relaxed text-lilac/75 sm:text-sm">
                {slide.caption}
              </p>
            )}
          </div>
          {onPick && (
            <button
              type="button"
              onClick={() => onPick(slide)}
              className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-candle-gold/55 bg-candle-gold/15 px-3 py-1.5 font-body text-[11px] uppercase tracking-wider text-candle-gold transition-all hover:bg-candle-gold/25 active:scale-[0.97]"
            >
              Đặt
              <Icon name="sparkles" className="h-3.5 w-3.5" />
            </button>
          )}
        </figcaption>
      </figure>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Ảnh trước"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-velvet/70 text-lilac/70 transition-colors hover:border-candle-gold/50 hover:text-candle-gold active:scale-95 sm:hidden"
          >
            <Arrow dir="left" />
          </button>

          <div className="flex items-center">
            {slides.map((s, i) => (
              <button
                key={`${s.src}-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Xem ảnh ${i + 1}: ${s.name}`}
                aria-current={i === safeIndex}
                className="flex h-8 w-6 items-center justify-center"
              >
                <span
                  className={`block h-2 rounded-full transition-all ${
                    i === safeIndex
                      ? "w-6 bg-candle-gold"
                      : "w-2 bg-lilac/30 hover:bg-lilac/60"
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Ảnh sau"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-velvet/70 text-lilac/70 transition-colors hover:border-candle-gold/50 hover:text-candle-gold active:scale-95 sm:hidden"
          >
            <Arrow dir="right" />
          </button>
        </div>
      )}

      {zoomOpen && (
        <ServiceLightbox
          slides={slides}
          index={safeIndex}
          onIndexChange={setIndex}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}
