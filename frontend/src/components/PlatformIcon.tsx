import type { ReactNode } from "react";

export type PlatformName =
  | "facebook"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "threads"
  | "zalo"
  | "messenger"
  | "phone";

const TILE: Record<PlatformName, string> = {
  facebook: "rounded-full bg-[#1877F2] text-white",
  youtube: "rounded-[11px] bg-[#FF0000] text-white",
  instagram:
    "rounded-[12px] bg-[linear-gradient(135deg,#FEDA75_0%,#FA7E1E_25%,#D62976_55%,#962FBF_78%,#4F5BD5_100%)] text-white",
  tiktok: "rounded-[11px] bg-black text-white",
  threads: "rounded-[12px] bg-[#F3EEE4] text-black",
  zalo: "rounded-[12px] bg-[#0068FF] text-white",
  messenger:
    "rounded-full bg-[linear-gradient(135deg,#00B2FF_0%,#006AFF_45%,#A033FF_100%)] text-white",
  phone: "rounded-[12px] bg-[#1F9D55] text-white",
};

const TIKTOK_PATH =
  "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z";

const GLYPHS: Record<PlatformName, ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
      <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5H16.7V4.6c-.3-.04-1.3-.12-2.45-.12-2.42 0-4.08 1.48-4.08 4.2v2.24H7.5V14h2.67v8h3.33z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
      <path d="M9 7.5v9l8-4.5-8-4.5z" />
    </svg>
  ),
  instagram: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
    >
      <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 overflow-visible">
      <g transform="translate(-0.35 -0.35)" fill="#25F4EE">
        <path d={TIKTOK_PATH} />
      </g>
      <g transform="translate(0.35 0.35)" fill="#FE2C55">
        <path d={TIKTOK_PATH} />
      </g>
      <path d={TIKTOK_PATH} fill="#FFFFFF" />
    </svg>
  ),
  threads: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
      <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z" />
    </svg>
  ),
  zalo: <span className="font-display text-[11px] font-bold tracking-tight">Zalo</span>,
  messenger: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-6 w-6"
    >
      <path
        d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.4 9.4 0 0 1-3.2-.6L4 21l1.3-3.6A8.2 8.2 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"
        strokeLinejoin="round"
      />
      <path
        d="M7.8 13.1l3.2-3.5 2.2 2.1 3.1-2.4-3.2 3.6-2.2-2.1-3.1 2.3z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  ),
  phone: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  ),
};

/** Icon nền tảng dạng ô màu thương hiệu, dùng chung cho footer và trang liên hệ. */
export default function PlatformIcon({
  name,
  className = "h-11 w-11",
  glyphClassName,
}: {
  name: PlatformName;
  className?: string;
  glyphClassName?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center shadow-[0_6px_18px_rgba(0,0,0,0.35)] ${TILE[name]} ${className}`}
    >
      <span className={glyphClassName}>{GLYPHS[name]}</span>
    </span>
  );
}
