import { useEffect, useRef, type ReactNode } from "react";
import anime from "animejs";
import type { Booking } from "../api/types";
import { MEETING_METHODS, MeetingMethodIcon } from "./MeetingMethod";

interface Props {
  booking: Booking;
  serviceName: string;
}

/** Fixed sparkle positions — calculated once, not per render */
const SPARKLES = Array.from({ length: 8 }, (_, i) => ({
  left: 10 + (i * 9) % 70,   // spread across 10-80%
  top: 8 + (i * 13) % 25,     // spread across 8-33%
  bg: i % 2 === 0 ? "#CBA135" : "#6E2FD9",
}));

export default function ConfirmationScreen({ booking, serviceName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Draw checkmark path
    const checkmark = container.querySelector(".checkmark-path") as SVGPathElement | null;
    if (checkmark) {
      anime({
        targets: checkmark,
        strokeDashoffset: [anime.setDashoffset, 0],
        duration: 800,
        easing: "easeOutCubic",
      });
    }

    // Glow ring expansion
    const glowRing = container.querySelector(".glow-ring") as SVGCircleElement | null;
    if (glowRing) {
      anime({
        targets: glowRing,
        scale: [0.5, 1.2],
        opacity: [0.6, 0],
        duration: 1200,
        easing: "easeOutCubic",
      });
    }

    // Sparkle particles with clamped positions
    const sparkles = container.querySelectorAll(".sparkle");
    sparkles.forEach((s, i) => {
      anime({
        targets: s,
        translateY: [0, -30 - Math.random() * 30],
        translateX: [0, (Math.random() - 0.5) * 40],
        opacity: [1, 0],
        scale: [1, 0.15],
        duration: 900 + Math.random() * 500,
        delay: 400 + i * 70,
        easing: "easeOutCubic",
      });
    });
  }, []);

  const method: "online" | "offline" =
    booking.meeting_method === "offline" ? "offline" : "online";

  const rows: { label: string; value: ReactNode; gold?: boolean }[] = [
    { label: "Dịch vụ", value: serviceName },
    {
      label: "Hình thức",
      value: (
        <span className="inline-flex items-center gap-1.5">
          <MeetingMethodIcon method={method} className="w-4 h-4 text-candle-gold" />
          {MEETING_METHODS[method].label} — {MEETING_METHODS[method].detail}
        </span>
      ),
    },
    { label: "Ngày", value: booking.appointment_date },
    { label: "Giờ", value: booking.appointment_time },
    { label: "Tên", value: booking.customer_name },
    { label: "SĐT", value: booking.customer_phone },
    { label: "Trạng thái", value: "Chờ xác nhận", gold: true },
  ];

  return (
    <div ref={containerRef} className="text-center max-w-lg mx-auto py-8 relative overflow-hidden">
      {/* Sparkles — fixed positions */}
      {SPARKLES.map((s, i) => (
        <div
          key={i}
          className="sparkle absolute w-1.5 h-1.5 rounded-full"
          style={{ background: s.bg, left: `${s.left}%`, top: `${s.top}%` }}
        />
      ))}

      {/* Glowing orbital ring */}
      <svg
        className="absolute left-1/2 top-[15%] -translate-x-1/2 -translate-y-1/2 w-28 h-28 pointer-events-none"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle
          className="glow-ring"
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#6E2FD9"
          strokeWidth="1"
          opacity="0"
          style={{ transformOrigin: "center" }}
        />
      </svg>

      {/* Star + checkmark icon */}
      <svg
        className="w-16 h-16 mx-auto mb-4 relative"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="checkmark-path"
          d="M20 34l8 8 16-16"
          stroke="#6E2FD9"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M32 6l6.3 12.9 14.2 2-10.3 10 2.4 14.1L32 38.1 19.4 45l2.4-14.1L11.5 20.9l14.2-2z"
          fill="none"
          stroke="#CBA135"
          strokeWidth="1.5"
          opacity="0.6"
        />
      </svg>

      <h2 className="font-display text-2xl tracking-wider uppercase text-mist mb-2">
        Đặt lịch thành công!
      </h2>
      <p className="font-body text-lilac italic mb-6">
        Vũ trụ đã ghi nhận cuộc hẹn của bạn...
      </p>

      {/* Summary — responsive wrapping */}
      <div className="bg-velvet/60 rounded-xl p-4 sm:p-6 text-left space-y-3 border border-velvet">
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2 text-sm sm:text-base"
          >
            <span className="font-body text-lilac/70 shrink-0">{r.label}</span>
            <span
              className={`font-body font-semibold break-words ${
                r.gold ? "text-candle-gold" : "text-mist"
              }`}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>

      <p className="font-body text-lilac/60 text-sm italic mt-6">
        My sẽ liên hệ bạn trong thời gian sớm nhất để xác nhận lịch hẹn.
      </p>
    </div>
  );
}
