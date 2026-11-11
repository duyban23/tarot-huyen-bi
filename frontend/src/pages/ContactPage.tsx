import { useState } from "react";
import { createContactMessage } from "../api/client";
import SparkleButton from "../components/SparkleButton";
import { Icon } from "../components/icons";
import PlatformIcon, { type PlatformName } from "../components/PlatformIcon";

const CONTACTS: {
  name: string;
  desc: string;
  href: string;
  label: string;
  platform: PlatformName;
  external?: boolean;
}[] = [
  {
    name: "Zalo",
    desc: "Tư vấn nhanh qua Zalo",
    href: "https://zalo.me/0343993456",
    label: "zalo.me/0343993456",
    platform: "zalo",
    external: true,
  },
  {
    name: "Facebook",
    desc: "Theo dõi My trên Facebook",
    href: "https://www.facebook.com/ChemieTarot",
    label: "facebook.com/ChemieTarot",
    platform: "facebook",
    external: true,
  },
  {
    name: "Messenger",
    desc: "Nhắn My qua Facebook",
    href: "https://www.facebook.com/ChemieTarot",
    label: "facebook.com/ChemieTarot",
    platform: "messenger",
    external: true,
  },
  {
    name: "Điện thoại",
    desc: "Gọi trực tiếp để đặt lịch nhanh",
    href: "tel:0343993456",
    label: "0343 993 456",
    platform: "phone",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/[\s.\-()]/g, "") || null,
        message: form.message,
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
            <Icon name="heart" className="w-10 h-10" />
          </span>
          <h1 className="font-display text-3xl text-mist mb-4">Đã gửi tin nhắn!</h1>
          <p className="font-body text-lilac italic mb-8">
            Cảm ơn bạn đã liên hệ. My sẽ phản hồi trong thời gian sớm nhất.
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
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-5xl text-mist mb-4">Liên hệ với My</h1>
          <p className="font-body text-lilac italic">
            Bạn có câu hỏi? My luôn sẵn sàng lắng nghe.
          </p>
        </div>

        {/* Kênh liên hệ nhanh */}
        <section className="mb-8">
          <div className="text-center mb-6">
            <h2 className="font-display text-lg tracking-wider uppercase text-mist">
              Kết nối với My
            </h2>
            <p className="font-body text-lilac/60 italic text-sm mt-1">
              Chọn kênh bạn thấy thoải mái nhất.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {CONTACTS.map((c) => (
              <a
                key={c.name}
                href={c.href}
                {...(c.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-start gap-3 rounded-2xl border border-velvet/60 bg-velvet/30 p-4 hover:border-candle-gold/40 hover:bg-velvet/45 transition-all"
              >
                <PlatformIcon name={c.platform} className="h-12 w-12" />
                <span className="min-w-0">
                  <span className="block font-display text-sm tracking-wider uppercase text-mist mb-0.5">
                    {c.name}
                  </span>
                  <span className="block font-body text-lilac/80 text-sm leading-snug">
                    {c.desc}
                  </span>
                  <span className="mt-1 block truncate font-body text-candle-gold text-sm group-hover:underline underline-offset-4">
                    {c.label}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Dấu chia */}
        <div aria-hidden className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-arcane/30" />
          <span className="font-body text-lilac/50 text-[11px] uppercase tracking-[0.3em]">
            hoặc
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-arcane/30" />
        </div>

        {/* Gửi tin nhắn */}
        <div className="bg-velvet/40 border border-velvet rounded-xl p-6 md:p-8">
          <h2 className="font-display text-lg tracking-wider uppercase text-mist text-center mb-6">
            Gửi tin nhắn cho My
          </h2>

          {error && (
            <p className="text-center font-body text-red-400 italic mb-4" role="alert">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-lilac text-sm mb-1">Họ và tên <span className="text-candle-gold">*</span></label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full bg-void border border-velvet rounded-lg px-4 py-2.5 font-body text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors"
                placeholder="Nhập họ và tên"
              />
            </div>
            <div>
              <label className="block font-body text-lilac text-sm mb-1">Email <span className="text-candle-gold">*</span></label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full bg-void border border-velvet rounded-lg px-4 py-2.5 font-body text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors"
                placeholder="Nhập địa chỉ email"
              />
            </div>
            <div>
              <label className="block font-body text-lilac text-sm mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full bg-void border border-velvet rounded-lg px-4 py-2.5 font-body text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors"
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div>
              <label className="block font-body text-lilac text-sm mb-1">Tin nhắn <span className="text-candle-gold">*</span></label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                className="w-full bg-void border border-velvet rounded-lg px-4 py-2.5 font-body text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors resize-none"
                placeholder="Nhập nội dung tin nhắn"
              />
            </div>
            <SparkleButton
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-display text-sm tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 transition-all btn-glow disabled:opacity-60"
            >
              {loading ? "Đang gửi..." : "Gửi tin nhắn"}
            </SparkleButton>
          </form>
        </div>
      </div>
    </main>
  );
}
