import { useEffect, useCallback } from "react";

interface FeedbackItem {
  type: "image" | "video";
  src: string;
  stars: number;
  customerName?: string;
  service?: string;
  comment?: string;
  date?: string;
}

interface Props {
  item: FeedbackItem;
  onClose: () => void;
}

export default function FeedbackLightbox({ item, onClose }: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] text-mist/60 hover:text-mist transition-colors text-sm font-body tracking-wide z-10 bg-void/80 rounded-full hover:bg-void p-2"
          aria-label="Đóng"
        >
          ✕
        </button>

        <div className="bg-void border border-velvet rounded-2xl overflow-hidden">
          <img
            src={item.src}
            alt={item.customerName ? `Feedback từ ${item.customerName}` : 'Feedback'}
            className="w-full max-h-[70vh] object-contain"
          />
        </div>
        {item.customerName && (
          <div className="mt-4 px-6 py-4 bg-velvet/20 rounded-xl border border-velvet/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-candle-gold text-sm font-medium">
                {item.customerName}
              </span>
              <span className="text-lilac/70 text-xs">
                {item.service}
              </span>
            </div>
            <p className="text-lilac/90 text-sm mb-2">
              {item.comment}
            </p>
            <div className="flex items-center justify-between">
              <div className="text-candle-gold text-sm tracking-wider">
                {'★'.repeat(item.stars)}
              </div>
              <span className="text-lilac/60 text-xs">
                {item.date}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
