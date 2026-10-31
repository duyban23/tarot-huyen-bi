import { useEffect, useState, Suspense } from "react";
import { Link } from "react-router-dom";
import anime from "animejs";
import Reveal from "../components/Reveal";
import BrandLogo from "../components/BrandLogo";
import ServiceJourney from "../components/ServiceJourney";
import GalaxyTarotSystem from "../components/GalaxyTarotSystem";
import CountUp from "../components/CountUp";
import SparkleButton from "../components/SparkleButton";
import Footer from "../components/Footer";
import FeedbackLightbox from "../components/FeedbackLightbox";
import { Icon } from "../components/icons";

import { getServices } from "../api/client";
import type { Service } from "../api/types";

// Import tarot card data
import tarotCardsData from "../../public/data/tarot-cards.json";

const FEEDBACKS = [
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_1.webp`,
    full: `/images/feedbacks/fb_1.webp`,
    stars: 5,
    customerName: "N.T.",
    service: "Tarot",
    comment: "Dịch vụ tuyệt vời! Tôi đã tìm được hướng đi rõ ràng cho cuộc sống.",
    date: "19/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_2.webp`,
    full: `/images/feedbacks/fb_2.webp`,
    stars: 5,
    customerName: "T.V.",
    service: "Tea Leaf",
    comment: "Chân thành và chính xác. Cảm ơn đã giúp tôi hiểu rõ hơn về bản thân.",
    date: "20/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_3.webp`,
    full: `/images/feedbacks/fb_3.webp`,
    stars: 5,
    customerName: "L.P.",
    service: "Bài Oracle",
    comment: "Rất hài lòng với kết quả. Những lời tư vấn rất hữu ích.",
    date: "21/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_4.webp`,
    full: `/images/feedbacks/fb_4.webp`,
    stars: 5,
    customerName: "P.N.",
    service: "Combo",
    comment: "Tuyệt hảo! Tôi đã có thể đưa ra quyết định quan trọng nhờ bài xem.",
    date: "22/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_5.webp`,
    full: `/images/feedbacks/fb_5.webp`,
    stars: 5,
    customerName: "B.Đ.",
    service: "Tarot",
    comment: "Cảm ơn rất nhiều! Dịch vụ chuyên nghiệp và tận tâm.",
    date: "23/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_6.webp`,
    full: `/images/feedbacks/fb_6.webp`,
    stars: 5,
    customerName: "Đ.M.",
    service: "Tea Leaf",
    comment: "Quá bất ngờ với độ chính xác. Đúng những gì tôi đang thắc mắc.",
    date: "24/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_7.webp`,
    full: `/images/feedbacks/fb_7.webp`,
    stars: 5,
    customerName: "H.H.",
    service: "Bài Oracle",
    comment: "Rất cảm kích! Những lời khuyên đã giúp tôi vượt qua khó khăn.",
    date: "25/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_8.webp`,
    full: `/images/feedbacks/fb_8.webp`,
    stars: 5,
    customerName: "V.T.",
    service: "Combo",
    comment: "Dịch vụ chất lượng cao. Tôi sẽ giới thiệu cho bạn bè.",
    date: "26/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_9.webp`,
    full: `/images/feedbacks/fb_9.webp`,
    stars: 5,
    customerName: "Đ.L.",
    service: "Tarot",
    comment: "Cảm thấy an tâm hơn rất nhiều sau buổi tư vấn.",
    date: "27/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_10.webp`,
    full: `/images/feedbacks/fb_10.webp`,
    stars: 5,
    customerName: "Đ.H.",
    service: "Tea Leaf",
    comment: "Rất ấn tượng với kiến thức sâu rộng của chuyên gia.",
    date: "28/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_11.webp`,
    full: `/images/feedbacks/fb_11.webp`,
    stars: 5,
    customerName: "L.A.",
    service: "Bài Oracle",
    comment: "Đây là lần xem bài hay nhất tôi từng trải nghiệm.",
    date: "29/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_12.webp`,
    full: `/images/feedbacks/fb_12.webp`,
    stars: 5,
    customerName: "N.M.",
    service: "Combo",
    comment: "Cảm ơn đã mang đến cho tôi sự rõ ràng và bình an.",
    date: "30/09/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_13.webp`,
    full: `/images/feedbacks/fb_13.webp`,
    stars: 5,
    customerName: "T.P.",
    service: "Tarot",
    comment: "Quá xứng đáng với số tiền bỏ ra. Kết quả vượt mong đợi.",
    date: "01/10/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_14.webp`,
    full: `/images/feedbacks/fb_14.webp`,
    stars: 5,
    customerName: "L.Đ.",
    service: "Tea Leaf",
    comment: "Rất hài lòng! Tôi sẽ quay lại vào lần sau.",
    date: "02/10/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_15.webp`,
    full: `/images/feedbacks/fb_15.webp`,
    stars: 5,
    customerName: "P.Q.",
    service: "Bài Oracle",
    comment: "Dịch vụ nhanh chóng và hiệu quả. Không phải chờ đợi lâu.",
    date: "03/10/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_16.webp`,
    full: `/images/feedbacks/fb_16.webp`,
    stars: 5,
    customerName: "B.T.",
    service: "Combo",
    comment: "Cảm thấy được lắng nghe và thấu hiểu sâu sắc.",
    date: "04/10/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_17.webp`,
    full: `/images/feedbacks/fb_17.webp`,
    stars: 5,
    customerName: "N.Y.",
    service: "Tarot",
    comment: "Những lời tiên đoán rất chính xác. Tôi ngạc nhiên lắm!",
    date: "05/10/2026",
  },
  {
    type: "image" as const,
    src: `/images/feedbacks/thumbs/fb_18.webp`,
    full: `/images/feedbacks/fb_18.webp`,
    stars: 5,
    customerName: "K.T.",
    service: "Tarot",
    comment: "Xem đúng cả chuyện việc làm lẫn thời điểm. My tư vấn kỹ và dễ hiểu.",
    date: "15/10/2026",
  },
];

/** "dd/mm/yyyy" -> số để so sánh (thiếu/sai thì coi như cũ nhất). */
function feedbackOrder(date?: string): number {
  const [d, m, y] = (date ?? "").split("/").map(Number);
  return (y || 0) * 10000 + (m || 0) * 100 + (d || 0);
}

/**
 * Feedback mới nhất luôn đứng đầu: chỉ cần thêm mục mới vào cuối `FEEDBACKS`
 * với `date` đúng định dạng dd/mm/yyyy là nó tự nhảy lên vị trí đầu tiên
 * (4 thẻ đầu hiện sẵn trên mobile, 8 thẻ đầu từ sm trở lên).
 */
const FEEDBACKS_SORTED = [...FEEDBACKS].sort(
  (a, b) => feedbackOrder(b.date) - feedbackOrder(a.date)
);

const FOR_WHO = [
  { icon: "heart-crack", title: "Chuyện tình cảm rối ren", desc: "Crush mập mờ, người yêu xa cách, người cũ chưa quên — bạn cần một lời rõ ràng để biết nên giữ hay buông" },
  { icon: "briefcase", title: "Đứng trước ngã rẽ", desc: "Nhảy việc hay ở lại? Thi cử, kinh doanh, tiền bạc — bạn cần một góc nhìn tỉnh táo trước khi quyết định" },
  { icon: "moon", title: "Mông lung về chính mình", desc: "Không biết mình muốn gì, mệt mà chẳng rõ vì sao — bạn cần được lắng nghe để hiểu lại lòng mình" },
  { icon: "home", title: "Mối quan hệ khó xử", desc: "Gia đình, bạn bè, đồng nghiệp — có điều khó nói với ai, bạn cần một nơi an toàn để trút ra" },
];

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [lightboxItem, setLightboxItem] = useState<typeof FEEDBACKS[number] | null>(null);
  const [showAllFeedback, setShowAllFeedback] = useState(false);

  useEffect(() => {
    getServices().then(setServices).catch((e) => console.warn("getServices failed:", e.message));
  }, []);

  // Stagger entry for feedback cards
  // FIX mobile không hiển thị: trước đây dùng threshold 0.15 trên cả
  // container #feedback-cards. Trên mobile grid 1 cột cao ~8500px,
  // viewport ~700px nên tỉ lệ hiển thị tối đa chỉ ~8% < 15% → observer
  // không bao giờ fire → tất cả .feedback-card kẹt ở opacity-0.
  // Dùng threshold 0 (chỉ cần 1px lọt vào viewport là reveal) + fallback timer.
  useEffect(() => {
    const el = document.getElementById("feedback-cards");
    if (!el) return;
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      const items = el.querySelectorAll(".feedback-card");
      try {
        anime({
          targets: items,
          opacity: [0, 1],
          translateY: [24, 0],
          delay: anime.stagger(100, { start: 100 }),
          duration: 600,
          easing: "easeOutCubic",
          complete: () => {
            (items as unknown as HTMLElement[]).forEach((it) => {
              (it as HTMLElement).style.opacity = "1";
              (it as HTMLElement).style.transform = "none";
            });
          },
        });
      } catch {
        (items as unknown as HTMLElement[]).forEach((it) => {
          (it as HTMLElement).style.opacity = "1";
          (it as HTMLElement).style.transform = "none";
        });
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
          clearTimeout(fallback);
        }
      },
      { threshold: 0, rootMargin: "0px 0px 100px 0px" }
    );
    observer.observe(el);
    // Fallback: đảm bảo không bao giờ kẹt ở opacity-0 trên mobile.
    const fallback = setTimeout(() => {
      reveal();
      observer.disconnect();
    }, 2500);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <main className="min-h-screen">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[100dvh] flex overflow-hidden pt-16">
        <Suspense fallback={null}>
          <GalaxyTarotSystem count={18} cardData={tarotCardsData as any} />
        </Suspense>
        {/* Phủ mờ nền tím để logo và chữ nổi hơn */}
        <div aria-hidden className="absolute inset-0 z-[1] bg-void/45 pointer-events-none" />

        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto m-auto py-10">
          {/* Brand logo */}
          <div className="mb-6">
            <BrandLogo />
          </div>

          <p className="font-logo text-mist tracking-widest uppercase text-base md:text-lg mb-4 opacity-90">
            Reader · Healer · Coaching
          </p>

          <p className="font-body text-lilac text-xl md:text-2xl italic mb-8 leading-relaxed">
            Có những điều chẳng biết tỏ cùng ai — hãy để Healing with My lắng nghe và vỗ về bạn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SparkleButton
              as="link"
              href="/booking"
              className="w-full sm:w-auto max-w-[320px] px-8 py-3 rounded-xl font-display text-sm tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 transition-all shadow-lg shadow-arcane/25 btn-glow"
            >
              <Icon
                name="sparkles"
                className="inline-block w-4 h-4 -mt-0.5 mr-1.5 drop-shadow-[0_0_6px_rgba(212,168,67,0.6)]"
              />
              Đặt lịch xem bài
            </SparkleButton>
            <SparkleButton
              as="link"
              href="/services"
              className="w-full sm:w-auto max-w-[320px] px-8 py-3 rounded-xl font-display text-sm tracking-widest uppercase border border-velvet text-lilac hover:border-arcane/50 hover:text-mist transition-all"
            >
              Khám phá dịch vụ
            </SparkleButton>
          </div>

          <a
            href="/services#cung-my"
            className="inline-block mt-6 font-body text-candle-gold/90 italic text-base hover:text-candle-gold hover:underline underline-offset-4 transition-all"
          >
            <Icon
              name="sparkles"
              className="inline-block w-4 h-4 -mt-0.5 mr-1 drop-shadow-[0_0_6px_rgba(212,168,67,0.6)]"
            />
            Vũ trụ đang nhắn gì cho bạn? — xem ngay 5 phút, miễn phí →
          </a>
        </div>


      </section>

      {/* ─── Section divider ─── */}
      <div className="section-divider my-4" />

      {/* ─── Stats ─── */}
      <Reveal className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-3 sm:gap-8 text-center">
            <div>
              <p className="font-display text-3xl md:text-4xl text-candle-gold">
                <CountUp end={500} suffix="+" />
              </p>
              <p className="font-body text-lilac/90 text-sm sm:text-base tracking-wide mt-1">Khách hàng</p>
            </div>
            <div>
              <p className="font-display text-3xl md:text-4xl text-candle-gold">
                <CountUp end={5} />
                <Icon
                  name="star"
                  className="inline-block w-6 h-6 md:w-7 md:h-7 -mt-1 ml-1 align-middle drop-shadow-[0_0_6px_rgba(212,168,67,0.55)]"
                />
              </p>
              <p className="font-body text-lilac/90 text-sm sm:text-base tracking-wide mt-1">Đánh giá</p>
            </div>
            <div>
              <p className="font-display text-3xl md:text-4xl text-candle-gold">
                <CountUp end={10} suffix="+" />
              </p>
              <p className="font-body text-lilac/90 text-sm sm:text-base tracking-wide mt-1">Năm kinh nghiệm</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─── Video — Không gian của My ─── */}
      <Reveal className="py-16 md:py-24" amount={0.15}>
        <div className="max-w-3xl mx-auto px-4">
          <p className="font-body text-candle-gold text-sm tracking-widest uppercase text-center mb-2">
            ✦ Không gian của My ✦
          </p>
          <h2 className="font-display text-2xl md:text-4xl text-mist text-center mb-3 leading-tight">
            Ghé thăm Chemie Coffee,<br />nơi giấc mơ bắt đầu
          </h2>
          <p className="font-body text-lilac/70 italic text-center mb-10 max-w-xl mx-auto">
            Tổ hợp cà phê giữa lòng Hà Nội — nơi My từng gửi gắm cả thanh xuân, và nay là nơi bạn có thể gặp My trực tiếp.
          </p>
          <div className="relative overflow-hidden rounded-2xl border border-arcane/30 shadow-xl shadow-arcane/20">
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/4UwqrUl5wP8"
                title="Chemie Coffee — Tổ hợp Cà Phê Boardgame 24/7 tại Hà Nội"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─── Section divider ─── */}
      <div className="section-divider my-4" />

      {/* ─── Services overview ─── */}
      <Reveal className="py-16 md:py-24" delay={100}>
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-2xl md:text-4xl text-mist text-center mb-3">
            Tìm một nơi để lòng được nhẹ hơn
          </h2>
          <p className="font-body text-lilac/70 italic text-center mb-12 max-w-xl mx-auto">
            Lật thẻ để chọn lối vào — rồi xem từng dịch vụ.
          </p>

          {/* 3 ô lật thẻ → chọn lối vào → dịch vụ chi tiết */}
          <ServiceJourney />

          <div className="text-center mt-8">
            <Link
              to="/services"
              className="font-body text-lilac hover:text-mist underline underline-offset-4 decoration-arcane/30 transition-all"
            >
              Xem tất cả dịch vụ →
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ─── CTA ─── */}
      <Reveal className="py-16 md:py-24" delay={150}>
        <div className="text-center px-4">
          <h2 className="font-display text-2xl md:text-4xl text-mist mb-4">
            Đêm nay, đừng ôm nỗi lo một mình
          </h2>
          <p className="font-body text-lilac italic mb-8 max-w-md mx-auto">
            Đặt một buổi xem — để có người lắng nghe, để lòng được sáng rõ và bình yên trở lại.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SparkleButton
              as="link"
              href="/booking"
              className="px-8 py-3 rounded-xl font-display text-sm tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 transition-all shadow-lg shadow-arcane/25 btn-glow"
            >
              <Icon
                name="sparkles"
                className="inline-block w-4 h-4 -mt-0.5 mr-1.5 drop-shadow-[0_0_6px_rgba(212,168,67,0.6)]"
              />
              Đặt lịch ngay
            </SparkleButton>
            <SparkleButton
              as="link"
              href="/services"
              className="px-8 py-3 rounded-xl font-display text-sm tracking-widest uppercase border border-velvet text-lilac hover:border-arcane/50 hover:text-mist transition-all"
            >
              Xem bảng giá
            </SparkleButton>
          </div>
        </div>
      </Reveal>

      {/* ─── Section divider ─── */}
      <div className="section-divider my-4" />

      {/* ─── Tại sao bạn ở đây? ─── */}
      <Reveal className="py-16 md:py-24" delay={200}>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-display text-2xl md:text-4xl text-mist text-center mb-3">
            Tại sao bạn ở đây?
          </h2>
          <p className="font-body text-lilac/70 italic text-center mb-12 max-w-xl mx-auto">
            Nếu một trong những dòng này giống bạn — thì bạn đã đến đúng nơi rồi.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {FOR_WHO.map((w) => (
              <div key={w.title} className="bg-velvet/40 border border-velvet rounded-2xl p-5 md:p-6 hover:border-arcane/40 transition-all">
                <span className="block mb-3 text-candle-gold"><Icon name={w.icon} className="w-8 h-8" /></span>
                <h3 className="font-display text-base tracking-wider uppercase text-mist mb-1.5">{w.title}</h3>
                <p className="font-body text-lilac/80 text-[15px] leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/booking"
              className="font-body text-candle-gold hover:text-mist underline underline-offset-4 decoration-arcane/30 transition-all"
            >
              Kể My nghe chuyện của bạn →
            </Link>
          </div>
        </div>
      </Reveal>

      {/* ─── Section divider ─── */}
      <div className="section-divider my-4" />

      {/* ─── Feedback ─── */}
      <Reveal className="py-16 md:py-24" delay={100}>
        <div className="max-w-5xl mx-auto px-4">
          <p className="font-body text-candle-gold text-sm tracking-widest uppercase text-center mb-2">
            ✦ Phản hồi từ khách hàng ✦
          </p>
          <h2 className="font-display text-2xl md:text-4xl text-mist text-center mb-12">
            Khách hàng nói gì?
          </h2>

          <div id="feedback-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {FEEDBACKS_SORTED.map((fb, i) => (
              <button
                key={i}
                onClick={() => setLightboxItem(fb)}
                className={`feedback-card opacity-0 text-left w-full group cursor-pointer ${
                  !showAllFeedback && i >= 8 ? "hidden" : !showAllFeedback && i >= 4 ? "hidden sm:block" : ""
                }`}
                aria-label={`Xem phản hồi từ ${fb.customerName} - ${fb.service}`}
              >
                <div className="relative bg-velvet/30 border border-velvet/60 rounded-2xl overflow-hidden hover:border-arcane/40 hover:bg-velvet/50 transition-all duration-300 shadow-lg shadow-velvet/20 group-hover:shadow-xl group-hover:shadow-arcane/20">
                  
                  <div className="aspect-[4/5] w-full">
                    <img
                      src={fb.src}
                      alt={`Feedback từ ${fb.customerName}`}
                      loading={i < 4 ? "eager" : "lazy"}
                      decoding="async"
                      width={480}
                      height={600}
                      onError={(e) => {
                        const el = e.currentTarget;
                        const step = el.dataset.fbkFallback || "0";
                        if (step === "0" && fb.full !== fb.src) {
                          // thumbs webp -> full webp
                          el.dataset.fbkFallback = "1";
                          el.src = fb.full;
                        } else if (step <= "1") {
                          // webp -> jpg (phòng bản build thiếu webp / máy cũ)
                          el.dataset.fbkFallback = "2";
                          el.src = fb.src.replace(/\.webp$/, ".jpg");
                        } else {
                          el.dataset.fbkFallback = "3";
                          el.src = fb.full.replace(/\.webp$/, ".jpg");
                        }
                      }}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                    <div className="absolute top-2 right-2 bg-black/40 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white">
                        <Icon name="search" className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-gradient-to-t from-velvet/80 to-transparent border-t border-velvet/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-candle-gold text-xs font-medium truncate max-w-[60%]">
                        {fb.customerName}
                      </span>
                      <span className="text-lilac/90 text-xs truncate max-w-[40%]">
                        {fb.service}
                      </span>
                    </div>
                    <p className="text-lilac/90 text-xs line-clamp-2 mb-1.5">
                      {fb.comment}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: fb.stars }).map((_, i) => (
                          <Icon
                            key={i}
                            name="star"
                            className="w-3 h-3 drop-shadow-[0_0_4px_rgba(212,168,67,0.55)]"
                          />
                        ))}
                      </div>
                      <span className="text-lilac/90 text-xs">
                        {fb.date}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setShowAllFeedback((v) => !v)}
              className="px-8 py-3 rounded-xl font-body text-sm tracking-widest uppercase border border-velvet text-lilac hover:border-arcane/50 hover:text-mist transition-all min-h-[44px]"
            >
              {showAllFeedback ? "Thu gọn ↑" : "Đọc thêm phản hồi ↓"}
            </button>
          </div>
        </div>
      </Reveal>

      {lightboxItem && (
        <FeedbackLightbox
          item={{ ...lightboxItem, src: lightboxItem.full }}
          onClose={() => setLightboxItem(null)}
        />
      )}

      {/* ─── Section divider ─── */}
      <div className="section-divider my-4" />

      {/* ─── Câu chuyện của My (bản ngắn — dẫn sang trang giới thiệu) ─── */}
      <Reveal className="py-12 md:py-16" amount={0.15}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="font-body text-candle-gold text-sm tracking-widest uppercase mb-2">
            ✦ Câu chuyện của My ✦
          </p>
          <h2 className="font-display text-2xl md:text-3xl text-mist mb-6 leading-tight">
            Cô gái từng vỡ vụn,<br />nay là nơi bình yên của hàng trăm người
          </h2>
          <p className="font-body text-lilac leading-relaxed mb-6">
            My từng mở một quán cà phê ở Hà Nội, rồi thất bại và ở ẩn suốt một năm.
            My học Tarot, Tea Leaf và chữa lành — không phải để đoán số phận, mà để
            hiểu lòng người, bắt đầu từ lòng mình.
          </p>
          <Link
            to="/about"
            className="font-body text-candle-gold hover:text-mist underline underline-offset-4 decoration-arcane/30 transition-all"
          >
            Đọc câu chuyện đầy đủ →
          </Link>
        </div>
      </Reveal>

      {/* ─── Section divider ─── */}
      <div className="section-divider my-4" />

      {/* Footer */}
      <Footer />
    </main>
  );
}
