import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Service } from "../api/types";
import { Icon } from "./icons";
import {
  CATEGORIES,
  fold,
  itemCta,
  itemHref,
  type CatalogCategory,
  type CatalogItem,
} from "../data/serviceCatalog";

type LinkMode = { mode: "link" };
type PickMode = {
  mode: "pick";
  services: Service[];
  selectedId: number | null;
  onSelect: (service: Service) => void;
};
type Props = LinkMode | PickMode;

type Row = { item: CatalogItem; service?: Service };

type Group = { cat: CatalogCategory; rows: Row[] };

/**
 * Bảng giá gọn dùng chung cho `/services` và bước chọn dịch vụ ở `/booking`.
 *
 * Trước đây 2 trang render hết 6 nhóm × 35 dòng ngay khi vào trang — rất dài
 * trên điện thoại. Giờ mỗi nhóm là 1 hàng gập lại được, chạm mới mở ra; ô tìm
 * kiếm thì trải phẳng kết quả. Cùng một component cho cả 2 chế độ:
 *  - "link": mỗi dòng là link đi đặt lịch (/services)
 *  - "pick": mỗi dòng chọn luôn dịch vụ ở bước 1 của /booking
 */
export default function ServiceCatalog(props: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const services = props.mode === "pick" ? props.services : [];

  const byName = useMemo(() => {
    const m = new Map<string, Service>();
    for (const s of services) m.set(fold(s.name.trim()), s);
    return m;
  }, [services]);

  const groups = useMemo<Group[]>(() => {
    const list: Group[] = CATEGORIES.map((cat) => ({
      cat,
      rows: cat.items
        .map((item) => ({ item, service: byName.get(fold(item.name)) }))
        // Chế độ chọn (ở /booking): chỉ hiện mục có service thật trong DB.
        // Mục không khớp DB mà render thành <Link to="/booking?service=...">
        // sẽ trỏ về đúng trang hiện tại → bấm không có gì xảy ra.
        .filter((row) => props.mode !== "pick" || row.service),
    }));

    // /booking lấy dịch vụ từ DB: dịch vụ nào admin thêm tay mà bảng giá chưa
    // có thì vẫn phải đặt lịch được → gom vào nhóm cuối.
    if (props.mode === "pick" && props.services.length > 0) {
      const known = new Set(CATEGORIES.flatMap((c) => c.items.map((i) => fold(i.name))));
      const seen = new Set<string>();
      const extra = props.services.filter((s) => {
        const key = fold(s.name.trim());
        if (known.has(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (extra.length > 0) {
        list.push({
          cat: {
            id: "db-them",
            icon: "sparkles",
            name: "Dịch vụ khác",
            desc: "Các dịch vụ được thêm từ trang quản trị.",
            items: [],
          },
          rows: extra.map((s) => ({
            service: s,
            item: { name: s.name, detail: s.description, price: "" },
          })),
        });
      }
    }
    return list;
  }, [byName, props]);

  const q = fold(query.trim());
  const visible = groups
    .map((g) => ({
      ...g,
      rows: q
        ? g.rows.filter((r) =>
            fold(`${r.item.name} ${r.item.detail ?? ""} ${r.service?.name ?? ""}`).includes(q)
          )
        : g.rows,
    }))
    .filter((g) => g.rows.length > 0);

  const total = visible.reduce((n, g) => n + g.rows.length, 0);

  return (
    <div>
      {/* ── Tìm kiếm (dính ngay dưới thanh menu) ── */}
      <div className="sticky top-16 z-30 -mx-4 px-4 pt-2 pb-3 bg-void/90 backdrop-blur-md">
        <div className="relative max-w-md mx-auto">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-lilac/50">
            <Icon name="search" className="w-5 h-5" />
          </span>
          <input
            // NOTE: phải là type="text", không dùng type="search": WebKit/Chromium
            // vẽ thêm nút xoá native → trùng với nút xoá bên dưới.
            type="text"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm trải bài… (vd: tình duyên)"
            aria-label="Tìm dịch vụ"
            className="w-full bg-velvet/60 border border-velvet rounded-xl pl-11 pr-10 py-2.5 font-body text-mist placeholder-lilac/40 focus:outline-none focus:border-candle-gold transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Xoá tìm kiếm"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-lilac/60 hover:text-mist"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          )}
        </div>
        {(q || props.mode === "pick") && (
          <p className="text-center font-body text-lilac/50 text-sm mt-1.5" role="status">
            {q ? `${total} kết quả` : `${total} trải bài · chạm một nhóm để mở`}
          </p>
        )}
      </div>

      {props.mode === "pick" && props.services.length === 0 ? (
        <p className="text-center font-body text-lilac/60 text-sm py-10 animate-pulse">
          Đang tải danh sách dịch vụ…
        </p>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 max-w-md mx-auto">
          <p className="font-display text-lg text-mist mb-2">Không tìm thấy trải bài phù hợp</p>
          <p className="font-body text-lilac/70 text-sm">
            Thử từ khoá khác, hoặc <Link to="/contact" className="text-candle-gold underline underline-offset-4">nhắn My</Link> để được tư vấn.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map(({ cat, rows }) => {
            // Đang tìm kiếm → mở hết để thấy ngay kết quả.
            const isOpen = q.length > 0 || open === cat.id;
            return (
              <div
                key={cat.id}
                className={`tap-card rounded-2xl ${isOpen ? "is-open" : ""}`}
              >
                {/* ── Hàng nhóm ── */}
                <button
                  type="button"
                  onClick={() => setOpen(open === cat.id ? null : cat.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-3 p-3.5 md:p-4 text-left min-h-[64px]"
                >
                  <span className="w-11 h-11 md:w-12 md:h-12 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-candle-gold/30 to-arcane/15 border-2 border-candle-gold/60 ring-1 ring-candle-gold/20 shadow-[0_0_16px_rgba(212,168,67,0.35)]">
                    <Icon name={cat.icon} className="w-6 h-6 md:w-7 md:h-7" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-display text-sm md:text-base tracking-wider uppercase text-mist">
                      {cat.name}
                    </span>
                    <span className="block font-body text-lilac/70 text-sm leading-snug mt-0.5 line-clamp-1 md:line-clamp-2">
                      {cat.desc}
                    </span>
                  </span>
                  <span className="shrink-0 flex items-center gap-1.5 text-lilac/60">
                    <span className="font-body text-xs whitespace-nowrap">{rows.length} mục</span>
                    <span
                      className={`inline-flex transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-candle-gold" : ""
                      }`}
                    >
                      <Icon name="chevron-down" className="w-5 h-5" />
                    </span>
                  </span>
                </button>

                {/* ── Danh sách trải bài trong nhóm ── */}
                <div
                  aria-hidden={!isOpen}
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-2 pb-2 md:px-3 md:pb-3 grid gap-0.5">
                      {rows.map((row, i) => (
                        <ItemRow
                          key={`${row.item.name}-${i}`}
                          row={row}
                          expanded={isOpen}
                          props={props}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Một dòng trải bài: link (mặc định) hoặc chọn luôn (ở /booking). */
function ItemRow({ row, expanded, props }: { row: Row; expanded: boolean; props: Props }) {
  const { item, service } = row;
  const price = service ? `${service.price.toLocaleString("vi-VN")}₫` : item.price;
  const sub =
    props.mode === "pick" && service
      ? `${service.duration_minutes} phút${item.detail ? ` · ${item.detail}` : ""}`
      : item.detail;

  const body = (
    <>
      <span className="flex-1 min-w-0">
        <span className="block font-body text-mist font-medium leading-snug group-hover/item:text-candle-gold transition-colors">
          {item.name}
        </span>
        {sub && (
          <span className="block font-body text-lilac/55 text-sm leading-snug mt-0.5 line-clamp-1 md:line-clamp-2">
            {sub}
          </span>
        )}
      </span>
      <span className="shrink-0 font-display text-candle-gold text-[13px] md:text-sm font-semibold tracking-wide whitespace-nowrap bg-candle-gold/15 border border-candle-gold/45 px-2.5 py-1 rounded-full">
        {price}
      </span>
    </>
  );

  // Dịch vụ không có trong DB (tư vấn / khoá học) → luôn là link.
  if (!service) {
    return (
      <Link
        to={itemHref(item)}
        title={itemCta(item)}
        tabIndex={expanded ? undefined : -1}
        className="tap-row group/item flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[52px] border border-transparent active:scale-[0.99]"
      >
        {body}
      </Link>
    );
  }

  if (props.mode !== "pick") {
    return (
      <Link
        to={itemHref(item)}
        title={itemCta(item)}
        tabIndex={expanded ? undefined : -1}
        className="tap-row group/item flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[52px] border border-transparent active:scale-[0.99]"
      >
        {body}
      </Link>
    );
  }

  const isSelected = props.selectedId === service.id;
  return (
    <button
      type="button"
      onClick={() => props.onSelect(service)}
      aria-pressed={isSelected}
      tabIndex={expanded ? undefined : -1}
      className={`tap-row group/item flex items-center gap-3 w-full text-left rounded-xl px-3 py-2.5 min-h-[52px] border border-transparent active:scale-[0.99] ${
        isSelected ? "is-selected" : ""
      }`}
    >
      {body}
      <svg
        className={`w-5 h-5 shrink-0 transition-colors ${isSelected ? "text-candle-gold" : "text-lilac/35"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
