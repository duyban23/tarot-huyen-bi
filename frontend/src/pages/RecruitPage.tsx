import { useState } from "react";
import type { ReactNode } from "react";
import { createIdolApplication } from "../api/client";
import SparkleButton from "../components/SparkleButton";
import Reveal from "../components/Reveal";
import { Icon } from "../components/icons";

type Chapter = {
  title: string;
  points?: string[];
};

type Course = {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  price: string;
  oldPrice?: string;
  badge?: string;
  chapters: Chapter[];
};

const COURSES: Course[] = [
  {
    id: "co-ban",
    icon: "tarot",
    name: "Khóa Cơ bản Tarot",
    tagline: "Làm quen, kết nối và hiểu sâu 78 lá bài Tarot từ con số 0.",
    price: "5.000.000₫",
    chapters: [
      { title: "Chương 1: Làm quen và kết nối với Tarot" },
      {
        title: "Chương 2: Tìm hiểu sâu sắc về 78 lá bài trong Tarot",
        points: [
          "Phần 1: Các yếu tố cấu tạo nên 1 bộ bài Tarot",
          "Phần 2: Đi sâu vào các lá ẩn chính",
          "Phần 3: Đi sâu vào các lá ẩn phụ — Bộ Thường, Bộ Quý tộc",
        ],
      },
    ],
  },
  {
    id: "nang-cao",
    icon: "crystal",
    name: "Khóa Nâng cao",
    tagline: "Đọc bài thành thạo và bước lên con đường Reader chuyên nghiệp.",
    price: "10.000.000₫",
    chapters: [
      { title: "Chương 3: Cách để đọc được, nhớ nhanh 1 bộ bài Tarot cho người mới bắt đầu" },
      { title: "Chương 4: Để trở thành 1 Tarot Reader chuyên nghiệp" },
      { title: "Chương 5: Chia sẻ kinh nghiệm và cách kiếm tiền từ Tarot" },
    ],
  },
  {
    id: "tai-sinh",
    icon: "sprout",
    name: "Khóa Tái Sinh",
    tagline: "Chữa lành, thấu hiểu bản thân và tái thiết lập cuộc sống bình an.",
    price: "10.000.000₫",
    oldPrice: "15.000.000₫",
    badge: "Giai đoạn thử nghiệm",
    chapters: [
      {
        title: "1. Khái niệm",
        points: [
          "Tiềm thức",
          "Ý thức",
          "Thiền",
          "Năng lượng là gì?",
          "Có hay không tần số?",
          "Tôn giáo và tâm linh?",
          "Hiểu rõ về hoocmon (theo khoa học)",
          "Ý nghĩ và cảm xúc thực chất là gì?",
          "Hạnh phúc là gì?",
        ],
      },
      {
        title: "2. Thực hành gặp gỡ bản thân và chữa lành tổn thương",
        points: [
          "Nỗi đau được tạo ra như thế nào?",
          "Thành thật với bản thân",
          "Đối diện với nỗi sợ",
          "Dịch chuyển năng lượng",
          "Quay vào bên trong",
          "Tìm ra điều mình thật sự cần — điều đang làm mình kẹt — và tự giải quyết chúng",
          "Gỡ rối các tình huống trong gia đình, hôn nhân của thân chủ",
        ],
      },
      {
        title: "3. Người Nam Châm — thu hút mọi điều đến với mình",
        points: [
          "Luật hấp dẫn",
          "Manifest điều mình muốn",
          "Các câu Mantra",
          "Tần số rung động",
        ],
      },
      {
        title: "4. Thực hành thở và thiền — tái thiết lập cuộc sống cân bằng và bình an",
        points: [
          "Khái niệm: tầng nhân sinh quan, luân xa",
          "Thực hành thiền và trả lại trạng thái tốt đẹp",
          "Thực hành thiền thiết kế cuộc sống, sự nghiệp, tình yêu mình mơ ước trong tâm tưởng",
          "Các phương pháp thở có thể thực hành lúc chưa thiền được",
          "Nuôi mầm hạt giống tốt đẹp",
          "Thiền thực hành lòng biết ơn và neo giữ cảm xúc",
          "Bài học về trạng thái cảm xúc: Tái sinh",
          "Cách để tự thực hành: neo giữ cảm xúc bình an và hạnh phúc",
          "Năng lực sống bằng trái tim",
        ],
      },
    ],
  },
];

const COURSE_OPTIONS = COURSES.map((c) => ({
  value: c.name,
  label: `${c.name} — ${c.price}${c.oldPrice ? ` (ưu đãi từ ${c.oldPrice})` : ""}`,
}));

/** Ô nhập của form: viền vàng + quầng sáng khi focus, khớp hiệu ứng các thẻ chọn khóa. */
const INPUT =
  "w-full bg-void border border-velvet rounded-lg px-4 py-2.5 font-body text-mist placeholder-lilac/40 focus:outline-none focus:border-candle-gold focus:ring-2 focus:ring-candle-gold/40 transition-all";

/**
 * Mở/gập một mục.
 *  - level="course": thẻ khóa học — quầng sáng vàng y như thẻ ở các trang khác.
 *  - level="chapter": dòng nhỏ bên trong — sáng lên khi đưa chuột/chạm vào.
 * `selected` = khách đã chọn khóa này (bấm thẻ giá hoặc nút đăng ký) → sáng nhất.
 */
function Accordion({
  title,
  children,
  defaultOpen = false,
  level = "chapter",
  selected = false,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  level?: "course" | "chapter";
  selected?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isCourse = level === "course";
  return (
    <div
      className={`overflow-hidden ${
        isCourse
          ? `tap-card rounded-2xl ${open ? "is-open" : ""} ${selected ? "is-selected" : ""}`
          : `tap-row rounded-xl border border-velvet/50 bg-void/40 ${open ? "is-open" : ""}`
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left min-h-[52px] hover:bg-velvet/25 active:bg-velvet/35 transition-colors"
      >
        <span className="font-display text-sm md:text-base tracking-wider text-mist">{title}</span>
        <span
          className={`shrink-0 text-candle-gold text-lg leading-none transition-all duration-300 ${
            open ? "rotate-45 drop-shadow-[0_0_10px_rgba(212,168,67,0.9)]" : ""
          }`}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 border-t border-velvet/40">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function RecruitPage() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    course: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function chooseCourse(courseName: string) {
    setForm((f) => ({ ...f, course: courseName }));
    document.getElementById("dang-ky")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToForm() {
    document.getElementById("dang-ky")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // BE giữ nguyên schema idol_applications: khóa học -> reason, lời nhắn -> experience
      await createIdolApplication({
        full_name: form.full_name.trim(),
        phone: form.phone.replace(/[\s.\-()]/g, ""),
        email: form.email.trim() || null,
        reason: form.course,
        experience: form.message.trim() || null,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full text-center animate-fade-in">
          <span className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-candle-gold/15 border-2 border-candle-gold/50 shadow-[0_0_28px_rgba(212,168,67,0.35)]">
            <Icon name="sprout" className="w-10 h-10" />
          </span>
          <h1 className="font-display text-3xl text-mist mb-4">Đăng ký thành công!</h1>
          <p className="font-body text-lilac italic mb-8">
            Cảm ơn bạn đã đăng ký khóa học. My sẽ liên hệ trong thời gian sớm nhất để tư vấn lộ trình phù hợp.
          </p>
          <SparkleButton
            as="link"
            href="/"
            className="px-8 py-3 rounded-xl font-display text-sm tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 transition-all btn-glow"
          >
            Về trang chủ
          </SparkleButton>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-16 pb-16">
      {/* Hero */}
      <Reveal className="py-16 md:py-24" amount={0.2}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl border border-arcane/30 bg-gradient-to-br from-velvet/80 via-void to-arcane/20 shadow-2xl shadow-arcane/20">
            <div className="relative max-w-3xl mx-auto px-6 py-12 md:px-12 md:py-16 text-center">
              <span className="inline-block bg-candle-gold text-void font-display text-xs tracking-widest uppercase px-4 py-1.5 rounded-full shadow-lg mb-5">
                Đào tạo
              </span>
              <h1 className="font-display text-3xl md:text-5xl text-mist mb-5 leading-tight">
                Học Tarot &amp; chữa lành
                <br />
                cùng My
              </h1>
              <p className="font-body text-lilac italic mb-7 leading-relaxed max-w-md mx-auto">
                Từ người chưa biết gì về Tarot trở thành Reader chuyên nghiệp — và sâu hơn nữa là hành trình
                tái sinh chính mình. Chọn khóa học phù hợp với bạn bên dưới.
              </p>

              {/* Giá tóm tắt — chạm là chọn khóa đó (thẻ sáng lên như đang chọn) */}
              <div className="flex flex-wrap items-stretch justify-center gap-2.5 md:gap-3 mb-8">
                {COURSES.map((c) => {
                  const chosen = form.course === c.name;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => chooseCourse(c.name)}
                      aria-pressed={chosen}
                      className={`tap-card tap-card--gold rounded-xl px-5 py-3 min-w-[140px] active:scale-[0.98] ${
                        chosen ? "is-selected" : ""
                      }`}
                    >
                      <p className="font-body text-candle-gold text-xs tracking-widest uppercase">
                        {c.name.replace("Khóa ", "").replace("Khóa học ", "")}
                      </p>
                      {c.oldPrice && (
                        <p className="font-body text-lilac/50 text-sm line-through">{c.oldPrice}</p>
                      )}
                      <p
                        className={`font-display text-2xl md:text-3xl font-bold text-candle-gold ${
                          chosen
                            ? "drop-shadow-[0_0_14px_rgba(245,207,124,0.9)]"
                            : "drop-shadow-[0_0_12px_rgba(212,168,67,0.35)]"
                        }`}
                      >
                        {c.price}
                      </p>
                    </button>
                  );
                })}
              </div>

              <SparkleButton
                type="button"
                onClick={scrollToForm}
                className="w-full sm:w-auto px-10 py-4 rounded-xl font-display text-sm tracking-widest uppercase bg-candle-gold text-void hover:bg-candle-gold/85 transition-all shadow-lg shadow-candle-gold/25 btn-glow"
              >
                Đăng ký học ngay
              </SparkleButton>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Chi tiết khóa học */}
      <Reveal className="py-8 md:py-12" delay={100}>
        <div className="max-w-3xl mx-auto px-4">
          <p className="font-body text-candle-gold text-sm tracking-widest uppercase text-center mb-2">
            ✦ Nội dung giảng dạy ✦
          </p>
          <h2 className="font-display text-2xl md:text-4xl text-mist text-center mb-8">
            Các khóa học
          </h2>

          <div className="space-y-4">
            {COURSES.map((course, idx) => (
              <Accordion
                key={course.id}
                level="course"
                selected={form.course === course.name}
                defaultOpen={idx === 0}
                title={
                  <span className="flex items-center gap-3">
                    <span className="text-candle-gold"><Icon name={course.icon} className="w-6 h-6" /></span>
                    <span>
                      <span className="block">
                        {course.name}
                        {course.badge && (
                          <span className="ml-2 inline-block align-middle bg-candle-gold/20 border border-candle-gold/50 text-candle-gold font-body text-[11px] tracking-wider uppercase px-2 py-0.5 rounded-full">
                            {course.badge}
                          </span>
                        )}
                      </span>
                      <span className="block font-body text-sm mt-1.5">
                        {course.oldPrice && (
                          <span className="text-lilac/50 text-sm line-through mr-2">{course.oldPrice}</span>
                        )}
                        <span className="text-candle-gold font-bold text-xl md:text-2xl tracking-wide">{course.price}</span>
                      </span>
                    </span>
                  </span>
                }
              >
                <p className="font-body text-lilac/85 text-sm italic mb-3">{course.tagline}</p>
                <div className="space-y-2">
                  {course.chapters.map((ch) =>
                    ch.points ? (
                      <Accordion key={ch.title} title={<span className="text-sm">{ch.title}</span>}>
                        <ul className="space-y-1.5">
                          {ch.points.map((p) => (
                            <li
                              key={p}
                              className="flex items-start gap-2.5 font-body text-lilac/90 text-sm"
                            >
                              <span className="text-candle-gold mt-0.5 shrink-0">✦</span>
                              {p}
                            </li>
                          ))}
                        </ul>
                      </Accordion>
                    ) : (
                      <div
                        key={ch.title}
                        className="flex items-start gap-2.5 px-1 py-1 font-body text-mist text-sm"
                      >
                        <Icon name="crystal" className="w-4 h-4 mt-0.5 shrink-0" />
                        {ch.title}
                      </div>
                    )
                  )}
                </div>
                <SparkleButton
                  type="button"
                  onClick={() => chooseCourse(course.name)}
                  className="w-full mt-4 py-3 rounded-xl font-display text-sm tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 transition-all btn-glow"
                >
                  Đăng ký {course.name}
                </SparkleButton>
              </Accordion>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Form đăng ký */}
      <Reveal className="py-8 md:py-12" delay={150}>
        <div id="dang-ky" className="max-w-4xl mx-auto px-4">
          <div className="bg-velvet/40 border border-velvet rounded-xl p-6 md:p-8 max-w-2xl mx-auto scroll-mt-28">
            <h2 className="font-display text-lg tracking-wider uppercase text-mist text-center mb-6">
              Đăng ký khóa học
            </h2>

            {error && (
              <p className="text-center font-body text-red-400 italic mb-4" role="alert">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-lilac text-sm mb-1">
                  Họ và tên <span className="text-candle-gold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                  className={INPUT}
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-body text-lilac text-sm mb-1">
                    Số điện thoại <span className="text-candle-gold">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className={INPUT}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block font-body text-lilac text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={INPUT}
                    placeholder="Nhập địa chỉ email"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-lilac text-sm mb-1">
                  Chọn khóa học <span className="text-candle-gold">*</span>
                </label>
                <select
                  required
                  value={form.course}
                  onChange={(e) => update("course", e.target.value)}
                  className={`w-full bg-void border rounded-lg px-4 py-2.5 font-body text-mist focus:outline-none focus:border-candle-gold focus:ring-2 focus:ring-candle-gold/40 transition-all ${
                    form.course
                      ? "border-candle-gold shadow-[0_0_26px_-10px_rgba(245,207,124,0.95)]"
                      : "border-velvet"
                  }`}
                >
                  <option value="" disabled>
                    Chọn khóa học bạn muốn đăng ký
                  </option>
                  {COURSE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-body text-lilac text-sm mb-1">
                  Lời nhắn <span className="text-lilac/40">(không bắt buộc)</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  rows={3}
                  className={`${INPUT} resize-none`}
                  placeholder="Bạn muốn My tư vấn điều gì thêm?"
                />
              </div>

              <SparkleButton
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-display text-sm tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 transition-all btn-glow disabled:opacity-60"
              >
                {loading ? "Đang gửi..." : "Gửi đăng ký"}
              </SparkleButton>
            </form>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
