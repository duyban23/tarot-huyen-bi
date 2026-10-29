import { type FormEvent, useState } from "react";
import type { MeetingMethod } from "../api/types";
import { MEETING_METHODS, MeetingMethodIcon } from "./MeetingMethod";

const METHOD_ORDER: MeetingMethod[] = ["online", "offline"];

interface Props {
  onSubmit: (data: {
    meeting_method: MeetingMethod;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    note?: string;
  }) => void;
  loading: boolean;
  initialMethod?: MeetingMethod;
}

export default function BookingForm({ onSubmit, loading, initialMethod = "online" }: Props) {
  const [method, setMethod] = useState<MeetingMethod>(initialMethod);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const normalizedPhone = phone.replace(/[\s.\-()]/g, "");
    onSubmit({
      meeting_method: method,
      customer_name: name.trim(),
      customer_phone: normalizedPhone,
      customer_email: email.trim() || undefined,
      note: note || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
      <div>
        <span className="block font-body text-lilac text-sm tracking-wide mb-2">
          Hình thức xem <span className="text-candle-gold">*</span>
        </span>
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Hình thức xem">
          {METHOD_ORDER.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={method === m}
              onClick={() => setMethod(m)}
              className={`tap-card tap-card--gold flex items-center gap-2.5 px-4 py-3 rounded-xl text-left min-h-[60px] ${
                method === m ? "is-selected" : ""
              } focus-visible:outline-2 focus-visible:outline-candle-gold focus-visible:outline-offset-2`}
            >
              <span className={method === m ? "text-candle-gold" : "text-lilac/60"}>
                <MeetingMethodIcon method={m} />
              </span>
              <span>
                <span className="block font-body font-medium text-mist">
                  {MEETING_METHODS[m].label}
                </span>
                <span className="block font-body text-lilac/60 text-xs mt-0.5">
                  {MEETING_METHODS[m].detail}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-body text-lilac text-sm tracking-wide mb-1">
          Tên của bạn <span className="text-candle-gold">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-velvet/60 border border-velvet rounded-lg px-4 py-2.5 font-body text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors"
          placeholder="Nhập họ và tên"
        />
      </div>

      <div>
        <label className="block font-body text-lilac text-sm tracking-wide mb-1">
          Số điện thoại <span className="text-candle-gold">*</span>
        </label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-velvet/60 border border-velvet rounded-lg px-4 py-2.5 font-body text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors"
          placeholder="Nhập số điện thoại"
        />
      </div>

      <div>
        <label className="block font-body text-lilac text-sm tracking-wide mb-1">
          Email <span className="text-lilac/50">(không bắt buộc)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-velvet/60 border border-velvet rounded-lg px-4 py-2.5 font-body text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors"
          placeholder="Nhập địa chỉ email"
        />
      </div>

      <div>
        <label className="block font-body text-lilac text-sm tracking-wide mb-1">
          Ghi chú <span className="text-lilac/50">(không bắt buộc)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full bg-velvet/60 border border-velvet rounded-lg px-4 py-2.5 font-body text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors resize-none"
          placeholder="Nhập ghi chú"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-display text-sm tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 disabled:opacity-50 transition-all focus-visible:outline-2 focus-visible:outline-candle-gold focus-visible:outline-offset-2"
      >
        {loading ? "Đang xử lý..." : "Xác nhận đặt lịch"}
      </button>
    </form>
  );
}
