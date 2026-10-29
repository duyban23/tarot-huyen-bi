import { useEffect, useRef } from "react";
import anime from "animejs";

interface Step {
  label: string;
}

const STEPS: Step[] = [
  { label: "Chọn dịch vụ" },
  { label: "Ngày & giờ" },
  { label: "Thông tin" },
];

// SVG moon phase paths for crescent → half → gibbous → full
function MoonIcon({ phase }: { phase: number }) {
  // phase: 0 = thin crescent, 1 = half, 2 = gibbous, 3 = full
  const clipId = `moon-clip-${phase}`;
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" className="inline-block">
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={32} height={32} />
        </clipPath>
      </defs>
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Shadowed portion (sliding crescent) */}
      <circle
        cx={16 + (phase / 3) * 10 - 5}
        cy="16"
        r="14"
        fill="currentColor"
        opacity={phase === 3 ? 1 : 0.3 + phase * 0.15}
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}

export default function MoonStepper({ current }: { current: number }) {
  const prevRef = useRef(current);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevRef.current !== current && barRef.current) {
      anime({
        targets: barRef.current,
        scaleX: [prevRef.current / (STEPS.length - 1), current / (STEPS.length - 1)],
        duration: 500,
        easing: "easeOutCubic",
      });
      prevRef.current = current;
    }
  }, [current]);

  return (
    <nav className="w-full max-w-lg mx-auto mb-8 md:mb-10" aria-label="Đặt lịch tiến trình">
      {/* Progress bar */}
      <div className="relative h-1 bg-velvet rounded-full mb-6 overflow-hidden">
        <div
          ref={barRef}
          className="absolute inset-y-0 left-0 bg-arcane rounded-full origin-left"
          style={{
            width: "100%",
            transform: `scaleX(${current / (STEPS.length - 1)})`,
          }}
        />
      </div>

      {/* Steps */}
      <div className="flex justify-between">
        {STEPS.map((step, i) => {
          const isActive = i <= current;
          const isCurrent = i === current;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  isActive
                    ? "border-arcane bg-arcane/20 text-arcane"
                    : "border-lilac/30 text-lilac/50"
                } ${isCurrent ? "ring-2 ring-candle-gold/50" : ""}`}
              >
                {i < current ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <MoonIcon phase={i} />
                )}
              </div>
              <span
                className={`text-[11px] md:text-sm font-body font-semibold tracking-wider uppercase text-center ${
                  isActive ? "text-mist" : "text-lilac/50"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
