import AstroWheel from "../components/AstroWheel";
import BrandLogo from "../components/BrandLogo";
import MoodPicker from "../components/MoodPicker";
import QuickReading from "../components/QuickReading";
import SparkleButton from "../components/SparkleButton";
import { Icon } from "../components/icons";

const FEES = [
  { label: "Xem gấp sau 12h đêm", value: "+50k" },
  { label: "Trả thẻ điện thoại", value: "+20k" },
  { label: "HSSV", value: "−50k" },
];

/**
 * Hai món "xem cùng My" nằm trong <QuickReading /> — form + kết quả hiện ngay
 * tại /services, không phải mở trang khác.
 */

export default function ServicesPage() {
  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        {/* ── Giới thiệu ── */}
        <div className="text-center mb-6">
          <div className="mb-3">
            <BrandLogo />
          </div>
          <h1 className="font-display text-2xl md:text-3xl text-mist mb-2 leading-snug">
            Khám phá định mệnh · Chữa lành tâm hồn
          </h1>
          <p className="font-body text-lilac/80 italic text-sm md:text-base max-w-md mx-auto">
            Năng lượng vũ trụ &amp; huyền học cổ xưa — đồng hành cùng bạn.
          </p>
        </div>

        {/* ══ ĐIỂM NHẤN: xem cùng My (miễn phí, 5 phút) ══ */}
        <section id="cung-my" className="scroll-mt-24">
          <div className="relative overflow-hidden rounded-3xl border-2 border-candle-gold/60 bg-gradient-to-br from-arcane/25 via-velvet/45 to-void/70 shadow-[0_0_60px_-22px_rgba(212,168,67,0.75)]">
            {/* Vạch sáng trên cùng + quầng vàng phía sau tiêu đề */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-candle-gold to-transparent" />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-candle-gold/20 blur-3xl"
            />

            <div className="relative px-4 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6 md:px-7">
              <div className="flex flex-col items-center text-center">
                {/* Minh hoạ bản đồ sao — SVG, không cần tải ảnh */}
                <div className="relative mb-3">
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-candle-gold/25 blur-2xl"
                  />
                  <div className="relative flex h-[92px] w-[92px] items-center justify-center rounded-full border border-candle-gold/45 bg-gradient-to-br from-candle-gold/15 via-arcane/25 to-transparent shadow-[0_0_34px_-14px_rgba(212,168,67,0.95)] sm:h-[104px] sm:w-[104px]">
                    <AstroWheel className="h-[76px] w-[76px] text-candle-gold drop-shadow-[0_0_10px_rgba(212,168,67,0.4)] sm:h-[86px] sm:w-[86px]" />
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-candle-gold/60 bg-candle-gold/15 px-3 py-1 font-body text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-candle-gold">
                  <Icon name="sparkles" className="w-3 h-3" />
                  Miễn phí · 5 phút
                </span>

                <h2 className="mt-2.5 font-display text-2xl md:text-3xl text-mist leading-tight">
                  Vũ trụ đang nhắn gì cho bạn?
                </h2>
                <p className="mt-1.5 max-w-md font-body text-sm md:text-base text-lilac/85 italic leading-relaxed">
                  Điền vài điều bên dưới — My xem xong trả lời ngay tại đây, không cần
                  chờ đặt lịch.
                </p>
              </div>

              <div className="mt-4">
                <QuickReading />
              </div>
            </div>
          </div>
        </section>

        {/* ── Hoặc chọn theo nỗi lòng ── */}
        <section className="mt-8">
          <div className="text-center mb-3">
            <h2 className="font-display text-lg md:text-xl text-mist">
              Hoặc chọn theo nỗi lòng
            </h2>
            <p className="font-body text-lilac/70 text-sm mt-1">
              Chạm một nỗi lòng — My gợi ý trải bài phù hợp.
            </p>
          </div>
          <MoodPicker />
        </section>

        {/* Vạch ngăn: tách vùng chọn dịch vụ với phần lưu ý phía dưới */}
        <div className="section-divider my-8" />

        {/* ── Lưu ý phụ phí ── */}
        <section className="glow-box bg-candle-gold/5 rounded-2xl p-4">
          <p className="font-body text-candle-gold text-xs tracking-widest uppercase text-center mb-3">
            ✦ Lưu ý ✦
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {FEES.map((f) => (
              <div key={f.label} className="rounded-xl border border-velvet/50 bg-void/40 px-2 py-2.5">
                <p className="font-body text-lilac/80 text-[12px] leading-tight">{f.label}</p>
                <p className="font-display text-candle-gold text-base font-semibold mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center mt-8">
          <p className="font-body text-lilac/80 italic mb-5 max-w-md mx-auto">
            Vẫn phân vân? Nhắn My trước cũng được — không cần chốt gì ngay.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <SparkleButton
              as="link"
              href="/booking"
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-display text-sm tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 transition-all btn-glow"
            >
              <Icon
                name="sparkles"
                className="inline-block w-4 h-4 -mt-0.5 mr-1.5 drop-shadow-[0_0_6px_rgba(212,168,67,0.6)]"
              />
              Đặt lịch ngay
            </SparkleButton>
            <SparkleButton
              as="link"
              href="/contact"
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-display text-sm tracking-widest uppercase border border-velvet text-lilac hover:border-arcane/50 hover:text-mist transition-all"
            >
              Liên hệ tư vấn
            </SparkleButton>
          </div>
        </section>
      </div>
    </main>
  );
}
