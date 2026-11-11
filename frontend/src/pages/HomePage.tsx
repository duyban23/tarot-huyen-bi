import { useEffect, useRef, useState, Suspense } from "react";
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
import SpaceGallery from "../components/SpaceGallery";
import { Icon } from "../components/icons";

import { getServices } from "../api/client";
import type { Service } from "../api/types";

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

const IF_YOU_ARE = [
  "thức khuya vì một câu hỏi chưa có lời đáp",
  "đứng giữa hai lựa chọn mà không biết hỏi ai",
  "mỉm cười với mọi người, nhưng lòng rối bời",
  "yêu một người mà không chắc được thương",
  "muốn hiểu mình, nhưng không biết bắt đầu từ đâu",
];

/**
 * Quote cards có chữ nằm sẵn trong ảnh (do My thiết kế). Giữ nguyên câu chữ
 * trong `text` để alt text + figcaption vẫn đọc được với screen reader/SEO.
 */
const QUOTE_CARDS = [
  {
    webp: "/images/space/quotes/quote-01.webp",
    jpg: "/images/space/quotes/quote-01.jpg",
    text: "Cảm xúc được sinh ra để tái tạo và sửa chữa, nhưng chúng ta vô tình biến nó thành những người lính và biến bản thân thành bãi chiến trường.",
  },
  {
    webp: "/images/space/quotes/quote-02.webp",
    jpg: "/images/space/quotes/quote-02.jpg",
    text: "Bạn có quyền chọn điều mình đưa vào tiềm thức. Đừng đưa tổn thương vào đó — nó sẽ thành thói quen ý nghĩ và cảm xúc chạy tự động.",
  },
  {
    webp: "/images/space/quotes/quote-03.webp",
    jpg: "/images/space/quotes/quote-03.jpg",
    text: "Thẳng thắn không nhất thiết là làm người khác tổn thương. Bạn có thể chọn cách nói sự thật một cách mềm mại, uyển chuyển.",
  },
];

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [lightboxItem, setLightboxItem] = useState<typeof FEEDBACKS[number] | null>(null);
  const [showAllFeedback, setShowAllFeedback] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  // Khung video đang mở: chỉ iframe của trang này được mount/tải.
  const [videoTab, setVideoTab] = useState<"youtube" | "tiktok">("youtube");
  const quoteTouchX = useRef<number | null>(null);

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
          <GalaxyTarotSystem count={18} />
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

      {/* ─── Không gian của My — gallery + video ─── */}
      <Reveal className="py-16 md:py-24" amount={0.15}>
        <div id="khong-gian" className="max-w-5xl mx-auto scroll-mt-24 px-4">
          <h2 className="font-display text-2xl md:text-4xl text-mist text-center mb-3 leading-tight">
            Một không gian riêng,<br />để bạn được là chính mình
          </h2>
          <p className="font-body text-lilac/70 italic text-center mb-8 md:mb-10 max-w-xl mx-auto">
            Nơi My đón khách, pha một tách trà và cùng bạn trò chuyện — chậm rãi, riêng tư và không phán xét.
          </p>

          <div className="mb-10 md:mb-14">
            <SpaceGallery />
          </div>

          {/* Video: YouTube + TikTok chung một khung, bấm mũi tên để chuyển
              trang — chỉ khung đang xem mới tải iframe, không load cả hai. */}
          <div className="mx-auto">
            <div
              key={videoTab}
              className={
                videoTab === "youtube"
                  ? "animate-fade-in mx-auto max-w-3xl"
                  : "animate-fade-in mx-auto w-full max-w-[280px]"
              }
            >
              {videoTab === "youtube" ? (
                <figure className="min-w-0">
                  <div className="group relative overflow-hidden rounded-2xl border border-arcane/30 shadow-xl shadow-arcane/20 transition-colors hover:border-candle-gold/60">
                    <div className="aspect-video w-full">
                      <iframe
                        className="pointer-events-none h-full w-full"
                        src="https://www.youtube.com/embed/4UwqrUl5wP8"
                        title="Healing With My — Video giới thiệu"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        loading="lazy"
                        tabIndex={-1}
                      />
                    </div>
                    <a
                      href="https://www.youtube.com/watch?v=4UwqrUl5wP8"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Xem video giới thiệu trên YouTube (mở tab mới)"
                      className="absolute inset-0 z-10 cursor-pointer rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-candle-gold"
                    />
                  </div>
                  <figcaption className="mt-3 flex items-center justify-between gap-3">
                    <span className="font-body text-candle-gold/80 text-[11px] tracking-[0.25em] uppercase">
                      YouTube
                    </span>
                    <a
                      href="https://www.youtube.com/watch?v=4UwqrUl5wP8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-lilac/55 text-xs hover:text-candle-gold transition-colors"
                    >
                      Xem trên YouTube ↗
                    </a>
                  </figcaption>
                </figure>
              ) : (
                <figure className="relative w-full">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-4 rounded-[32px] bg-arcane/10 blur-2xl"
                  />
                  <div className="group relative overflow-hidden rounded-[24px] border border-arcane/30 bg-void shadow-xl shadow-arcane/20 transition-colors hover:border-candle-gold/60">
                    <div className="aspect-[4/5] w-full">
                      {/* Player nhúng của TikTok đang trả "Server error" cho video
                          này, nên dùng ảnh bìa + nút play dẫn thẳng sang TikTok. */}
                      <img
                        src="/images/tiktok-cover.webp"
                        alt="Video TikTok — Chữa lành cùng My"
                        width={640}
                        height={800}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/75 via-void/10 to-void/20"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-candle-gold/60 bg-void/55 text-candle-gold shadow-lg shadow-void/50 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-6 w-6" aria-hidden>
                        <path d="M8 5.14v13.72a.6.6 0 0 0 .92.51l10.79-6.86a.6.6 0 0 0 0-1.02L8.92 4.63A.6.6 0 0 0 8 5.14Z" />
                      </svg>
                    </span>
                    <a
                      href="https://www.tiktok.com/@chemietarot_happy/video/7702067975481806100"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Xem video trên TikTok (mở tab mới)"
                      className="absolute inset-0 z-20 cursor-pointer rounded-[24px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-candle-gold"
                    />
                  </div>
                  <figcaption className="relative mt-3 text-center">
                    <p className="font-display text-[15px] leading-snug text-mist">
                      Chữa lành cùng My
                    </p>
                    <a
                      href="https://www.tiktok.com/@chemietarot_happy/video/7702067975481806100"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block font-body text-lilac/55 text-xs hover:text-candle-gold transition-colors"
                    >
                      Xem trên TikTok ↗
                    </a>
                  </figcaption>
                </figure>
              )}
            </div>

            {/* Điều hướng chuyển trang video */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setVideoTab("youtube")}
                disabled={videoTab === "youtube"}
                aria-label="Quay lại video YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-arcane/30 text-lilac/70 transition-colors hover:border-candle-gold/60 hover:text-candle-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-candle-gold disabled:cursor-default disabled:opacity-30 disabled:hover:border-arcane/30 disabled:hover:text-lilac/70"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>

              <div className="flex items-center gap-1.5">
                {(["youtube", "tiktok"] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setVideoTab(id)}
                    aria-pressed={videoTab === id}
                    className={`rounded-full border px-3 py-1 font-body text-[10.5px] uppercase tracking-[0.18em] transition-colors ${
                      videoTab === id
                        ? "border-candle-gold/50 bg-candle-gold/15 text-candle-gold"
                        : "border-arcane/25 text-lilac/55 hover:border-arcane/45 hover:text-lilac"
                    }`}
                  >
                    {id === "youtube" ? "YouTube" : "TikTok"}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setVideoTab("tiktok")}
                disabled={videoTab === "tiktok"}
                aria-label="Sang video TikTok"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-arcane/30 text-lilac/70 transition-colors hover:border-candle-gold/60 hover:text-candle-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-candle-gold disabled:cursor-default disabled:opacity-30 disabled:hover:border-arcane/30 disabled:hover:text-lilac/70"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ─── Section divider ─── */}
      <div className="section-divider my-4" />

      {/* ─── Nếu bạn đang... / Thì bạn đang ở đúng chỗ ─── */}
      <Reveal className="relative py-16 md:py-24" amount={0.15}>
        {/* Quầng sáng nền */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-arcane/10 blur-[120px]" />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-candle-gold/[0.07] blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4">
          <div className="relative overflow-hidden rounded-[28px] border border-arcane/25 bg-gradient-to-b from-velvet/60 via-void/70 to-velvet/40 px-6 py-10 shadow-[0_40px_100px_-60px_rgba(0,0,0,1)] sm:px-10 md:px-16 md:py-14">
            {/* Halo trong thẻ */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[26rem] -translate-x-1/2 rounded-full bg-arcane/15 blur-[70px]"
            />
            {/* Chỉ sáng mép trên + 4 góc trang trí */}
            <span
              aria-hidden
              className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-candle-gold/50 to-transparent"
            />
            <span
              aria-hidden
              className="absolute left-4 top-4 h-5 w-5 rounded-tl-[10px] border-l border-t border-candle-gold/35"
            />
            <span
              aria-hidden
              className="absolute right-4 top-4 h-5 w-5 rounded-tr-[10px] border-r border-t border-candle-gold/35"
            />
            <span
              aria-hidden
              className="absolute bottom-4 left-4 h-5 w-5 rounded-bl-[10px] border-b border-l border-candle-gold/35"
            />
            <span
              aria-hidden
              className="absolute bottom-4 right-4 h-5 w-5 rounded-br-[10px] border-b border-r border-candle-gold/35"
            />

            <div className="relative">
              {/* Eyebrow */}
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <span
                  aria-hidden
                  className="h-px w-8 bg-gradient-to-r from-transparent to-candle-gold/60 sm:w-12"
                />
                <p className="font-body text-candle-gold text-[10px] tracking-[0.3em] uppercase sm:text-[11px] sm:tracking-[0.34em]">
                  Nếu bạn đang
                </p>
                <span
                  aria-hidden
                  className="h-px w-8 bg-gradient-to-l from-transparent to-candle-gold/60 sm:w-12"
                />
              </div>

              {/* Danh sách chạy theo đường chỉ vàng */}
              <div className="relative mx-auto mt-8 max-w-xl pl-7 sm:mt-9 md:pl-9">
                <span
                  aria-hidden
                  className="absolute bottom-2 left-[3px] top-2 w-px bg-gradient-to-b from-candle-gold/5 via-candle-gold/40 to-candle-gold/5"
                />
                <ul className="space-y-4 sm:space-y-5">
                  {IF_YOU_ARE.map((line) => (
                    <li key={line} className="group relative">
                      <span
                        aria-hidden
                        className="absolute -left-7 top-[0.55em] h-[7px] w-[7px] rotate-45 border border-candle-gold/80 bg-void shadow-[0_0_12px_rgba(212,168,67,0.55)] transition-all duration-300 group-hover:bg-candle-gold/25 group-hover:shadow-[0_0_18px_rgba(212,168,67,0.9)] md:-left-9"
                      />
                      <p className="font-display text-[17px] leading-[1.5] text-mist/90 transition-colors duration-300 text-balance group-hover:text-mist sm:text-xl md:text-[23px]">
                        {line}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dấu ngăn */}
              <div
                aria-hidden
                className="mx-auto mt-9 flex max-w-sm items-center gap-3 sm:mt-10"
              >
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-arcane/40" />
                <Icon
                  name="sparkles"
                  className="h-4 w-4 shrink-0 drop-shadow-[0_0_8px_rgba(212,168,67,0.5)]"
                />
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-arcane/40" />
              </div>

              {/* Kết đoạn */}
              <div className="mt-6 text-center sm:mt-7">
                <h2 className="font-display text-[26px] leading-[1.15] drop-shadow-[0_0_30px_rgba(212,168,67,0.25)] sm:text-3xl md:text-[42px] text-balance">
                  <span className="bg-gradient-to-r from-mist via-[#f2dba0] to-candle-gold bg-clip-text text-transparent">
                    Thì bạn đang ở đúng chỗ.
                  </span>
                </h2>
                <p className="mx-auto mt-3 max-w-md font-body text-[15px] italic leading-relaxed text-lilac/80 sm:text-base md:text-lg text-balance">
                  Chỉ cần ngồi xuống, kể thật lòng — phần còn lại, mình cùng nhìn.
                </p>
              </div>
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

      {/* ─── Section divider ─── */}
      <div className="section-divider my-4" />

      {/* ─── Phan Thần Hiểu My là ai? ─── */}
      <Reveal className="py-16 md:py-24" delay={150}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="font-body text-candle-gold/80 text-xs tracking-widest uppercase mb-2">
            Reader · Healer · Coaching
          </p>
          <h2 className="font-display text-2xl md:text-4xl text-mist mb-4 leading-tight">
            Phan Thần Hiểu My là ai?
          </h2>
          <div className="mx-auto max-w-xl space-y-3 text-left font-body text-lilac leading-relaxed">
            <p>
              My là người lắng nghe bằng Tarot, Tea Leaf và Huyền Học. Hơn 10 năm qua,
              My đồng hành cùng hàng trăm người đang đứng giữa những ngã rẽ — không
              phải để phán xét số phận, mà để cùng họ nhìn sâu vào lòng mình và tìm
              lại sự bình yên đã lạc mất.
            </p>
            <p>
              My không hứa những lời tiên tri tuyệt đối. My chỉ ở đây, chậm rãi và
              thành thật, để bạn có một nơi đủ an toàn mà nói ra những điều khó nói
              nhất.
            </p>
          </div>

          <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-2 text-center sm:gap-4">
            <div className="rounded-xl border border-velvet/60 bg-velvet/30 px-2 py-3">
              <p className="font-display text-xl sm:text-2xl text-candle-gold">
                <CountUp end={10} suffix="+" />
              </p>
              <p className="font-body text-lilac/60 text-[11px] sm:text-xs mt-1">
                năm kinh nghiệm
              </p>
            </div>
            <div className="rounded-xl border border-velvet/60 bg-velvet/30 px-2 py-3">
              <p className="font-display text-xl sm:text-2xl text-candle-gold">
                <CountUp end={500} suffix="+" />
              </p>
              <p className="font-body text-lilac/60 text-[11px] sm:text-xs mt-1">
                khách hàng
              </p>
            </div>
            <div className="rounded-xl border border-velvet/60 bg-velvet/30 px-2 py-3">
              <p className="font-display text-xl sm:text-2xl text-candle-gold">
                <CountUp end={5} />
                <Icon
                  name="star"
                  className="inline-block w-4 h-4 -mt-1 ml-0.5 align-middle drop-shadow-[0_0_5px_rgba(212,168,67,0.55)]"
                />
              </p>
              <p className="font-body text-lilac/60 text-[11px] sm:text-xs mt-1">
                đánh giá
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Link
              to="/about"
              className="font-body text-candle-gold hover:text-mist underline underline-offset-4 decoration-arcane/30 transition-all"
            >
              Đọc câu chuyện đầy đủ →
            </Link>
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
            Nếu một trong những dòng này giống bạn — hãy để My khai mở điều đang làm bạn nặng lòng.
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
            <SparkleButton
              as="link"
              href="/services#cung-my"
              className="px-8 py-3 rounded-xl font-display text-sm tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 transition-all shadow-lg shadow-arcane/25 btn-glow"
            >
              <Icon
                name="sparkles"
                className="inline-block w-4 h-4 -mt-0.5 mr-1.5 drop-shadow-[0_0_6px_rgba(212,168,67,0.6)]"
              />
              Xem miễn phí để khai mở
            </SparkleButton>
            <p className="mt-3 font-body text-lilac/60 text-xs tracking-wide">
              5 phút · miễn phí · chỉ cần ngày sinh
            </p>
          </div>
        </div>
      </Reveal>

      {/* ─── Section divider ─── */}
      <div className="section-divider my-4" />

      {/* ─── Quotes ─── */}
      <Reveal className="relative py-16 md:py-24" amount={0.15}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-arcane/10 blur-[120px]" />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-candle-gold/[0.06] blur-[80px]" />
        </div>

        <div id="loi-nhan" className="relative mx-auto max-w-5xl scroll-mt-24 px-4">
          <div className="mb-3 flex items-center justify-center gap-3">
            <span
              aria-hidden
              className="h-px w-8 bg-gradient-to-r from-transparent to-candle-gold/50 sm:w-12"
            />
            <p className="font-body text-[10px] uppercase tracking-[0.32em] text-candle-gold/80 sm:text-[11px]">
              Lời nhắn từ My
            </p>
            <span
              aria-hidden
              className="h-px w-8 bg-gradient-to-l from-transparent to-candle-gold/50 sm:w-12"
            />
          </div>

          <h2 className="font-display text-2xl md:text-4xl text-mist text-center leading-tight">
            Đôi điều My muốn nhắn bạn
          </h2>
          <p className="mx-auto mt-3 mb-9 max-w-md text-center font-body text-sm italic text-lilac/60 md:mb-12">
            Những điều My gửi lại sau mỗi buổi trò chuyện.
          </p>

          {/* Desktop: 3 cột */}
          <div className="hidden lg:grid lg:grid-cols-3 lg:gap-5">
            {QUOTE_CARDS.map((q) => (
              <figure
                key={q.webp}
                className="group relative aspect-[314/591] overflow-hidden rounded-2xl border border-velvet/60 bg-velvet/30 shadow-lg shadow-velvet/20 transition-all duration-300 hover:-translate-y-1 hover:border-arcane/40 hover:shadow-xl hover:shadow-arcane/20"
              >
                <picture>
                  <source srcSet={q.webp} type="image/webp" />
                  <img
                    src={q.jpg}
                    alt={`Lời nhắn từ My: “${q.text}”`}
                    width={314}
                    height={591}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </picture>
              </figure>
            ))}
          </div>

          {/* Mobile/tablet: một card duy nhất, nút chuyển nằm 2 bên */}
          <div className="-mx-4 lg:hidden">
            <div className="mx-auto flex w-full max-w-[416px] items-center justify-center gap-1 px-2">
              <button
                type="button"
                onClick={() =>
                  setQuoteIndex(
                    (i) => (i - 1 + QUOTE_CARDS.length) % QUOTE_CARDS.length
                  )
                }
                aria-label="Xem lời nhắn trước"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-arcane/30 bg-void/85 text-lilac shadow-lg shadow-void/50 backdrop-blur transition-colors hover:border-candle-gold/60 hover:text-candle-gold"
              >
                <Icon name="chevron-down" className="h-5 w-5 rotate-90" />
              </button>

              <div
                className="relative aspect-[314/591] min-w-0 flex-1 touch-pan-y overflow-hidden rounded-2xl border border-velvet/60 bg-velvet/30 shadow-lg shadow-velvet/20"
                onTouchStart={(e) => {
                  quoteTouchX.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  if (quoteTouchX.current === null) return;
                  const dx = e.changedTouches[0].clientX - quoteTouchX.current;
                  quoteTouchX.current = null;
                  if (Math.abs(dx) < 40) return;
                  setQuoteIndex(
                    (i) =>
                      (i + (dx < 0 ? 1 : -1) + QUOTE_CARDS.length) %
                      QUOTE_CARDS.length
                  );
                }}
              >
                {QUOTE_CARDS.map((q, i) => (
                  <picture
                    key={q.webp}
                    aria-hidden={i !== quoteIndex}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      i === quoteIndex ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    <source srcSet={q.webp} type="image/webp" />
                    <img
                      src={q.jpg}
                      alt={`Lời nhắn từ My: “${q.text}”`}
                      width={314}
                      height={591}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </picture>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setQuoteIndex((i) => (i + 1) % QUOTE_CARDS.length)
                }
                aria-label="Xem lời nhắn tiếp theo"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-arcane/30 bg-void/85 text-lilac shadow-lg shadow-void/50 backdrop-blur transition-colors hover:border-candle-gold/60 hover:text-candle-gold"
              >
                <Icon name="chevron-down" className="h-5 w-5 -rotate-90" />
              </button>
            </div>

            <p className="sr-only" aria-live="polite">
              Lời nhắn {quoteIndex + 1} / {QUOTE_CARDS.length}
            </p>
          </div>
        </div>
      </Reveal>

      {/* ─── Section divider ─── */}
      <div className="section-divider my-4" />

      {/* ─── Feedback ─── */}
      <Reveal className="py-16 md:py-24" delay={100}>
        <div className="max-w-5xl mx-auto px-4">
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

      {/* Footer */}
      <Footer />
    </main>
  );
}
