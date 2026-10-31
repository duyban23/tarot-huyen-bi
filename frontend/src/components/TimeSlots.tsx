import { useEffect, useState } from "react";
import { getAvailability } from "../api/client";
import { Icon } from "./icons";

interface Props {
  serviceId: number;
  date: string;
  selected: string | null;
  onSelect: (time: string) => void;
}

const SESSIONS = [
  { label: "Khuya", icon: "moon", from: 0, to: 6 },
  { label: "Buổi sáng", icon: "sunrise", from: 6, to: 12 },
  { label: "Buổi chiều", icon: "sun", from: 12, to: 18 },
  { label: "Buổi tối", icon: "sunset", from: 18, to: 24 },
];

function sessionOf(t: string) {
  const hour = parseInt(t.split(":")[0], 10);
  return SESSIONS.find((s) => hour >= s.from && hour < s.to) ?? SESSIONS[0];
}

export default function TimeSlots({ serviceId, date, selected, onSelect }: Props) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!serviceId || !date) return;
    setLoading(true);
    setError("");
    getAvailability(serviceId, date)
      .then((data) => setSlots(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [serviceId, date]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <span className="font-body text-lilac italic">Đang tải khung giờ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <span className="font-body text-red-400 italic">{error}</span>
      </div>
    );
  }

  if (!date) {
    return (
      <div className="text-center py-8">
        <span className="font-body text-lilac/50 italic">Vui lòng chọn ngày trước</span>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="font-body text-lilac italic">Không còn khung giờ trống trong ngày này</span>
      </div>
    );
  }

  const groups = SESSIONS.map((s) => ({
    ...s,
    slots: slots.filter((t) => sessionOf(t).label === s.label),
  })).filter((g) => g.slots.length > 0);

  return (
    <div className="max-w-md mx-auto space-y-5">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="font-body text-lilac/70 text-sm tracking-wide mb-2 flex items-center justify-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-candle-gold/20 to-arcane/15 border border-candle-gold/50 ring-1 ring-candle-gold/20 shadow-[0_0_14px_rgba(212,168,67,0.35)]">
              <Icon name={g.icon} className="w-4 h-4" />
            </span>
            {g.label}
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {g.slots.map((t) => {
              const isSelected = selected === t;
              return (
                <button
                  key={t}
                  onClick={() => onSelect(t)}
                  className={`
                    py-2 px-3 min-h-[44px] rounded-lg font-body font-semibold text-sm tracking-wide transition-all active:scale-[0.98]
                    ${isSelected
                      ? "bg-candle-gold text-void shadow-lg shadow-candle-gold/40 ring-1 ring-candle-gold"
                      : "bg-velvet/60 text-lilac border border-velvet hover:border-candle-gold/70 hover:text-mist hover:bg-velvet"
                    }
                    focus-visible:outline-2 focus-visible:outline-candle-gold focus-visible:outline-offset-2
                  `}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
