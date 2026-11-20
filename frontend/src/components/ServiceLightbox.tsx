import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";
import type { ServiceSlide } from "../data/serviceImages";

type Props = {
  slides: ServiceSlide[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

const ARROW_LEFT = "M15 19l-7-7 7-7";
const ARROW_RIGHT = "M9 5l7 7-7 7";

/**
 * Lightbox cho ảnh bảng giá dịch vụ.
 *
 * Ảnh bảng giá có nhiều chữ nên trên điện thoại khung carousel không đủ đọc.
 * Lightbox cho chạm để phóng to (cuộn/pan được), đổi ảnh bằng nút hoặc vuốt,
 * đóng bằng Escape / nút X / chạm nền.
 */
export default function ServiceLightbox({ slides, index, onIndexChange, onClose }: Props) {
  const [zoomed, setZoomed] = useState(false);
  /** Chỉ phóng to trên màn hình hẹp — desktop đã hiện ảnh gần đủ rộng. */
  const [canZoom, setCanZoom] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const swipedAt = useRef(0);

  const count = slides.length;
  const slide = slides[index];

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setCanZoom(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      setZoomed(false);
      onIndexChange((index + delta + count) % count);
    },
    [count, index, onIndexChange]
  );

  useEffect(() => {
    setZoomed(false);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [go, onClose]);

  if (!slide) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ảnh dịch vụ: ${slide.name}`}
      className="fixed inset-y-0 left-0 z-[1000] flex w-screen animate-fade-in flex-col bg-void/97 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Thanh trên: số thứ tự + tên + đóng */}
      <div
        className="flex shrink-0 items-start justify-between gap-4 px-4 pb-2 pt-4 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="font-body text-[10px] uppercase tracking-[0.22em] text-candle-gold/80">
            {index + 1} / {count}
          </p>
          <h2 className="mt-1 truncate font-display text-lg leading-tight text-mist sm:text-xl">
            {slide.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="Đóng ảnh"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-mist/20 bg-void/70 text-mist/70 backdrop-blur transition-colors hover:border-candle-gold/50 hover:text-candle-gold"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>

      {/* Ảnh */}
      <div
        className={`relative min-h-0 flex-1 ${zoomed ? "overflow-auto" : "overflow-hidden"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex w-full p-2 sm:p-4 ${
            zoomed ? "min-h-full items-start justify-start" : "h-full items-center justify-center"
          }`}
        >
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.name}
            draggable={false}
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const start = drag.current;
              drag.current = null;
              if (!start) return;
              const dx = e.clientX - start.x;
              if (!zoomed && Math.abs(dx) > 55) {
                swipedAt.current = Date.now();
                go(dx < 0 ? 1 : -1);
              }
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onClick={() => {
              if (!canZoom) return;
              if (Date.now() - swipedAt.current < 350) return;
              setZoomed((z) => !z);
            }}
            className={
              zoomed
                ? "h-auto w-[260%] max-w-none cursor-zoom-out rounded-lg sm:w-[150%]"
                : `max-h-full max-w-full rounded-lg object-contain ${
                    canZoom ? "cursor-zoom-in select-none" : ""
                  }`
            }
          />
        </div>

        {count > 1 && !zoomed && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Ảnh trước"
              className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-candle-gold/40 bg-void/60 text-mist backdrop-blur-sm transition-all hover:border-candle-gold hover:text-candle-gold active:scale-95 sm:left-3"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ARROW_LEFT} />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Ảnh sau"
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-candle-gold/40 bg-void/60 text-mist backdrop-blur-sm transition-all hover:border-candle-gold hover:text-candle-gold active:scale-95 sm:right-3"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ARROW_RIGHT} />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Chân: mô tả + gợi ý thao tác */}
      <div
        className="flex shrink-0 flex-col items-center gap-1 px-4 pb-5 pt-2 text-center sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {slide.caption && !zoomed && (
          <p className="max-w-2xl font-body text-xs leading-relaxed text-lilac/75 sm:text-sm">
            {slide.caption}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-body text-[11px] text-lilac/50 sm:text-xs">
          {canZoom && <span>{zoomed ? "Chạm ảnh để thu nhỏ" : "Chạm ảnh để phóng to"}</span>}
          {count > 1 && <span className="hidden sm:inline">← → để chuyển ảnh</span>}
          {count > 1 && <span className="sm:hidden">Vuốt ngang để chuyển ảnh</span>}
        </div>
      </div>
    </div>,
    document.body
  );
}
