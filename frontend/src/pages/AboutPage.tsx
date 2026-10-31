import { Link } from "react-router-dom";
import BrandLogo from "../components/BrandLogo";
import CountUp from "../components/CountUp";
import SparkleButton from "../components/SparkleButton";
import { Icon } from "../components/icons";

const VALUES = [
  {
    icon: "moon",
    title: "Nói thật, không dọa",
    desc: "Bạn sẽ không nghe những lời chung chung hay hù dọa. Chỉ có sự thật dịu dàng — đủ rõ để bạn quyết định.",
  },
  {
    icon: "heart",
    title: "Bạn được lắng nghe",
    desc: "Mỗi buổi xem là một cuộc trò chuyện không phán xét. Cứ kể hết — My ở đây để hiểu, không phải để đánh giá.",
  },
  {
    icon: "sparkles",
    title: "Ra về nhẹ lòng hơn",
    desc: "Bạn sẽ rời đi với lòng rõ ràng và vững vàng hơn — đủ tự tin bước tiếp mà không cần dựa vào ai.",
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
  {
    outlet: "Toplist Hà Nội",
    label: "Top 12 Rooftop",
    title: "Top 12 Quán Cafe Rooftop Hà Nội Được Yêu Thích — Chemie Coffee nổi tiếng về Tarot, Boardgame",
    url: "https://toplisthanoi.com/quan-cafe-rooftop-ha-noi/",
    monogram: "T",
    logo: "/images/press/logo-toplisthanoi.svg",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-body text-candle-gold text-sm tracking-widest uppercase mb-2">
            ✦ Về My ✦
          </p>
          <h1 className="font-display text-3xl md:text-5xl text-mist mb-4">Giới thiệu</h1>
        </div>

        {/* Logo + Founder */}
        <div className="text-center mb-12">
          {/* Logo: dùng chung BrandLogo — cùng cỡ & cùng độ sáng với trang chủ */}
          <div className="mb-6">
            <BrandLogo />
          </div>
          <h2 className="font-display text-2xl text-mist mb-1">My</h2>
          <p className="font-body text-candle-gold text-sm tracking-wide uppercase mb-6">
            Người lắng nghe bằng Tarot · Tea Leaf
          </p>
          <p className="font-body text-lilac max-w-xl mx-auto leading-relaxed">
            Hơn 10 năm đồng hành cùng Tarot, Tea Leaf, Oracle và Grand Tableau —
            My ở đây không phải để phán xét số phận bạn, mà để cùng bạn nhìn sâu vào lòng mình
            và tìm lại sự bình yên đã lạc mất.
          </p>
        </div>

        {/* My story */}
        <section className="mb-16">
          <p className="font-body text-candle-gold text-sm tracking-widest uppercase text-center mb-2">
            ✦ Câu chuyện của My ✦
          </p>
          <h2 className="font-display text-xl md:text-2xl text-mist text-center mb-8 leading-tight">
            Cô gái từng vỡ vụn,
            <br />
            nay là nơi bình yên của hàng trăm người
          </h2>
          <div className="bg-velvet/40 border border-velvet rounded-xl p-6 md:p-8 space-y-4 font-body text-lilac leading-relaxed">
            <p>
              My đã từng mở một quán cà phê tổ hợp giải trí cho giới trẻ ở Hà Nội —
              mang theo cả thanh xuân và niềm tin rằng chỉ cần hết mình thì giấc mơ nào
              cũng thành. Rồi nó thất bại. Sạch trơn.
            </p>
            <p>
              Sau lần kiệt sức đó, My rơi vào trầm cảm và lui về ở ẩn suốt một năm.
              Một năm không muốn gặp ai, không muốn bắt đầu lại điều gì.
            </p>
            <p>
              My đã từng không hạnh phúc. Đã từng cho đi rất nhiều, yêu hết mình
              rồi đau đến nghẹt thở. Đã từng bị phản bội, bị lừa dối bởi chính
              những người mình tin nhất.
            </p>
            <p>
              My đã từng béo, từng xấu, từng bị bạo lực học đường, từng bị tẩy chay
              và kỳ thị chỉ vì mình khác biệt. Đã từng soi gương mà không nhận ra
              người trong đó là ai.
            </p>
            <p className="font-display text-lg md:text-xl text-mist leading-relaxed">
              Vậy làm sao My vượt qua — để trở thành cô gái luôn tràn trề năng lượng
              mà hôm nay ai cũng muốn ở cạnh?
            </p>
            <p>
              Không có phép màu nào cả. Chỉ là một ngày, My học cách ngồi lại và ôm lấy
              chính mình — ôm cả những mảnh vỡ, những vết thương, những phiên bản
              từng bị chê cười. My học Tarot, học Tea Leaf, học chữa lành — không phải
              để đoán số phận, mà để hiểu lòng người, bắt đầu từ lòng mình.
            </p>
            <p className="text-candle-gold/90">
              Và hôm nay, My ở đây — để làm cho bạn điều mà năm đó My từng ước có ai đó
              làm cho mình: lắng nghe, không phán xét, và cùng bạn tìm lại ánh sáng.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="mb-16">
          <h2 className="font-display text-xl md:text-2xl text-mist text-center mb-6">
            Nếu bạn đang đọc những dòng này…
          </h2>
          <div className="bg-velvet/40 border border-velvet rounded-xl p-6 md:p-8 space-y-4 font-body text-lilac leading-relaxed">
            <p>
              Có lẽ bạn đang mang trong lòng một điều khó nói — một mối quan hệ chênh vênh,
              một ngã rẽ sự nghiệp, hay chỉ là cảm giác mông lung chẳng biết mai sẽ ra sao.
              Healing With My có mặt là vì những khoảnh khắc như thế.
            </p>
            <p>
              Ở đây, các lá bài không phải để quyết định thay bạn. Chúng như một tấm gương hiền —
              giúp bạn soi rõ điều trái tim mình thực sự muốn, để rồi can đảm hơn với lựa chọn của chính mình.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="font-display text-xl md:text-2xl text-mist text-center mb-2">
            Điều bạn sẽ cảm nhận ở đây
          </h2>
          <p className="font-body text-lilac/60 italic text-center mb-8">
            Không phải lời khoe khoang — chỉ là lời hứa dịu dàng dành cho bạn.
          </p>
          <div className="grid gap-5">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-velvet/40 border border-velvet rounded-xl p-6 flex items-start gap-4 hover:border-arcane/30 transition-colors"
              >
                <span className="shrink-0 text-candle-gold"><Icon name={v.icon} className="w-8 h-8" /></span>
                <div>
                  <h3 className="font-display text-base tracking-wider uppercase text-mist mb-1">{v.title}</h3>
                  <p className="font-body text-lilac/70">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mb-16">
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
        <section className="mb-16">
          <p className="font-body text-candle-gold text-sm tracking-widest uppercase text-center mb-2">
            ✦ Báo chí ✦
          </p>
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
            Đặt một buổi xem — để được lắng nghe, được thấu hiểu và nhẹ lòng bước tiếp.
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
