/**
 * "QR" minh hoạ cho thanh toán thử nghiệm — cố tình không scannable để khách
 * không chuyển tiền thật. Chỉ dùng khi backend trả `payment.demo === true`.
 */
export default function DemoQr({ className = "h-44 w-44" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto overflow-hidden rounded-xl border-2 border-dashed border-candle-gold/40 bg-void/60 ${className}`}
    >
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 9px, rgba(212,168,67,.65) 9px 11px), repeating-linear-gradient(90deg, transparent 0 9px, rgba(212,168,67,.65) 9px 11px)",
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span className="rounded-lg border border-candle-gold/50 bg-void/90 px-3 py-1.5 font-display text-[10px] uppercase tracking-[0.3em] text-candle-gold">
          Demo
        </span>
      </div>
    </div>
  );
}
