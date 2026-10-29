/** Bộ icon SVG dùng chung toàn web (line-style, stroke currentColor).
 * Data chỉ lưu key chuỗi (vd icon: "tarot"), render qua <Icon name={...} /> —
 * không hardcode emoji, không lặp path SVG ở từng trang. */

export type IconName =
  | "time"
  | "ai"
  | "tarot"
  | "leaf"
  | "cards"
  | "combo"
  | "crystal"
  | "book"
  | "sprout"
  | "heart-crack"
  | "briefcase"
  | "moon"
  | "home"
  | "trophy"
  | "heart"
  | "news"
  | "numbers"
  | "star"
  | "users"
  | "yinyang"
  | "heartbeat"
  | "sparkles";

const PATHS: Record<IconName, React.ReactNode> = {
  time: (
    <>
      <path d="M6 3h12M6 21h12" />
      <path d="M7 3v3.5L12 11l5-4.5V3" />
      <path d="M7 21v-3.5L12 13l5 4.5V21" />
    </>
  ),
  ai: (
    <>
      <path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
      <path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8L19 15z" />
    </>
  ),
  tarot: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M12 8.2l.9 2 2.2.3-1.6 1.6.4 2.2-2-1-1.9 1 .4-2.2-1.6-1.6 2.2-.3.9-2z" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 10 12 5.5 20 4c-1 8-5.5 15-15 15" />
      <path d="M5 19c3-5.5 7-9.5 12-11.5" />
    </>
  ),
  cards: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3.5 12.5L12 17l8.5-4.5" />
      <path d="M3.5 16.5L12 21l8.5-4.5" />
    </>
  ),
  combo: (
    <>
      <rect x="3" y="7" width="12" height="13" rx="2" />
      <path d="M8 7V6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2h-1" />
      <path d="M7 12h4M9 10v4" />
    </>
  ),
  crystal: (
    <>
      <circle cx="12" cy="10" r="6" />
      <path d="M12 7.2l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7.7-1.5z" />
      <path d="M9 17.5h6M8.5 20.5h7" />
    </>
  ),
  book: (
    <path d="M12 6.5C10 4.9 7.5 4.2 4 4.2v13.6c3.5 0 6 .7 8 2.3 2-1.6 4.5-2.3 8-2.3V4.2c-3.5 0-6 .7-8 2.3zm0 0v13.6" />
  ),
  sprout: (
    <>
      <path d="M12 21v-8" />
      <path d="M12 13c0-4 3-6.5 8.5-6.5 0 4.5-3.5 6.5-8.5 6.5z" />
      <path d="M12 13.5c0-3-2.5-5-7-5 0 3.8 3 5 7 5z" />
    </>
  ),
  "heart-crack": (
    <>
      <path d="M12 20.5S3.5 15.4 3.5 9.6C3.5 7 5.5 5 8 5c1.6 0 3.1.8 4 2.1C12.9 5.8 14.4 5 16 5c2.5 0 4.5 2 4.5 4.6 0 5.8-8.5 10.9-8.5 10.9z" />
      <path d="M11 5.5l2 2.5-2 2 2 2.5-1.2 3" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7.5" width="18" height="12.5" rx="2" />
      <path d="M8.5 7.5V6a2 2 0 012-2h3a2 2 0 012 2v1.5" />
      <path d="M3 12.5h18" />
    </>
  ),
  moon: (
    <path d="M20.5 14.5A8 8 0 019.5 3.5a8 8 0 1011 11z" />
  ),
  home: (
    <>
      <path d="M3.5 11.5L12 4l8.5 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8M12 16.5V21" />
      <path d="M7.5 4h9v4.5a4.5 4.5 0 01-9 0V4z" />
      <path d="M7.5 5.5H4.8A1.3 1.3 0 003.5 6.8c0 2.4 1.9 3.9 4 3.9M16.5 5.5h2.7a1.3 1.3 0 011.3 1.3c0 2.4-1.9 3.9-4 3.9" />
    </>
  ),
  heart: (
    <path d="M12 20.5S3.5 15.4 3.5 9.6C3.5 7 5.5 5 8 5c1.6 0 3.1.8 4 2.1C12.9 5.8 14.4 5 16 5c2.5 0 4.5 2 4.5 4.6 0 5.8-8.5 10.9-8.5 10.9z" />
  ),
  news: (
    <>
      <path d="M4 6.5h12.5V18H6a2 2 0 01-2-2V6.5z" />
      <path d="M16.5 8.5H19a1 1 0 011 1V17a2 2 0 01-2 2" />
      <path d="M7.5 10.5h5.5M7.5 13.8h5.5" />
    </>
  ),
  numbers: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M9.5 9h.01M12 9h.01M14.5 9h.01M9.5 12.5h.01M12 12.5h.01M14.5 12.5h.01" />
      <path d="M9 16.5h6" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.5 5.4 5.9.7-4.3 4 1.1 5.8L12 16.4l-5.2 3 1.1-5.8-4.3-4 5.9-.7L12 3.5z" />
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.2 19.5c.7-3.2 3-5 5.8-5s5.1 1.8 5.8 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M17.5 14.7c2 .6 3.3 2.3 3.6 4.3" />
    </>
  ),
  yinyang: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a4 4 0 010 8 4 4 0 000 8" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  heartbeat: (
    <>
      <path d="M12 20.5S3.5 15.4 3.5 9.6C3.5 7 5.5 5 8 5c1.6 0 3.1.8 4 2.1C12.9 5.8 14.4 5 16 5c2.5 0 4.5 2 4.5 4.6 0 5.8-8.5 10.9-8.5 10.9z" />
      <path d="M6.5 12h2.5l1.3-2.5 2 4 1.3-1.5h3.9" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
    </>
  ),
};

/** Màu riêng từng icon cho sinh động (Tailwind classes). */
const COLORS: Record<IconName, string> = {
  time: "text-sky-300",
  ai: "text-violet-300",
  tarot: "text-candle-gold",
  leaf: "text-green-300",
  cards: "text-orange-300",
  combo: "text-pink-300",
  crystal: "text-purple-300",
  book: "text-amber-300",
  sprout: "text-emerald-300",
  "heart-crack": "text-rose-300",
  briefcase: "text-amber-400",
  moon: "text-indigo-200",
  home: "text-teal-300",
  trophy: "text-yellow-300",
  heart: "text-rose-400",
  news: "text-sky-300",
  numbers: "text-cyan-300",
  star: "text-yellow-300",
  users: "text-pink-300",
  yinyang: "text-stone-200",
  heartbeat: "text-red-400",
  sparkles: "text-candle-gold",
};

export function Icon({
  name,
  className = "w-6 h-6",
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const paths = (PATHS as Record<string, React.ReactNode>)[name] ?? PATHS.sparkles;
  const color = (COLORS as Record<string, string>)[name] ?? "text-candle-gold";
  return (
    <svg
      className={`${color} ${className}`}
      style={style}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
