import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createBooking, getServices } from "../api/client";
import type { Booking, MeetingMethod, Service } from "../api/types";
import { fold } from "../data/serviceCatalog";
import { findSlide } from "../data/serviceImages";
import BookingForm from "../components/BookingForm";
import Calendar from "../components/Calendar";
import ConfirmationScreen from "../components/ConfirmationScreen";
import MoonStepper from "../components/MoonStepper";
import ServiceGallery from "../components/ServiceGallery";
import TimeSlots from "../components/TimeSlots";
import { Icon } from "../components/icons";

const BRAND = {
  name: "Healing With My",
  tagline: "Có những điều chẳng biết tỏ cùng ai — ở đây, bạn được lắng nghe",
};

/** Bước 1 = ngày & giờ, 2 = thông tin, 3 = xong. Chọn dịch vụ đã chuyển sang /services. */
const BOOKING_STEPS = [{ label: "Ngày & giờ" }, { label: "Thông tin" }, { label: "Hoàn tất" }];

const SERVICE_LIST_PATH = "/services#dat-lich";

/** Khớp tên dịch vụ từ URL với service trong DB (bỏ dấu, rồi khớp lỏng). */
function matchService(list: Service[], wanted: string): Service | null {
  if (!wanted) return null;
  return (
    list.find((s) => fold(s.name.trim()) === wanted) ??
    list.find((s) => {
      const n = fold(s.name.trim());
      return n.startsWith(wanted) || wanted.startsWith(n);
    }) ??
    list.find((s) => {
      const n = fold(s.name.trim());
      return n.includes(wanted) || wanted.includes(n);
    }) ??
    null
  );
}

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const wantedParam = searchParams.get("service") ?? "";

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(Boolean(wantedParam.trim()));
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  // Đổi `?service=` (từ /services) là nạp lại đúng dịch vụ. Không có tham số
  // thì hiện thư viện ảnh dịch vụ + lối sang bảng giá.
  useEffect(() => {
    let alive = true;
    setError("");
    setNotFound(false);
    setBooking(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep(1);

    const wanted = fold(wantedParam.trim());
    if (!wanted) {
      setSelectedService(null);
      setResolving(false);
      return;
    }

    setResolving(true);
    getServices()
      .then((list) => {
        if (!alive) return;
        const match = matchService(list, wanted);
        setSelectedService(match);
        setNotFound(!match);
        setResolving(false);
      })
      .catch((e: Error) => {
        if (!alive) return;
        setSelectedService(null);
        setResolving(false);
        setError(e.message);
      });

    return () => {
      alive = false;
    };
  }, [wantedParam]);

  async function handleSubmit(data: {
    meeting_method: MeetingMethod;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    note?: string;
  }) {
    if (!selectedService || !selectedDate || !selectedTime) return;
    setLoading(true);
    setError("");
    try {
      const result = await createBooking({
        service_id: selectedService.id,
        date: selectedDate,
        time: selectedTime,
        ...data,
      });
      setBooking(result);
      setStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setStep(1);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setBooking(null);
    setError("");
    // Bỏ ?service= trên URL để tải lại trang không nhảy vào dịch vụ cũ.
    if (wantedParam) navigate("/booking", { replace: true });
  }

  // Đoán hình thức xem từ tên dịch vụ (vd "Xem Offline 1 tiếng")
  // để preselect đúng nút Online/Offline trong form.
  const guessedMethod: MeetingMethod = useMemo(() => {
    const name = selectedService?.name.toLowerCase() ?? "";
    if (name.includes("offline") || name.includes("trực tiếp") || name.includes("tại tiệm")) {
      return "offline";
    }
    return "online";
  }, [selectedService]);

  const slide = selectedService ? findSlide(selectedService.name) : undefined;

  return (
    <main className="min-h-screen px-4 py-8 md:py-16">
      <div className="max-w-3xl mx-auto">
        {/* ── Header ── */}
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl md:text-5xl tracking-widest uppercase text-mist mb-2">
            {BRAND.name}
          </h1>
          <p className="font-body text-lilac italic text-lg mb-1">
            {BRAND.tagline}
          </p>
        </div>

        {resolving ? (
          <p className="py-16 text-center font-body text-lilac/60 animate-pulse">
            Đang mở dịch vụ…
          </p>
        ) : (
          <>
            {/* ── Chưa chọn dịch vụ: thư viện ảnh + lối sang bảng giá ── */}
            {!selectedService && (
              <section className="animate-fade-in">
                <div className="mb-4 text-center">
                  <p className="font-body text-candle-gold/80 text-xs tracking-widest uppercase mb-1">
                    Đặt lịch
                  </p>
                  <h2 className="font-display text-xl md:text-2xl tracking-wider uppercase text-mist">
                    Chọn trải bài của bạn
                  </h2>
                  <p className="mx-auto mt-1.5 max-w-md font-body text-lilac/70 italic text-sm leading-relaxed">
                    Bảng giá từng nhóm trải bài nằm bên dưới — chạm vào ảnh để xem rõ.
                    Chọn xong dịch vụ ở trang Dịch vụ, bạn quay lại đây chọn ngày giờ.
                  </p>
                </div>

                {error && (
                  <p className="text-center font-body text-red-400 italic mb-4">{error}</p>
                )}
                {notFound && (
                  <p className="mx-auto mb-4 max-w-md text-center font-body text-candle-gold/85 text-sm italic">
                    Không tìm thấy dịch vụ trong link này — bạn chọn lại ở trang Dịch vụ nhé.
                  </p>
                )}

                <ServiceGallery />

                <div className="mt-6 text-center">
                  <Link
                    to={SERVICE_LIST_PATH}
                    className="inline-flex items-center gap-2 rounded-xl bg-arcane px-8 py-3 font-display text-sm tracking-widest uppercase text-mist transition-all hover:bg-arcane/80 btn-glow active:scale-[0.98]"
                  >
                    <Icon
                      name="sparkles"
                      className="inline-block h-4 w-4 -mt-0.5 drop-shadow-[0_0_6px_rgba(212,168,67,0.6)]"
                    />
                    Xem bảng giá &amp; chọn dịch vụ
                  </Link>
                  <p className="mt-2 font-body text-xs text-lilac/50">
                    Chọn xong, bạn được đưa thẳng về bước chọn ngày giờ.
                  </p>
                </div>
              </section>
            )}

            {/* ── Đã có dịch vụ: tiến trình đặt lịch ── */}
            {selectedService && (
              <MoonStepper current={step - 1} steps={BOOKING_STEPS} />
            )}

            {/* Step 1: Date & Time */}
            {selectedService && step === 1 && (
              <section>
                {/* Tóm tắt dịch vụ — có ảnh nếu đã thêm trong data/serviceImages.ts */}
                <div className="mx-auto mb-6 max-w-md overflow-hidden rounded-2xl border border-velvet/60 bg-velvet/30 glow-box">
                  {slide && (
                    <img
                      src={slide.srcSmall ?? slide.src}
                      alt={slide.name}
                      className="h-32 w-full bg-void/60 object-contain sm:h-40"
                    />
                  )}
                  <div className="flex items-center justify-between gap-3 p-3.5">
                    <div className="min-w-0">
                      <p className="font-body text-candle-gold/70 text-[10px] tracking-widest uppercase mb-1">
                        Dịch vụ đã chọn
                      </p>
                      <h2 className="truncate font-display text-base tracking-wider uppercase text-mist">
                        {selectedService.name}
                      </h2>
                      <p className="mt-0.5 font-body text-lilac/70 text-sm">
                        <Icon name="time" className="inline-block w-3.5 h-3.5 -mt-0.5 mr-1" />
                        {selectedService.duration_minutes} phút
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="whitespace-nowrap font-display text-lg font-semibold text-candle-gold">
                        {selectedService.price.toLocaleString("vi-VN")}₫
                      </p>
                      <Link
                        to={SERVICE_LIST_PATH}
                        className="font-body text-lilac/60 hover:text-candle-gold text-xs underline underline-offset-4 decoration-arcane/30 transition-all"
                      >
                        Đổi dịch vụ
                      </Link>
                    </div>
                  </div>
                </div>

                <h2 className="font-display text-xl tracking-wider uppercase text-mist text-center mb-6">
                  Chọn ngày &amp; giờ
                </h2>
                <Calendar
                  selected={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    setSelectedTime(null);
                  }}
                />
                {selectedDate && (
                  <div className="mt-6">
                    <h3 className="font-display text-base tracking-wider uppercase text-lilac text-center mb-4">
                      Khung giờ trống
                    </h3>
                    <TimeSlots
                      serviceId={selectedService.id}
                      date={selectedDate}
                      selected={selectedTime}
                      onSelect={setSelectedTime}
                    />
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-8">
                  <Link
                    to={SERVICE_LIST_PATH}
                    className="inline-flex items-center px-6 min-h-[44px] rounded-lg font-body text-lilac border border-velvet hover:border-lilac/30 active:scale-[0.98] transition-all"
                  >
                    Chọn dịch vụ khác
                  </Link>
                  <button
                    disabled={!selectedTime}
                    onClick={() => setStep(2)}
                    className="px-6 min-h-[44px] rounded-xl font-display text-sm tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    Tiếp theo
                  </button>
                </div>
              </section>
            )}

            {/* Step 2: Customer info */}
            {selectedService && step === 2 && (
              <section>
                <h2 className="font-display text-xl tracking-wider uppercase text-mist text-center mb-6">
                  Thông tin của bạn
                </h2>
                {error && (
                  <p className="text-center font-body text-red-400 italic mb-4">{error}</p>
                )}
                <div className="max-w-md mx-auto mb-6 glow-box bg-velvet/40 rounded-xl p-4">
                  <p className="font-body text-candle-gold/70 text-xs tracking-widest uppercase mb-2">
                    Dịch vụ đã chọn
                  </p>
                  <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-base tracking-wider uppercase text-mist">
                        {selectedService.name}
                      </h3>
                      <p className="font-body text-lilac/70 text-sm mt-0.5">
                        <Icon
                          name="time"
                          className="inline-block w-3.5 h-3.5 -mt-0.5 mr-1"
                        />
                        {selectedService.duration_minutes} phút
                        {selectedDate && selectedTime
                          ? ` · ${selectedDate} lúc ${selectedTime}`
                          : ""}
                      </p>
                    </div>
                    <span className="font-display text-candle-gold font-semibold text-lg whitespace-nowrap shrink-0">
                      {selectedService.price.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  <Link
                    to={SERVICE_LIST_PATH}
                    className="mt-2 inline-block font-body text-lilac/70 hover:text-candle-gold text-sm underline underline-offset-4 decoration-arcane/30 transition-all"
                  >
                    Đổi dịch vụ
                  </Link>
                </div>
                <BookingForm
                  key={selectedService.id}
                  initialMethod={guessedMethod}
                  onSubmit={handleSubmit}
                  loading={loading}
                />
                <div className="text-center mt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 min-h-[44px] rounded-lg font-body text-lilac border border-velvet hover:border-lilac/30 active:scale-[0.98] transition-all"
                  >
                    Quay lại
                  </button>
                </div>
              </section>
            )}

            {/* Step 3: Confirmation */}
            {selectedService && step === 3 && booking && (
              <>
                <ConfirmationScreen booking={booking} serviceName={selectedService.name} />
                <div className="text-center mt-6">
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 rounded-xl font-display text-sm tracking-widest uppercase bg-arcane/30 text-lilac hover:bg-arcane/50 hover:text-mist transition-all"
                  >
                    Đặt lịch mới
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
