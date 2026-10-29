import { useState } from "react";
import { Link } from "react-router-dom";
import { findItem, itemCta, itemHref, MOODS } from "../data/serviceCatalog";
import { Icon } from "./icons";

/**
 * Khối "Chọn theo nỗi lòng" ở /services: 4 thẻ, chạm là ra gợi ý — không cần
 * gõ gì (đa số khách xem trên điện thoại nên đây là đường vào chính).
 *
 * Lưu ý khi sửa:
 *  - `items-start` ở grid: không có nó thì mở 1 thẻ là thẻ cùng hàng bị kéo
 *    cao theo, trông như mở 2 thẻ cùng lúc.
 *  - Chỉ 1 thẻ mở tại một thời điểm (`open` là 1 chuỗi, không phải mảng).
 *  - Danh sách gợi ý của 4 thẻ không trùng nhau (xem MOODS trong
 *    data/serviceCatalog.ts).
 *
 * ── Chỗ nối AI sau này ──────────────────────────────────────────────────
 * Thêm ngay dưới 4 thẻ một ô "kể một câu" rồi render kết quả bằng `PickRow`:
 *
 *   const s: { reason: string; picks: string[] } = await suggestPicks(text);
 *
 * `picks` chỉ cần là **tên trải bài khớp bảng giá & DB** — `PickRow` đã tự tra
 * giá bằng `findItem` và bỏ qua tên lạ, nên không phải sửa gì ở phần này.
 * Dữ liệu `MOODS` cũng đã đúng hình dạng đó (question/hint/picks).
 */
export default function MoodPicker() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 items-start gap-2.5">
      {MOODS.map((m) => {
        const isOpen = open === m.id;
        return (
          <div key={m.id} className={`tap-card rounded-2xl ${isOpen ? "is-open" : ""}`}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : m.id)}
              aria-expanded={isOpen}
              className="w-full flex items-center gap-3 p-3.5 md:p-4 text-left min-h-[64px]"
            >
              <span className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-candle-gold/25 border-2 border-candle-gold/60">
                <Icon name={m.icon} className="w-6 h-6" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-display text-sm md:text-base leading-snug text-mist">
                  {m.question}
                </span>
                <span className="block font-body text-lilac/80 text-sm leading-snug mt-0.5 line-clamp-1 md:line-clamp-2">
                  {m.hint}
                </span>
              </span>
              <svg
                className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-candle-gold" : "text-lilac/60"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              aria-hidden={!isOpen}
              className={`grid transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-2 pb-2 md:px-3 md:pb-3">
                  <p className="font-body text-candle-gold/80 text-xs tracking-widest uppercase px-3 pt-1 pb-1.5">
                    Trải bài hay được chọn
                  </p>
                  <div className="grid gap-0.5">
                    {m.picks.map((name) => (
                      <PickRow key={name} name={name} expanded={isOpen} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Một dòng trải bài gợi ý — cùng kiểu với dòng trong bảng giá ở /booking. */
function PickRow({ name, expanded }: { name: string; expanded: boolean }) {
  const item = findItem(name);
  if (!item) return null;
  return (
    <Link
      to={itemHref(item)}
      title={itemCta(item)}
      tabIndex={expanded ? undefined : -1}
      className="tap-row group/item flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[52px] border border-transparent active:scale-[0.99]"
    >
      <span className="flex-1 min-w-0">
        <span className="block font-body text-mist font-medium leading-snug group-hover/item:text-candle-gold transition-colors">
          {item.name}
        </span>
        {item.detail && (
          <span className="block font-body text-lilac/60 text-sm leading-snug mt-0.5 line-clamp-2">
            {item.detail}
          </span>
        )}
      </span>
      <span className="shrink-0 font-display text-candle-gold text-[13px] md:text-sm font-semibold tracking-wide whitespace-nowrap bg-candle-gold/15 border border-candle-gold/45 px-2.5 py-1 rounded-full">
        {item.price}
      </span>
    </Link>
  );
}
