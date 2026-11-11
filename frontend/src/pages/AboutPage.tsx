import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import CountUp from "../components/CountUp";
import SparkleButton from "../components/SparkleButton";
import { Icon } from "../components/icons";

const VALUES = [
  {
    icon: "moon",
    title: "Nói thật, không dọa",
    desc: "Không lời chung chung, không hù dọa. Chỉ có sự thật dịu dàng — đủ rõ để bạn tự quyết định.",
  },
  {
    icon: "heart",
    title: "Được lắng nghe",
    desc: "Mỗi buổi xem là một cuộc trò chuyện cởi mở. Cứ kể hết — My ở đây để hiểu, không phải để đánh giá.",
  },
  {
    icon: "sparkles",
    title: "Nhẹ lòng hơn khi ra về",
    desc: "Bạn rời đi với lòng rõ ràng và vững vàng hơn — đủ tự tin bước tiếp mà không cần dựa vào ai.",
  },
];

const FEATURED_PRESS = {
  outlet: "Inhat Hà Nội",
  date: "17/07/2025",
  title: "Top 12 Địa Chỉ Bói Bài Tarot Hà Nội Nổi Tiếng Nhất — Chemie Tarot #1",
  excerpt:
    "Chemie Tarot do Tarot Reader Hiểu My sáng lập được xếp hạng #1 địa chỉ bói bài Tarot Hà Nội chuẩn, chính xác và có tâm nhất.",
  url: "https://hanoi.inhat.vn/boi-bai-tarot-ha-noi/",
  monogram: "I",
  logo: "/images/press/logo-inhat.svg",
};

const PRESS_LINKS = [
  {
    outlet: "Dân Việt",
    label: "Bài viết",
    title: "Phan Thần Hiểu My: Từ Content Creator đến hành trình lan tỏa giá trị chữa lành",
    url: "https://danviet.vn/phan-than-hieu-my-tu-content-creator-den-hanh-trinh-lan-toa-gia-tri-chua-lanh-d1452596.html",
    monogram: "D",
    logo: "/images/press/logo-danviet.svg",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pb-16">
      {/* ─── Hero: ảnh không gian thật làm nền ─── */}
      <section className="relative isolate overflow-hidden">
        <picture className="absolute inset-0 -z-10">
          <source srcSet="/images/space/gallery/space-02.webp" type="image/webp" />
          <img
            src="/images/space/gallery/space-02.jpg"
            alt="Không gian trải bài ấm áp với ánh nến tại Healing With My"
            loading="eager"
            decoding="async"
            className="space-kenburns h-full w-full object-cover object-[center_42%]"
          />
        </picture>
        <div aria-hidden className="absolute inset-0 -z-10 bg-void/64" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-void/85 via-void/30 to-void"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_15%,rgba(26,16,40,0.55)_78%)]"
        />

        <div className="relative mx-auto flex min-h-[86svh] max-w-3xl flex-col items-center justify-center px-4 pb-24 pt-28 text-center">
          <div className="hero-rise">
            <BrandLogo />
          </div>
          <h1
            className="hero-rise mt-4 font-display text-4xl leading-tight text-mist md:text-6xl"
            style={{ animationDelay: "100ms" }}
          >
            Giới thiệu
          </h1>
          <p
            className="hero-rise mt-3 text-balance font-body text-[10px] uppercase tracking-[0.18em] text-candle-gold/90 sm:text-xs sm:tracking-[0.28em] md:text-sm"
            style={{ animationDelay: "180ms" }}
          >
            Người lắng nghe bằng Tarot · Tea Leaf
          </p>
          <p
            className="hero-rise mt-6 max-w-xl font-body text-lg italic leading-relaxed text-mist/90 md:text-xl"
            style={{ animationDelay: "260ms" }}
          >
            Hơn 10 năm đồng hành cùng Tarot, Tea Leaf, Oracle và Huyền Học —
            My ở đây không phải để phán xét số phận bạn, mà để cùng bạn nhìn sâu
            vào lòng mình và tìm lại sự bình yên đã lạc mất.
          </p>
          <a
            href="#cau-chuyen"
            className="hero-rise mt-10 inline-flex flex-col items-center gap-2 font-body text-[11px] uppercase tracking-[0.28em] text-lilac/75 transition-colors hover:text-candle-gold"
            style={{ animationDelay: "340ms" }}
          >
            Câu chuyện của My
            <Icon name="chevron-down" className="h-5 w-5 animate-bounce" />
          </a>
        </div>

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-void to-transparent"
        />
      </section>

      <div className="mx-auto max-w-3xl px-4">
        {/* My story — chữ đặt trên nền ảnh không gian */}
        <section id="cau-chuyen" className="mb-14 scroll-mt-24 pt-14 md:pt-20">
          <h2 className="font-display text-xl md:text-2xl text-mist text-center mb-8 leading-tight">
            Từ những mảnh vỡ,
            <br />
            My học cách ôm lấy chính mình
          </h2>
          <div className="relative overflow-hidden rounded-3xl border border-velvet/60 shadow-xl shadow-void/40">
            <picture className="absolute inset-0">
              <source srcSet="/images/space/gallery/space-03.webp" type="image/webp" />
              <img
                src="/images/space/gallery/space-03.jpg"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-[62%_28%] md:object-[74%_28%]"
              />
            </picture>
            <div
              aria-hidden
              className="absolute inset-0 bg-void/68 md:bg-transparent md:bg-gradient-to-r md:from-void md:via-void/85 md:to-void/5"
            />
            <div className="relative space-y-4 p-6 font-body leading-relaxed text-lilac md:max-w-[62%] md:p-9">
              <p>
                My từng dồn hết thanh xuân cho một dự án của riêng mình, mang theo
                niềm tin rằng chỉ cần hết mình thì giấc mơ nào cũng thành. Rồi nó
                thất bại. Có một năm, My chọn ở ẩn — không muốn gặp ai, cũng không
                muốn bắt đầu lại điều gì.
              </p>
              <p>
                My cũng từng yêu hết mình rồi đau đến nghẹt thở, từng bị phản bội
                bởi người mình tin nhất, từng bị chê cười chỉ vì khác biệt. Đã có
                lúc, My soi gương mà không nhận ra người trong đó là ai.
              </p>
              <p>
                Không có phép màu nào cả. Chỉ là một ngày, My học cách ngồi lại và
                ôm lấy chính mình — cả những mảnh vỡ, những vết thương, những phiên
                bản từng bị chê cười. My học Tarot, Tea Leaf và chữa lành, không
                phải để đoán số phận, mà để hiểu lòng người, bắt đầu từ lòng mình.
              </p>
              <p className="font-display text-lg md:text-xl text-mist leading-relaxed border-l-2 border-candle-gold/50 pl-4">
                Và hôm nay, My ở đây — để làm cho bạn điều mà năm đó My từng ước có
                ai đó làm cho mình: lắng nghe, thấu hiểu và cùng bạn tìm lại ánh sáng.
              </p>
            </div>
          </div>
        </section>

        {/* Quote band trên nền ảnh không gian */}
        <section
          id="khong-gian"
          className="relative mb-14 scroll-mt-24 overflow-hidden rounded-3xl border border-velvet/60 shadow-xl shadow-void/40"
        >
          <picture className="absolute inset-0">
            <source srcSet="/images/space/gallery/space-01.webp" type="image/webp" />
            <img
              src="/images/space/gallery/space-01.jpg"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-[62%_center]"
            />
          </picture>
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-void via-void/90 to-void/25"
          />
          <div className="relative max-w-md px-6 py-10 md:px-9 md:py-12">
            <p className="font-body text-[10px] uppercase tracking-[0.32em] text-candle-gold/80">
              Không gian của My
            </p>
            <blockquote className="mt-3 font-display text-xl italic leading-snug text-mist md:text-2xl">
              “Ở đây không có phán xét. Chỉ có một tách trà, một bộ bài, và
              khoảng thời gian dành riêng cho bạn.”
            </blockquote>
            <Link
              to="/booking"
              className="mt-6 inline-block font-body text-sm font-semibold uppercase tracking-wider text-candle-gold transition-transform hover:translate-x-1"
            >
              Đặt lịch trải bài →
            </Link>
          </div>
        </section>

        {/* Values */}
        <section className="mb-14">
          <h2 className="font-display text-xl md:text-2xl text-mist text-center mb-2">
            Điều bạn sẽ cảm nhận ở đây
          </h2>
          <p className="font-body text-lilac/60 italic text-center mb-8">
            Không phải lời khoe khoang — chỉ là lời hứa dịu dàng dành cho bạn.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-velvet/40 border border-velvet rounded-xl p-5 flex flex-col items-center text-center hover:border-arcane/30 transition-colors"
              >
                <span className="mb-3 text-candle-gold">
                  <Icon name={v.icon} className="w-7 h-7" />
                </span>
                <h3 className="font-display text-sm tracking-wider uppercase text-mist mb-2">
                  {v.title}
                </h3>
                <p className="font-body text-lilac/70 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mb-14">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center bg-velvet/40 border border-velvet rounded-xl p-5 sm:p-8">
            <div>
              <p className="font-display text-2xl sm:text-3xl text-candle-gold"><CountUp end={10} suffix="+" /></p>
              <p className="font-body text-lilac/60 text-xs sm:text-sm">năm kinh nghiệm</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl text-candle-gold"><CountUp end={500} suffix="+" /></p>
              <p className="font-body text-lilac/60 text-xs sm:text-sm">khách hàng</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-3xl text-candle-gold">
                <CountUp end={5} />
                <Icon
                  name="star"
                  className="inline-block w-5 h-5 sm:w-6 sm:h-6 -mt-1 ml-1 align-middle drop-shadow-[0_0_6px_rgba(212,168,67,0.55)]"
                />
              </p>
              <p className="font-body text-lilac/60 text-xs sm:text-sm">đánh giá</p>
            </div>
          </div>
        </section>

        {/* Press */}
        <section className="mb-14">
          <h2 className="font-display text-xl md:text-2xl text-mist text-center mb-8">
            Báo chí nói về My
          </h2>

          {/* Featured article */}
          <a
            href={FEATURED_PRESS.url}
            target="_blank"
            rel="noreferrer"
            className="group tap-card relative block overflow-hidden rounded-2xl bg-gradient-to-br from-velvet/80 via-void to-arcane/20 mb-5"
          >
            <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-candle-gold/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-arcane/25 blur-3xl" />
            <div className="relative flex flex-col sm:flex-row items-stretch gap-5 p-6 md:p-7">
              <div className="glow-box shrink-0 mx-auto sm:mx-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-velvet flex items-center justify-center group-hover:scale-105 transition-transform relative overflow-hidden">
                <span className="font-display text-4xl md:text-5xl text-candle-gold">
                  {FEATURED_PRESS.monogram}
                </span>
                <img
                  src={FEATURED_PRESS.logo}
                  alt={FEATURED_PRESS.outlet}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-contain p-3 bg-velvet"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                  <span className="bg-candle-gold text-void font-display text-xs tracking-widest uppercase px-3 py-1 rounded-full">
                    Nổi bật
                  </span>
                  <span className="font-body text-candle-gold/80 text-sm">
                    {FEATURED_PRESS.outlet} · {FEATURED_PRESS.date}
                  </span>
                </div>
                <h3 className="font-display text-lg md:text-xl text-mist leading-snug mb-2 group-hover:text-candle-gold transition-colors">
                  {FEATURED_PRESS.title}
                </h3>
                <p className="font-body text-lilac/80 text-sm leading-relaxed mb-3">
                  {FEATURED_PRESS.excerpt}
                </p>
                <span className="inline-block font-body text-candle-gold text-sm font-semibold tracking-wider uppercase group-hover:translate-x-1 transition-transform">
                  Đọc bài gốc →
                </span>
              </div>
            </div>
          </a>

          {/* Other articles */}
          <div className="grid gap-3">
            {PRESS_LINKS.map((p) => (
              <a
                key={p.url}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="tap-row group flex items-center gap-4 bg-velvet/40 border border-velvet rounded-xl p-4"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-velvet border border-velvet flex items-center justify-center relative overflow-hidden">
                  <span className="font-display text-xl text-candle-gold">{p.monogram}</span>
                  <img
                    src={p.logo}
                    alt={p.outlet}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-contain p-1.5 bg-velvet"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-candle-gold/70 text-xs tracking-wider uppercase">
                    {p.outlet} · {p.label}
                  </p>
                  <h3 className="font-body text-mist text-sm md:text-base leading-snug line-clamp-2 group-hover:text-candle-gold transition-colors">
                    {p.title}
                  </h3>
                </div>
                <span className="shrink-0 font-body text-candle-gold text-lg group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="font-display text-xl md:text-2xl text-mist mb-4">
            Khi lòng đã mỏi, đừng đi một mình
          </h2>
          <p className="font-body text-lilac italic mb-6">
            Đặt một buổi xem — để có một khoảng lặng riêng và nhẹ lòng bước tiếp.
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
            <Link
              to="/services"
              className="px-8 py-3 rounded-xl font-display text-sm tracking-widest uppercase border border-velvet text-lilac hover:border-arcane/50 hover:text-mist transition-all"
            >
              Khám phá dịch vụ
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
