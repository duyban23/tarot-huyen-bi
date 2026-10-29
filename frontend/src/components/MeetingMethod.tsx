import type { MeetingMethod } from "../api/types";

/** Single source of truth for the Online/Offline meeting method UI. */
export const MEETING_METHODS: Record<
  MeetingMethod,
  { label: string; shortLabel: string; detail: string }
> = {
  online: {
    label: "Xem Online",
    shortLabel: "Onl",
    detail: "Gọi video, không cần đến tiệm",
  },
  offline: {
    label: "Xem Offline",
    shortLabel: "Off",
    detail: "Gặp trực tiếp tại tiệm",
  },
};

export function MeetingMethodIcon({
  method,
  className = "w-6 h-6",
}: {
  method: MeetingMethod;
  className?: string;
}) {
  if (method === "offline") {
    return (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
