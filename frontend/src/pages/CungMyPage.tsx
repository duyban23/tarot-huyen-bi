import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ApiError,
  createAiFull,
  createAiReading,
  createPayment,
  getAiServices,
  getPaymentStatus,
} from "../api/client";
import type { AiCard, AiField, AiService, PaymentOrder } from "../api/types";
import { Icon } from "../components/icons";

type Msg =
  | { id: number; from: "my"; kind: "text"; text: string }
  | { id: number; from: "my"; kind: "services" }
  | { id: number; from: "user"; kind: "text"; text: string }
  | { id: number; from: "my"; kind: "typing" }
  | { id: number; from: "my"; kind: "meanings"; cards: AiCard[] }
  | { id: number; from: "my"; kind: "result"; text: string }
  | { id: number; from: "my"; kind: "pay"; amount: number }
  | { id: number; from: "my"; kind: "qr"; payment: PaymentOrder; paid?: boolean }
  | { id: number; from: "my"; kind: "full"; text: string };

type RetryFree = { svc: AiService; vals: Record<string, string> };
type RetryFull = { code: string; svc: AiService; vals: Record<string, string> };

let nextId = 1;
const nid = () => nextId++;

const SERVICE_ICON: Record<string, string> = {
  "ban-do-sao": "star",
  "ban-do-sao-doi": "users",
};

const INTRO =
  "Chào bạn, tôi là My 🌙 Kể My nghe bạn đang thắc mắc hoặc băn khoăn điều gì nhé — hoặc chọn nhanh một món bên dưới:";

const SAVED_KEY = "hwm_cung_my_v1";
const SAVED_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

type SavedChat = {
  version: 1;
  savedAt: number;
  msgs: Msg[];
  selected: string;
  started: string | null;
  fieldIdx: number;
  values: Record<string, string>;
};

function loadSavedChat(): SavedChat | null {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedChat;
    if (saved.version !== 1 || !saved.selected || !Array.isArray(saved.msgs)) return null;
    if (Date.now() - saved.savedAt > SAVED_MAX_AGE) {
      localStorage.removeItem(SAVED_KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

function persistChat(saved: Omit<SavedChat, "version" | "savedAt">) {
  try {
    localStorage.setItem(
      SAVED_KEY,
      JSON.stringify({ ...saved, version: 1, savedAt: Date.now() })
    );
  } catch {
    /* localStorage đầy/bị chặn — không làm hỏng luồng xem */
  }
}

function clearSavedChat() {
  try {
    localStorage.removeItem(SAVED_KEY);
  } catch {
    /* ignore */
  }
}

const isAbortError = (e: unknown) =>
  typeof DOMException !== "undefined" &&
  e instanceof DOMException &&
  e.name === "AbortError";

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Có lỗi xảy ra, bạn thử lại giúp My nhé.";


export default function CungMyPage() {
  const [searchParams] = useSearchParams();
  const [services, setServices] = useState<AiService[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [fieldIdx, setFieldIdx] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [started, setStarted] = useState<string | null>(null);
  const [retryFree, setRetryFree] = useState<RetryFree | null>(null);
  const [retryFull, setRetryFull] = useState<RetryFull | null>(null);
  const pollRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const payTimerRef = useRef<number | null>(null);
  const hydratedRef = useRef(false);
  const flowRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bootRef = useRef(false);
  const stickRef = useRef(true);
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);

  const svc = services.find((s) => s.type === selected) ?? null;
  const pendingField: AiField | null =
    svc && fieldIdx < svc.fields.length ? svc.fields[fieldIdx] : null;
  const hasQr = msgs.some((m) => m.kind === "qr");

  const push = (m: Record<string, unknown>) => {
    const id = nid();
    setMsgs((prev) => [...prev, { ...m, id } as Msg]);
    return id;
  };

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickRef.current = distBottom < 80;
    setShowUp(el.scrollTop > 200);
    setShowDown(distBottom > 120);
  }

  function scrollChat(to: "top" | "bottom") {
    const el = scrollRef.current;
    if (!el) return;
    if (to === "bottom") stickRef.current = true;
    el.scrollTo({ top: to === "bottom" ? el.scrollHeight : 0, behavior: "smooth" });
  }

  useEffect(() => {
    // Hộp thoại cố định: chỉ bám đáy khi người dùng đang ở cuối,
    // cuộn tức thì (không smooth) để không giật khi đang đọc.
    const el = scrollRef.current;
    if (el && stickRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
    }
    handleScroll();
  }, [msgs, busy]);

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    getAiServices()
      .then((list) => {
        setServices(list);

        // Khôi phục hội thoại đang xem sau khi reload (tối đa 7 ngày).
        const saved = loadSavedChat();
        const savedSvc = saved ? list.find((s) => s.type === saved.selected) : null;
        if (saved && savedSvc) {
          setSelected(saved.selected);
          setStarted(saved.started ?? saved.selected);
          setFieldIdx(saved.fieldIdx ?? 0);
          setValues(saved.values ?? {});
          const restored = saved.msgs
            .filter((m) => m.kind !== "typing")
            .map((m) => ({ ...m, id: nid() }) as Msg);
          setMsgs(restored);

          // Đơn đã tạo nhưng chưa có bản full → tiếp tục chờ thanh toán.
          const qr = [...restored]
            .reverse()
            .find((m): m is Extract<Msg, { kind: "qr" }> => m.kind === "qr");
          const hasFull = restored.some((m) => m.kind === "full");
          if (qr && !hasFull) {
            startPoll(qr.payment.code, savedSvc, saved.values ?? {});
            return;
          }

          // Reload đúng lúc bản free đang được viết: đã trả lời đủ field
          // nhưng chưa có kết quả → hỏi lại thay vì kẹt ở màn hình trống.
          const hasResult = restored.some((m) => m.kind === "result");
          if (
            !hasResult &&
            (saved.fieldIdx ?? 0) >= savedSvc.fields.length
          ) {
            fetchFree(savedSvc, saved.values ?? {});
          }
          return;
        }

        push({ from: "my", kind: "text", text: INTRO });
        const wanted = searchParams.get("service");
        if (wanted && list.some((s) => s.type === wanted)) {
          startService(list, wanted);
        } else {
          push({ from: "my", kind: "services" });
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        hydratedRef.current = true;
      });
    return () => {
      abortRef.current?.abort();
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (payTimerRef.current) window.clearTimeout(payTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lưu hội thoại để reload không mất bản free/bản full đã trả phí.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!selected) {
      clearSavedChat();
      return;
    }
    // Đang chờ phản hồi thì giữ bản lưu trước đó; tránh lưu trạng thái dở dang.
    if (busy) return;
    const awaitingResult =
      svc &&
      fieldIdx >= svc.fields.length &&
      !msgs.some(
        (m) => m.kind === "result" || m.kind === "full" || m.kind === "qr" || m.kind === "pay"
      );
    if (awaitingResult) return;
    persistChat({
      msgs: msgs.filter((m) => m.kind !== "typing"),
      selected,
      started,
      fieldIdx,
      values,
    });
  }, [msgs, selected, started, fieldIdx, values, busy, svc]);

  function startService(list: AiService[], type: string) {
    flowRef.current += 1;
    if (pollRef.current) window.clearInterval(pollRef.current);
    abortRef.current?.abort();
    abortRef.current = null;
    if (payTimerRef.current) window.clearTimeout(payTimerRef.current);
    clearSavedChat();
    const s = list.find((x) => x.type === type);
    if (!s) return;
    setBusy(false);
    setStarted(type);
    setSelected(type);
    setFieldIdx(0);
    setValues({});
    setDraft("");
    setError("");
    setRetryFree(null);
    setRetryFull(null);
    push({
      from: "my",
      kind: "text",
      text: `Bạn chọn ${s.name} — để xem cho đúng, My cần hỏi bạn vài điều nhé.`,
    });
    askField(s.fields[0]);
  }

  function askField(f: AiField) {
    const hint =
      f.type === "date"
        ? " (ngày/tháng/năm sinh)"
        : f.placeholder
          ? ` (vd: ${f.placeholder})`
          : "";
    push({ from: "my", kind: "text", text: `Cho My biết ${f.label.toLowerCase()}${hint} nhé.` });
  }

  function displayValue(f: AiField, v: string): string {
    if (f.type === "checkbox") return v === "on" ? "Có, xem luôn cho tôi" : "Bỏ qua";
    return v;
  }

  function payload(svcDef: AiService, vals: Record<string, string>) {
    const out: Record<string, unknown> = {};
    for (const f of svcDef.fields) {
      out[f.key] = f.type === "checkbox" ? vals[f.key] === "on" : (vals[f.key] ?? "");
    }
    return out;
  }

  function submitField(raw: string) {
    if (!svc || !pendingField || busy) return;
    const v = raw.trim();
    if (pendingField.required && !v) return;
    const nv = { ...values, [pendingField.key]: v };
    setValues(nv);
    push({ from: "user", kind: "text", text: displayValue(pendingField, v) });
    setDraft("");
    const next = svc.fields[fieldIdx + 1];
    if (next) {
      setFieldIdx(fieldIdx + 1);
      window.setTimeout(() => askField(next), 350);
    } else {
      setFieldIdx(fieldIdx + 1);
      fetchFree(svc, nv);
    }
  }

  async function fetchFree(svcDef: AiService, vals: Record<string, string>) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (payTimerRef.current) window.clearTimeout(payTimerRef.current);
    setBusy(true);
    setError("");
    setRetryFree(null);
    setRetryFull(null);
    const typingId = push({ from: "my", kind: "typing" });
    try {
      const r = await createAiReading(
        svcDef.type,
        payload(svcDef, vals),
        controller.signal
      );
      if (abortRef.current !== controller) return;
      setMsgs((prev) => prev.filter((m) => m.id !== typingId));
      if (r.cards && r.cards.length > 0) {
        push({ from: "my", kind: "meanings", cards: r.cards });
      }
      push({ from: "my", kind: "result", text: r.basic_result });
      payTimerRef.current = window.setTimeout(() => {
        push({ from: "my", kind: "pay", amount: svcDef.price_full });
      }, 600);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(errMsg(err));
      // Hết lượt free thì thử lại ngay cũng không được — ẩn nút để khỏi bấm vô ích.
      const quotaExhausted = err instanceof ApiError && err.status === 429;
      setRetryFree(quotaExhausted ? null : { svc: svcDef, vals });
    } finally {
      setMsgs((prev) => prev.filter((m) => m.id !== typingId));
      if (abortRef.current === controller) {
        abortRef.current = null;
        setBusy(false);
      }
    }
  }

  async function handlePay() {
    if (!svc || busy || hasQr) return;
    const flow = flowRef.current;
    if (payTimerRef.current) window.clearTimeout(payTimerRef.current);
    setBusy(true);
    setError("");
    setRetryFree(null);
    setRetryFull(null);
    const typingId = push({ from: "my", kind: "typing" });
    try {
      const input = payload(svc, values);
      const order = await createPayment(svc.type, input);
      if (flow !== flowRef.current) return;
      setMsgs((prev) => prev.filter((m) => m.id !== typingId));
      push({ from: "my", kind: "qr", payment: order });
      startPoll(order.code, svc, values);
    } catch (err) {
      if (flow !== flowRef.current) return;
      setMsgs((prev) => prev.filter((m) => m.id !== typingId));
      setError(errMsg(err));
    } finally {
      if (flow === flowRef.current) setBusy(false);
    }
  }

  function startPoll(
    code: string,
    svcDef: AiService,
    vals: Record<string, string>
  ) {
    if (pollRef.current) window.clearInterval(pollRef.current);
    let tries = 0;
    const timer = window.setInterval(async () => {
      tries += 1;
      try {
        const st = await getPaymentStatus(code);
        if (pollRef.current !== timer) return;
        if (st.status === "paid") {
          window.clearInterval(timer);
          pollRef.current = null;
          setMsgs((prev) =>
            prev.map((m) =>
              m.kind === "qr" && m.payment.code === code ? { ...m, paid: true } : m
            )
          );
          await fetchFull(code, svcDef, vals);
          return;
        }
        if (st.status === "failed") {
          window.clearInterval(timer);
          pollRef.current = null;
          setMsgs((prev) =>
            prev.filter((m) => !(m.kind === "qr" && m.payment.code === code))
          );
          setError("Giao dịch chưa thành công — bạn thử lại giúp My nhé.");
          return;
        }
      } catch {
        /* bỏ qua lỗi mạng lẻ, poll tiếp */
      }
      if (tries >= 100 && pollRef.current === timer) {
        window.clearInterval(timer);
        pollRef.current = null;
        setMsgs((prev) =>
          prev.filter((m) => !(m.kind === "qr" && m.payment.code === code))
        );
        setError(
          "My chưa thấy giao dịch — bạn kiểm tra lại nội dung chuyển khoản rồi thử lại nhé."
        );
      }
    }, 3000);
    pollRef.current = timer;
  }

  async function fetchFull(
    code: string,
    svcDef: AiService,
    vals: Record<string, string>
  ) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setError("");
    setRetryFull(null);
    const typingId = push({ from: "my", kind: "typing" });
    try {
      const r = await createAiFull(
        svcDef.type,
        payload(svcDef, vals),
        code,
        controller.signal
      );
      if (abortRef.current !== controller) return;
      setMsgs((prev) =>
        prev.filter(
          (m) =>
            m.id !== typingId &&
            m.kind !== "pay" &&
            !(m.kind === "qr" && m.payment.code === code)
        )
      );
      push({ from: "my", kind: "full", text: r.full_result });
    } catch (err) {
      if (isAbortError(err)) return;
      setError(errMsg(err));
      setRetryFull({ code, svc: svcDef, vals });
    } finally {
      setMsgs((prev) => prev.filter((m) => m.id !== typingId));
      if (abortRef.current === controller) {
        abortRef.current = null;
        setBusy(false);
      }
    }
  }

  function backToServices() {
    flowRef.current += 1;
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    if (payTimerRef.current) window.clearTimeout(payTimerRef.current);
    clearSavedChat();
    setBusy(false);
    setSelected(null);
    setStarted(null);
    setFieldIdx(0);
    setValues({});
    setDraft("");
    setError("");
    setRetryFree(null);
    setRetryFull(null);
    push({ from: "my", kind: "text", text: "Bạn muốn xem món khác? My nghe nè." });
    push({ from: "my", kind: "services" });
  }

  function resetChat() {
    flowRef.current += 1;
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    if (payTimerRef.current) window.clearTimeout(payTimerRef.current);
    clearSavedChat();
    setBusy(false);
    setSelected(null);
    setStarted(null);
    setFieldIdx(0);
    setValues({});
    setDraft("");
    setError("");
    setRetryFree(null);
    setRetryFull(null);
    setMsgs([
      { id: nid(), from: "my", kind: "text", text: INTRO } as Msg,
      { id: nid(), from: "my", kind: "services" } as Msg,
    ]);
  }

  return (
    <main className="min-h-screen pt-20 md:pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-4 md:mb-6">
          <p className="font-body text-candle-gold text-xs md:text-sm tracking-widest uppercase mb-1 md:mb-2">
            ✦ Ngồi lại cùng My ✦
          </p>
          <h1 className="font-display text-2xl md:text-5xl text-mist mb-2">
            Vũ trụ đang nhắn gì cho bạn?
          </h1>
        </div>

        {/* Khung chat */}
        <div className="bg-velvet/30 border border-velvet rounded-2xl overflow-hidden">
          {/* Header kiểu mẫu: avatar + tên + nút làm mới */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-void/60 border-b border-velvet/60">
            <img
              src="/logo/logo-128.webp"
              alt="My"
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
              className="w-10 h-10 aspect-square rounded-full object-cover bg-void/40 border border-candle-gold/40"
            />
            <p className="flex-1 font-display text-mist text-base tracking-wide">
              ✨ Xem cùng My
            </p>
            <button
              onClick={resetChat}
              aria-label="Bắt đầu hội thoại mới"
              title="Bắt đầu lại"
              className="w-10 h-10 rounded-full border border-velvet text-lilac hover:text-candle-gold hover:border-candle-gold/50 active:scale-95 transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0112-3m3 9a7 7 0 01-12 3" />
              </svg>
            </button>
          </div>

          <div className="p-4 min-[480px]:p-5">
          {/* Vùng tin nhắn: hộp thoại cao cố định, cuộn nội bộ */}
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="chat-scroll space-y-3 h-[52dvh] md:h-[56dvh] min-h-[300px] overflow-y-auto overscroll-contain pr-1 pb-1"
            >
            {msgs.map((m) => {
              if (m.from === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] bg-arcane/70 text-mist font-body text-[15px] leading-relaxed rounded-2xl rounded-br-md px-4 py-2.5">
                      {m.text}
                    </div>
                  </div>
                );
              }
              if (m.kind === "text") {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[85%] bg-void/70 border border-velvet/60 font-body text-mist text-[15px] leading-relaxed rounded-2xl rounded-bl-md px-4 py-2.5 whitespace-pre-line">
                      {m.text}
                    </div>
                  </div>
                );
              }
              if (m.kind === "typing") {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="bg-void/70 border border-velvet/60 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5" aria-label="My đang viết">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="w-2 h-2 rounded-full bg-lilac/70 animate-bounce"
                          style={{ animationDelay: `${d * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                );
              }
              if (m.kind === "services") {
                return (
                  <div key={m.id} className="flex flex-wrap gap-2">
                    {services.map((s) => (
                      <button
                        key={s.type}
                        onClick={() => startService(services, s.type)}
                        disabled={busy}
                        title={`${s.name} — Nhận ngay • Miễn phí`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-candle-gold/40 bg-void/60 font-body text-mist text-sm hover:bg-candle-gold/15 active:scale-[0.97] transition-all disabled:opacity-50 min-h-[40px]"
                      >
                        <Icon name={SERVICE_ICON[s.type] ?? "sparkles"} className="w-4 h-4" />
                        {s.name.replace(" cùng My", "")}
                      </button>
                    ))}
                  </div>
                );
              }
              if (m.kind === "meanings") {
                return (
                  <div key={m.id} className="space-y-2">
                    {m.cards.map((c, i) => (
                      <div key={i} className="bg-void/50 border border-velvet rounded-xl p-3.5">
                        <p className="font-body text-candle-gold text-xs tracking-widest uppercase mb-1">
                          {c.vi_tri} — {c.la}
                        </p>
                        <p className="font-body text-lilac text-sm leading-relaxed">{c.y_nghia_goc}</p>
                      </div>
                    ))}
                  </div>
                );
              }
              if (m.kind === "result" || m.kind === "full") {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div
                      className={`max-w-[95%] font-body text-mist text-[15px] leading-relaxed rounded-2xl rounded-bl-md px-4 py-3 whitespace-pre-line ${
                        m.kind === "full"
                          ? "bg-arcane/20 border border-candle-gold/40"
                          : "bg-void/70 border border-velvet/60"
                      }`}
                    >
                      {m.kind === "full" && (
                        <p className="font-body text-candle-gold text-xs tracking-widest uppercase mb-2">
                          ✦ Bản đầy đủ — My kể nốt ✦
                        </p>
                      )}
                      {m.text}
                    </div>
                  </div>
                );
              }
              if (m.kind === "pay") {
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[95%] bg-void/70 border border-candle-gold/40 rounded-2xl rounded-bl-md px-4 py-3">
                      <p className="font-body text-mist text-[15px] leading-relaxed mb-1">
                        Đây mới chỉ là phần mở đầu...
                      </p>
                      <p className="font-body text-mist text-[15px] leading-relaxed mb-3">
                        Để My kể nốt phần còn lại — bản đầy đủ{" "}
                        <span className="text-candle-gold font-semibold">
                          {m.amount.toLocaleString("vi-VN")}₫
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handlePay}
                          disabled={busy || hasQr}
                          className="px-5 py-2.5 rounded-xl font-display text-xs tracking-widest uppercase bg-candle-gold text-void hover:bg-candle-gold/85 disabled:opacity-50 active:scale-[0.98] transition-all min-h-[44px]"
                        >
                          Mở bản đầy đủ
                        </button>
                        <Link
                          to="/booking"
                          className="px-5 py-2.5 rounded-xl font-body text-lilac text-sm border border-velvet hover:border-arcane/50 hover:text-mist active:scale-[0.98] transition-all min-h-[44px] inline-flex items-center"
                        >
                          Đặt lịch với My
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              }
              if (m.kind === "qr") {
                const p = m.payment;
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[95%] bg-void/70 border border-candle-gold/40 rounded-2xl rounded-bl-md px-4 py-3 text-center">
                      {m.paid ? (
                        <div className="py-2" aria-live="polite">
                          <p className="font-body text-candle-gold text-sm font-semibold">
                            ✦ Đã nhận phí trà · {p.code}
                          </p>
                          <span className="mx-auto mt-3 flex h-7 w-7 animate-spin rounded-full border-2 border-candle-gold/30 border-t-candle-gold" />
                          <p className="font-body text-mist text-sm mt-2">
                            My đang viết bản đầy đủ cho bạn…
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="font-body text-mist text-[15px] mb-1">Gửi My chút phí trà ☕</p>
                          <p className="font-body text-lilac text-sm italic mb-3">
                            Quét QR và <span className="text-candle-gold font-semibold">ghi đúng nội dung</span> — My tự thấy và kể nốt ngay.
                          </p>
                          <img
                            src={p.qr_url}
                            alt="QR chuyển khoản"
                            width={208}
                            height={208}
                            loading="lazy"
                            className="w-52 h-52 aspect-square mx-auto rounded-xl bg-white p-2 mb-3"
                          />
                          <p className="font-display text-xl text-candle-gold font-bold">
                            {p.amount.toLocaleString("vi-VN")}₫
                          </p>
                          <p className="font-body text-lilac/70 text-xs mb-2">
                            {p.bank} · {p.account} · {p.account_name}
                          </p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(p.transfer_content).catch(() => {});
                              setCopied(true);
                              window.setTimeout(() => setCopied(false), 2000);
                            }}
                            className="px-5 py-2 rounded-xl font-body text-mist text-sm border border-candle-gold/50 hover:bg-candle-gold/10 active:scale-[0.98] transition-all min-h-[44px]"
                          >
                            {copied ? "Đã chép ✓" : `Chép nội dung: ${p.transfer_content}`}
                          </button>
                          <p className="font-body text-lilac/60 text-xs italic mt-2 animate-pulse">
                            Đang chờ bạn chuyển khoản...
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })}
            </div>

            {/* Nút kéo lên đầu / xuống cuối — khỏi tràn khung */}
            {showUp && (
              <button
                onClick={() => scrollChat("top")}
                aria-label="Lên đầu hội thoại"
                className="absolute top-2 right-2 w-9 h-9 rounded-full bg-void/85 border border-velvet text-lilac hover:text-candle-gold hover:border-candle-gold/50 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-black/30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            {showDown && (
              <button
                onClick={() => scrollChat("bottom")}
                aria-label="Xuống cuối hội thoại"
                className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-candle-gold text-void hover:bg-candle-gold/85 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-candle-gold/30"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          {error && (
            <div className="text-center mt-3">
              <p className="font-body text-red-400 italic text-sm" role="alert">
                {error}
              </p>
              {(retryFree || retryFull) && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (retryFree) {
                      fetchFree(retryFree.svc, retryFree.vals);
                    } else if (retryFull) {
                      fetchFull(retryFull.code, retryFull.svc, retryFull.vals);
                    }
                  }}
                  className="mt-2 min-h-[40px] rounded-xl border border-candle-gold/60 px-4 py-1.5 font-body text-[12.5px] text-candle-gold hover:bg-candle-gold/10 disabled:opacity-60"
                >
                  {retryFree ? "Thử lại" : "Viết tiếp bản đầy đủ"}
                </button>
              )}
            </div>
          )}

          {/* Ô nhập theo field đang hỏi */}
          {pendingField && !busy && (
            <div className="mt-4 pt-3 border-t border-velvet/60">
              {pendingField.type === "select" ? (
                <div className="flex flex-wrap gap-2">
                  {(pendingField.options ?? []).map((o) => (
                    <button
                      key={o}
                      onClick={() => submitField(o)}
                      className="px-4 py-2.5 rounded-xl border border-arcane/50 bg-arcane/15 font-body text-mist text-sm hover:bg-arcane/25 active:scale-[0.98] transition-all min-h-[44px] text-left"
                    >
                      {o}
                    </button>
                  ))}
                </div>
              ) : pendingField.type === "checkbox" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => submitField("on")}
                    className="px-4 py-2.5 rounded-xl border border-candle-gold/40 bg-candle-gold/10 font-body text-mist text-sm hover:bg-candle-gold/20 active:scale-[0.98] transition-all min-h-[44px]"
                  >
                    Có, xem luôn cho tôi
                  </button>
                  <button
                    onClick={() => submitField("")}
                    className="px-4 py-2.5 rounded-xl border border-velvet font-body text-lilac text-sm hover:text-mist active:scale-[0.98] transition-all min-h-[44px]"
                  >
                    Bỏ qua
                  </button>
                </div>
              ) : (
                <div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitField(draft);
                    }}
                    className="flex gap-2"
                  >
                    {pendingField.type === "textarea" ? (
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
                        rows={2}
                        autoFocus
                        placeholder={pendingField.placeholder ?? "Kể My nghe câu chuyện của bạn..."}
                        className="flex-1 bg-void border border-velvet rounded-xl px-4 py-2.5 font-body text-base text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors resize-none"
                      />
                    ) : pendingField.type === "text" ? (
                      <input
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
                        autoFocus
                        placeholder={pendingField.placeholder ?? "Bạn viết ở đây..."}
                        className="flex-1 min-w-0 bg-void border border-velvet rounded-xl px-4 py-2.5 font-body text-base text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors"
                      />
                    ) : (
                      <input
                        type={pendingField.type}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                        className="flex-1 min-w-0 bg-void border border-velvet rounded-xl px-4 py-2.5 font-body text-base text-mist placeholder-lilac/40 focus:outline-none focus:border-arcane transition-colors"
                      />
                    )}
                    <button
                      type="submit"
                      aria-label="Gửi"
                      className="shrink-0 w-12 h-12 rounded-full bg-candle-gold text-void hover:bg-candle-gold/85 active:scale-95 transition-all flex items-center justify-center"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </form>
                  {(pendingField.type === "text" || pendingField.type === "textarea") && (
                    <p className="font-body text-lilac/50 text-xs text-right mt-1">
                      {draft.length} / 1.000 ký tự
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Đổi món */}
          {started && !pendingField && !busy && (
            <div className="mt-3 text-center">
              <button
                onClick={backToServices}
                className="font-body text-lilac/70 text-sm underline underline-offset-4 hover:text-candle-gold min-h-[44px] px-4"
              >
                Xem món khác
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </main>
  );
}
