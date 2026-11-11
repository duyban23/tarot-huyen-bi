import { useState } from "react";
import PhotoLightbox, { type SpacePhoto } from "./PhotoLightbox";

const PHOTOS: SpacePhoto[] = [
  {
    webp: "/images/space/gallery/space-03.webp",
    jpg: "/images/space/gallery/space-03.jpg",
    webpSmall: "/images/space/gallery/space-03-900.webp",
    jpgSmall: "/images/space/gallery/space-03-900.jpg",
    alt: "My đang trải bài tarot cho khách bên bàn đèn nến",
  },
  {
    webp: "/images/space/gallery/space-02.webp",
    jpg: "/images/space/gallery/space-02.jpg",
    webpSmall: "/images/space/gallery/space-02-900.webp",
    jpgSmall: "/images/space/gallery/space-02-900.jpg",
    alt: "Bàn trải bài với các lá bài, hộp trà và ánh nến",
  },
  {
    webp: "/images/space/gallery/space-01-portrait.webp",
    jpg: "/images/space/gallery/space-01-portrait.jpg",
    webpSmall: "/images/space/gallery/space-01-portrait-900.webp",
    jpgSmall: "/images/space/gallery/space-01-portrait-900.jpg",
    alt: "Cận cảnh bàn trải bài tarot trong ánh nến",
  },
];

/**
 * Gallery 3 ảnh không gian: mobile 1 ảnh lớn + 2 ảnh đôi, desktop 3 cột.
 * Không caption — chỉ ảnh. Ảnh 1 dùng bản crop 4:5 để không lộ mặt khách;
 * bản rộng chỉ dùng làm nền cho quote band ở trang Giới thiệu (đã có
 * gradient che bên trái).
 */
export default function SpaceGallery() {
  const [active, setActive] = useState<SpacePhoto | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {PHOTOS.map((photo, i) => (
          <button
            key={photo.webp}
            type="button"
            onClick={() => setActive(photo)}
            aria-label="Xem ảnh không gian"
            className={`group relative cursor-zoom-in overflow-hidden rounded-2xl border border-velvet/60 bg-velvet/30 text-left shadow-lg shadow-void/30 transition-all duration-500 hover:-translate-y-1 hover:border-arcane/40 hover:shadow-xl hover:shadow-arcane/15 ${
              i === 0
                ? "col-span-2 aspect-[4/3] sm:col-span-1 sm:aspect-[4/5]"
                : "aspect-[4/5]"
            }`}
          >
            <picture>
              <source srcSet={photo.webpSmall} type="image/webp" />
              <img
                src={photo.jpgSmall}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
                className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] ${
                  i === 0 ? "object-[center_22%] sm:object-center" : "object-center"
                }`}
              />
            </picture>

            <span
              aria-hidden
              className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-mist/25 bg-void/45 font-body text-sm text-mist/80 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110"
            >
              +
            </span>
          </button>
        ))}
      </div>

      <PhotoLightbox photo={active} onClose={() => setActive(null)} />
    </>
  );
}
