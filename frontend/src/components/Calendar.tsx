import { useEffect, useState } from "react";

interface Props {
  selected: string | null;
  onSelect: (date: string) => void;
}

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

export default function Calendar({ selected, onSelect }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startPad = firstDay.getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);

  function canGoPrev() {
    return viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());
  }

  function prev() {
    if (!canGoPrev()) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function next() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function isPast(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  }

  function dateStr(day: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  useEffect(() => {
    if (!selected) {
      setViewMonth(today.getMonth());
      setViewYear(today.getFullYear());
    }
  }, [selected]);

  const prevDisabled = !canGoPrev();

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Month nav */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={prev}
          disabled={prevDisabled}
          aria-label="Tháng trước"
          aria-disabled={prevDisabled}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors rounded-lg ${
            prevDisabled
              ? "text-lilac/20 cursor-not-allowed"
              : "text-lilac hover:text-mist hover:bg-velvet/60"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-display text-mist text-lg tracking-wide">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={next}
          aria-label="Tháng sau"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-lilac hover:text-mist hover:bg-velvet/60 transition-colors rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center font-body text-lilac/60 text-sm tracking-wide py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (d === null) return <div key={i} />;
          const past = isPast(d);
          const ds = dateStr(d);
          const isSelected = selected === ds;
          return (
            <button
              key={i}
              disabled={past}
              aria-disabled={past}
              aria-selected={isSelected}
              aria-label={`Ngày ${d} ${MONTHS[viewMonth]} ${viewYear}`}
              onClick={() => onSelect(ds)}
              className={`
                w-full aspect-square rounded-lg text-sm font-body font-semibold transition-all
                ${past
                  ? "text-lilac/20 cursor-not-allowed"
                  : isSelected
                    ? "bg-candle-gold text-void shadow-lg shadow-candle-gold/40 ring-1 ring-candle-gold"
                    : "text-lilac hover:bg-velvet hover:text-mist hover:ring-1 hover:ring-candle-gold/40"
                }
                focus-visible:outline-2 focus-visible:outline-candle-gold focus-visible:outline-offset-2
              `}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
