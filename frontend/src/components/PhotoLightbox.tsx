import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./icons";

export type SpacePhoto = {
  webp: string;
  jpg: string;
  webpSmall: string;
  jpgSmall: string;
  alt: string;
};

type Props = {
  photo: SpacePhoto | null;
  onClose: () => void;
};

/**
 * Lightbox dùng chung cho ảnh không gian. Render qua portal để luôn nằm trên
 * navbar/CTA bar, khoá scroll nền và đóng bằng Escape/click ra ngoài.
 */
export default function PhotoLightbox({ photo, onClose }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!photo) return;
    document.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [photo, handleKey]);

  if (!photo) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh không gian"
      className="fixed inset-0 z-[1000] flex animate-fade-in items-center justify-center bg-black/85 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        autoFocus
        aria-label="Đóng ảnh"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-mist/20 bg-void/70 text-mist/70 backdrop-blur transition-colors hover:border-candle-gold/50 hover:text-candle-gold"
      >
        <Icon name="close" className="h-5 w-5" />
      </button>

      <figure
        className="flex max-h-[92vh] w-full max-w-5xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <picture>
          <source srcSet={photo.webp} type="image/webp" />
          <img
            src={photo.jpg}
            alt={photo.alt}
            className="max-h-[80vh] w-auto max-w-full rounded-2xl border border-arcane/20 object-contain shadow-2xl shadow-black/70"
          />
        </picture>
      </figure>
    </div>,
    document.body
  );
}
