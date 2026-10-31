import { useEffect, useMemo, useRef, useState } from "react";
import {
  createAiFull,
  createAiReading,
  createPayment,
  getAiServices,
  getPaymentStatus,
} from "../api/client";
import type { AiField, AiReadingResult, AiService, PaymentOrder } from "../api/types";
import AstroWheel from "./AstroWheel";
import { Icon, type IconName } from "./icons";

/**
 * Xem nhanh ngay tại /services — không rời trang, không mở hội thoại.
 * Khách đa số dùng điện thoại nên: chọn món → điền 3–4 ô → kết quả hiện ngay
 * bên dưới → trả phí → bản đầy đủ cũng hiện ngay đó.
 *
 * Copy KHÔNG nhắc chữ "AI" (quy ước giọng văn của dự án — luôn gọi là "My").
 */

const MODES: Array<{ type: string; name: string; sub: string; icon: IconName }> = [
  { type: "ban-do-sao", name: "Bản đồ sao", sub: "Xem cho bạn", icon: "star" },
  { type: "ban-do-sao-doi", name: "Bản đồ sao đôi", sub: "Xem cho hai người", icon: "heart" },
];

const FREE_STEPS = [
  "My đang lấy lá số cho bạn…",
  "Đang đối chiếu các vì sao…",
  "My đang viết ra những gì nhìn thấy…",
  "Sắp xong rồi, chờ My thêm chút nhé…",
];

const FULL_STEPS = [
  "My đang viết bản đầy đủ…",
  "Đang chăm chút từng phần…",
  "Còn vài đoạn nữa thôi…",
  "Gần xong rồi, bạn đợi My nhé…",
];

type Phase = "form" | "reading" | "result" | "paying" | "pay" | "writing" | "full";

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : "Có lỗi xảy ra, bạn thử lại giúp My nhé.";

const isAbortError = (e: unknown) =>
  typeof DOMException !== "undefined" &&
  e instanceof DOMException &&
  e.name === "AbortError";

const SAVED_KEY = "hwm_quick_reading_v1";
const SAVED_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

type SavedReading = {
  version: 1;
  savedAt: number;
  mode: string;
  values: Record<string, string>;
  free: AiReadingResult;
  full: string;
  order: PaymentOrder | null;
  paid: boolean;
};

function loadSavedReading(): SavedReading | null {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedReading;
    if (saved.version !== 1 || !saved.free || !saved.mode) return null;
    if (Date.now() - saved.savedAt > SAVED_MAX_AGE) {
      localStorage.removeItem(SAVED_KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

function persistReading(saved: Omit<SavedReading, "version" | "savedAt">) {
  try {
    localStorage.setItem(
      SAVED_KEY,
      JSON.stringify({ ...saved, version: 1, savedAt: Date.now() })
    );
  } catch {
    /* localStorage đầy/bị chặn — không làm hỏng luồng xem */
  }
}

function clearSavedReading() {
  try {
    localStorage.removeItem(SAVED_KEY);
  } catch {
    /* ignore */
  }
}

/** Ghép payload đúng thứ tự field backend khai báo (checkbox → boolean như trang /cung-my). */
function buildInput(svc: AiService, vals: Record<string, string>) {
  const out: Record<string, unknown> = {};
  for (const f of svc.fields) {
    const v = (vals[f.key] ?? "").trim();
    out[f.key] = f.type === "checkbox" ? v === "on" : v;
  }
  return out;
}

/** Tách field của bản đồ sao đôi thành 2 nhóm "Bạn" / "Người ấy" (theo prefix a_/b_). */
function groupFields(svc: AiService): Array<{ title: string; fields: AiField[] }> {
  const prefixes = Array.from(new Set(svc.fields.map((f) => f.key.split("_")[0]))).filter(
    (p) => p === "a" || p === "b"
  );
  if (prefixes.length > 1) {
    return prefixes.map((p) => ({
      title: p === "a" ? "Bạn" : "Người ấy",
      fields: svc.fields.filter((f) => f.key.startsWith(`${p}_`)),
    }));
  }
  return [{ title: "", fields: svc.fields }];
}

/** Con trỏ nhấp nháy ở chỗ My đang viết. */
function Caret() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block w-[2px] translate-y-[2px] animate-pulse bg-candle-gold align-baseline"
      style={{ height: "1em" }}
    />
  );
}

/**
 * Chữ hiện dần như đang được viết: vào chữ hơi nhanh để khung sớm đầy, rồi
 * chậm dần ở cuối cho êm mắt.
 * `reveal` = số ký tự đã hiện; bỏ trống thì hiện đủ ngay.
 */
function RichText({ text, reveal }: { text: string; reveal?: number }) {
  const lines = useMemo(() => text.split("\n"), [text]);
  const limit = reveal ?? Number.POSITIVE_INFINITY;
  const typing = reveal !== undefined && reveal < text.length;

  let left = limit;
  let caretPlaced = false;
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (left <= 0 && caretPlaced) break;
    const raw = lines[i];
    const shown = raw.length > left ? raw.slice(0, Math.max(0, left)) : raw;
    left -= raw.length + 1;

    const t = shown.trim();
    // Dòng đang gõ dở vẫn có thể là "##" hoặc "**" → bỏ ký hiệu để không lộ markdown thô.
    const body = t.replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "");
    const isHeading = /^#{1,6}/.test(t) && body.length > 0;
    const caretHere = typing && left <= 0 && !caretPlaced;
    if (caretHere) caretPlaced = true;

    if (!body) {
      nodes.push(
        <div key={i} className="h-1.5">
          {caretHere && <Caret />}
        </div>
      );
      continue;
    }

    nodes.push(
      <p
        key={i}
        className={
          isHeading
            ? "pt-2 font-display text-[15px] leading-snug text-candle-gold"
            : "font-body text-[15px] leading-relaxed text-mist/90"
        }
      >
        {body}
        {caretHere && <Caret />}
      </p>
    );
  }

  return <div className="space-y-1.5">{nodes}</div>;
}

/**
 * Đếm ký tự dần bằng requestAnimationFrame (rAF dừng khi tab ẩn nên không tốn pin).
 * Tổng thời gian co theo độ dài: free ~2s, bản đầy đủ tối đa ~6s.
 */
function useTypewriter(text: string, enabled: boolean) {
  const [revealed, setRevealed] = useState(enabled ? 0 : text.length);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled || !text) {
      setRevealed(text.length);
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRevealed(text.length);
      return;
    }

    let done = false;
    let raf = 0;
    const total = text.length;
    const duration = Math.min(5600, Math.max(1400, total * 3.4));
    const start = performance.now();

    setRevealed(0);

    const tick = (now: number) => {
      if (done) return;
      const p = Math.min(1, (now - start) / duration);
      // Vào chữ hơi nhanh để khung không trống lâu, về cuối chậm lại cho êm mắt.
      const eased = 1 - Math.pow(1 - p, 1.7);
      setRevealed(Math.round(eased * total));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    skipRef.current = () => {
      done = true;
      cancelAnimationFrame(raf);
      setRevealed(total);
    };

    return () => {
      done = true;
      cancelAnimationFrame(raf);
    };
  }, [text, enabled]);

  return {
    revealed,
    typing: enabled && revealed < text.length,
    skip: () => skipRef.current(),
  };
}

/**
 * Khung đọc có chiều cao cố định: chữ chạy bên trong, khung không co giãn theo
 * từng câu nên cả trang đứng yên (mobile lẫn desktop). Thanh mảnh trên đầu là
 * tiến độ viết; chạm vào khung để hiện hết.
 */
function ReadingFrame({
  text,
  revealed,
  typing,
  onSkip,
  children,
}: {
  text: string;
  revealed: number;
  typing: boolean;
  onSkip: () => void;
  children: React.ReactNode;
}) {
  const progress = text.length === 0 ? 1 : Math.min(1, revealed / text.length);

  return (
    <div className="relative">
      <div className="mb-2 h-px w-full overflow-hidden bg-candle-gold/10">
        <div
          className="h-px bg-gradient-to-r from-candle-gold/40 to-candle-gold/85 transition-[width] duration-150 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <div
        onClick={typing ? onSkip : undefined}
        className="h-[48vh] max-h-[460px] min-h-[240px] overflow-y-auto pr-1 sm:h-[440px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-candle-gold/35 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-[3px]"
        style={{
          maskImage:
            "linear-gradient(to bottom, #000 0, #000 calc(100% - 26px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, #000 0, #000 calc(100% - 26px), transparent 100%)",
        }}
      >
        <div className="max-w-[70ch] pb-5">{children}</div>
      </div>
    </div>
  );
}

export default function QuickReading() {
  const [services, setServices] = useState<AiService[]>([]);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState(MODES[0].type);
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [free, setFree] = useState<AiReadingResult | null>(null);
  const [full, setFull] = useState("");
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [paid, setPaid] = useState(false);
  const [pending, setPending] = useState<{ type: string; input: Record<string, unknown> } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  const pollRef = useRef<number | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const fullRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hydratedRef = useRef(false);
  // Bài khôi phục từ localStorage hiện ngay, không chạy hiệu ứng gõ chữ lại.
  const instantRef = useRef(false);

  const svc = services.find((s) => s.type === mode) ?? null;
  const groups = useMemo(() => (svc ? groupFields(svc) : []), [svc]);

  // Chữ chạy dần khi câu trả lời vừa hiện ra.
  const freeTyping = useTypewriter(
    free?.basic_result ?? "",
    free !== null && !instantRef.current
  );
  const fullTyping = useTypewriter(full, full !== "" && !instantRef.current);

  useEffect(() => {
    let alive = true;
    getAiServices()
      .then((list) => {
        if (!alive) return;
        setServices(list);

        // Khôi phục bài đang xem sau khi reload. Chỉ nhận dịch vụ còn mở.
        const saved = loadSavedReading();
        if (!saved || !list.some((s) => s.type === saved.mode)) return;
        setMode(saved.mode);
        setValues(saved.values ?? {});
        setFree(saved.free);
        setFull(saved.full ?? "");
        setOrder(saved.order ?? null);
        setPaid(Boolean(saved.paid));
        instantRef.current = true;
        if (saved.full) {
          setPhase("full");
        } else if (saved.order && !saved.paid) {
          setPhase("pay");
          startPoll(saved.order.code, saved.mode, saved.values ?? {});
        } else {
          setPhase("result");
        }
      })
      .catch((e) => alive && setLoadError(errMsg(e)))
      .finally(() => {
        hydratedRef.current = true;
      });
    return () => {
      alive = false;
      abortRef.current?.abort();
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lưu bài gần nhất để reload không mất bản free/bản full đã trả phí.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (!free) {
      clearSavedReading();
      return;
    }
    persistReading({ mode, values, free, full, order, paid });
  }, [mode, values, free, full, order, paid]);

  // Câu "My đang..." đổi dần để khách biết máy vẫn đang chạy (Gemini ~25s).
  useEffect(() => {
    if (phase !== "reading" && phase !== "writing") return;
    setStepIdx(0);
    const id = window.setInterval(
      () => setStepIdx((i) => i + 1),
      phase === "reading" ? 6000 : 8000
    );
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "result") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (phase === "full") {
      // Bản đầy đủ nằm dưới bản miễn phí → cuộn thẳng tới đó, không để khách
      // tưởng "bấm xong không thấy gì".
      fullRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [phase]);

  function clearPoll() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function resetAll(clearValues = true) {
    clearPoll();
    abortRef.current?.abort();
    abortRef.current = null;
    clearSavedReading();
    setPhase("form");
    setFree(null);
    setFull("");
    setOrder(null);
    setPaid(false);
    setPending(null);
    setError("");
    setTouched(false);
    setCopied(false);
    if (clearValues) setValues({});
  }

  function chooseMode(type: string) {
    if (type === mode) return;
    resetAll();
    setMode(type);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!svc || phase !== "form") return;

    const missing = svc.fields.filter((f) => f.required && !(values[f.key] ?? "").trim());
    if (missing.length > 0) {
      setTouched(true);
      const el = document.getElementById(`qr-${missing[0].key}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLInputElement | null)?.focus?.();
      setError(`Bạn điền giúp My ${missing[0].label.toLowerCase()} nhé.`);
      return;
    }

    setError("");
    setPhase("reading");
    clearSavedReading();
    instantRef.current = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const r = await createAiReading(
        svc.type,
        buildInput(svc, values),
        controller.signal
      );
      setFree(r);
      setPhase("result");
    } catch (err) {
      if (isAbortError(err)) return;
      setError(errMsg(err));
      setPhase("form");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  async function handlePay() {
    if (!svc || !free || phase === "paying") return;
    const input = buildInput(svc, values);
    setError("");
    setPhase("paying");
    try {
      const created = await createPayment(svc.type, input);
      setOrder(created);
      setPending({ type: svc.type, input });
      setPhase("pay");
      startPoll(created.code, svc.type, input);
    } catch (err) {
      setError(errMsg(err));
      setPhase("result");
    }
  }

  function startPoll(code: string, type: string, input: Record<string, unknown>) {
    clearPoll();
    let tries = 0;
    pollRef.current = window.setInterval(async () => {
      tries += 1;
      try {
        const st = await getPaymentStatus(code);
        if (st.status === "paid") {
          clearPoll();
          setPaid(true);
          await fetchFull(code, type, input);
          return;
        }
        if (st.status === "failed") {
          clearPoll();
          setPhase("result");
          setOrder(null);
          setError("Giao dịch chưa thành công — bạn thử lại giúp My nhé.");
          return;
        }
      } catch {
        /* lỗi mạng lẻ: poll tiếp */
      }
      if (tries >= 100) {
        clearPoll();
        setPhase("result");
        setError(
          "My chưa thấy giao dịch — bạn kiểm tra lại nội dung chuyển khoản rồi thử lại nhé."
        );
      }
    }, 3000);
  }

  async function fetchFull(code: string, type: string, input: Record<string, unknown>) {
    setError("");
    setPhase("writing");
    instantRef.current = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const r = await createAiFull(type, input, code, controller.signal);
      setFull(r.full_result);
      setPhase("full");
    } catch (err) {
      if (isAbortError(err)) return;
      setError(errMsg(err));
      setPhase("pay");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  /** Viết lại bản full sau khi đã trả phí. Sau reload `pending` mất nên dựng
   *  lại input từ mode + values đã lưu. */
  function retryFull() {
    if (!order) return;
    if (pending) {
      fetchFull(order.code, pending.type, pending.input);
      return;
    }
    if (!svc) return;
    fetchFull(order.code, svc.type, buildInput(svc, values));
  }

  function cancelOrder() {
    clearPoll();
    setOrder(null);
    setPending(null);
    setPhase("result");
    setError("");
  }

  function copyCode() {
    if (!order) return;
    navigator.clipboard.writeText(order.transfer_content).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const steps = phase === "writing" ? FULL_STEPS : FREE_STEPS;
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const showForm = phase === "form" || phase === "reading";
  const showResult = free !== null && phase !== "reading";

  const inputCls =
    "w-full min-w-0 rounded-xl border bg-void px-3 py-2.5 font-body text-[15px] text-mist placeholder:text-lilac/40 focus:outline-none focus:border-candle-gold transition-colors";

  return (
    <div>
      {/* ── Chọn món: 2 ô cao bằng nhau, chữ căn giữa nên nhìn cân ── */}
      <div role="radiogroup" aria-label="Chọn kiểu xem" className="grid grid-cols-2 gap-2">
        {MODES.map((m) => {
          const active = m.type === mode;
          return (
            <button
              key={m.type}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={phase !== "form"}
              onClick={() => chooseMode(m.type)}
              className={`flex h-full min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-xl border-2 px-2 py-2.5 text-center transition-all active:scale-[0.99] disabled:cursor-default ${
                active
                  ? "border-candle-gold bg-candle-gold/15 shadow-[0_0_22px_-10px_rgba(212,168,67,0.9)]"
                  : "border-velvet/70 bg-void/40 hover:border-candle-gold/60"
              }`}
            >
              <span
                className={`flex items-center justify-center gap-1.5 font-body text-[14px] font-semibold leading-tight ${
                  active ? "text-candle-gold" : "text-mist"
                }`}
              >
                <Icon name={m.icon} className="h-4 w-4 shrink-0" />
                {m.name}
              </span>
              <span className="font-body text-[11px] leading-tight text-lilac/60">{m.sub}</span>
            </button>
          );
        })}
      </div>

      {/* ── Form điền tại chỗ ── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3.5" noValidate>
          <p className="mb-2.5 text-center font-body text-[12px] leading-relaxed text-lilac/70">
            {mode === "ban-do-sao-doi"
              ? "My cần thông tin của cả hai — mỗi người 3 điều."
              : "My cần 3 điều: tên, ngày sinh, nơi sinh. Giờ sinh không nhớ thì bỏ trống."}
          </p>

          {loadError && (
            <p className="mb-2 text-center font-body text-xs text-red-400 italic">
              {loadError}
            </p>
          )}

          {!svc && !loadError && (
            <div className="space-y-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-11 animate-pulse rounded-xl bg-velvet/40" />
              ))}
            </div>
          )}

          {groups.map((g) => (
            <div key={g.title || "one"} className={g.title ? "mt-3 first:mt-0" : ""}>
              {g.title && (
                <p className="mb-1.5 flex items-center gap-1.5 font-body text-[11px] font-semibold uppercase tracking-widest text-candle-gold/90">
                  <span aria-hidden>✦</span>
                  {g.title}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                {g.fields.map((f) => {
                  const id = `qr-${f.key}`;
                  const value = values[f.key] ?? "";
                  const invalid = touched && f.required && !value.trim();
                  const border = invalid ? "border-red-400/70" : "border-velvet";
                  const label = (
                    <label
                      htmlFor={id}
                      className="mb-1 block font-body text-[12px] leading-tight text-lilac/70"
                    >
                      {f.label}
                      {f.required && <span className="ml-0.5 text-candle-gold">*</span>}
                    </label>
                  );

                  if (f.type === "select") {
                    return (
                      <div key={f.key} className="col-span-2">
                        {label}
                        <select
                          id={id}
                          name={f.key}
                          value={value}
                          disabled={phase === "reading"}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [f.key]: e.target.value }))
                          }
                          className={`${inputCls} ${border} ${value ? "text-mist" : "text-lilac/50"}`}
                        >
                          <option value="">Chọn {f.label.toLowerCase()}</option>
                          {(f.options ?? []).map((o) => (
                            <option key={o} value={o} className="bg-void text-mist">
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (f.type === "checkbox") {
                    return (
                      <div key={f.key} className="col-span-2">
                        <label className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-velvet bg-void/60 px-3 py-2.5 font-body text-[13px] text-lilac">
                          <input
                            id={id}
                            type="checkbox"
                            checked={value === "on"}
                            disabled={phase === "reading"}
                            onChange={(e) =>
                              setValues((v) => ({
                                ...v,
                                [f.key]: e.target.checked ? "on" : "",
                              }))
                            }
                            className="h-4 w-4 accent-candle-gold"
                          />
                          {f.label}
                        </label>
                      </div>
                    );
                  }

                  const isDateOrTime = f.type === "date" || f.type === "time";
                  return (
                    <div
                      key={f.key}
                      className={
                        isDateOrTime
                          ? "col-span-2 min-w-0 min-[360px]:col-span-1"
                          : "col-span-2 min-w-0"
                      }
                    >
                      {label}
                      <input
                        id={id}
                        name={f.key}
                        type={f.type}
                        value={value}
                        disabled={phase === "reading"}
                        placeholder={f.type === "text" ? (f.placeholder ?? f.label) : undefined}
                        autoComplete={f.type === "text" ? "off" : undefined}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        className={`${inputCls} ${border} min-h-[44px]`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={!svc || phase === "reading"}
            className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-candle-gold px-5 py-3 font-display text-sm tracking-widest uppercase text-void shadow-lg shadow-candle-gold/25 transition-all hover:bg-candle-gold/90 active:scale-[0.99] disabled:opacity-60"
          >
            <Icon name="sparkles" className="h-4 w-4" />
            {mode === "ban-do-sao-doi" ? "Xem miễn phí cho hai người" : "Xem miễn phí cho tôi"}          </button>

          <p className="mt-2 text-center font-body text-[11px] leading-relaxed text-lilac/50">
            Miễn phí · không cần đăng ký · chỉ My xem, không hiển thị công khai
          </p>

          {error && (
            <p role="alert" className="mt-2 text-center font-body text-[13px] italic text-red-400">
              {error}
            </p>
          )}
        </form>
      )}

      {/* ── Đang xem ── */}
      {phase === "reading" && (
        <div
          className="mt-4 rounded-2xl border border-candle-gold/30 bg-void/40 px-4 py-6 text-center"
          aria-live="polite"
        >
          <AstroWheel className="mx-auto h-14 w-14 animate-[spin_18s_linear_infinite] text-candle-gold/60" />
          <p className="mt-3 font-body text-sm text-mist">{step}</p>
          <p className="mt-1 font-body text-[11px] text-lilac/50">
            Khoảng 20–30 giây — bạn cứ để trang mở nhé.
          </p>
        </div>
      )}

      {/* ── Kết quả miễn phí, hiện ngay tại chỗ ── */}
      {showResult && free && (
        <section
          ref={resultRef}
          className="mt-4 scroll-mt-24 rounded-2xl border border-candle-gold/40 bg-void/55 p-4"
        >
          {/* Chữ chạy mỗi khung hình → không để trình đọc màn hình đọc lại liên tục;
              chỉ báo 1 lần khi My viết xong. */}
          <p role="status" className="sr-only">
            {freeTyping.typing ? "My đang viết câu trả lời." : "My đã viết xong câu trả lời."}
          </p>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-body text-[11px] tracking-widest uppercase text-candle-gold">
              ✦ My nhắn cho bạn ✦
            </p>
            {freeTyping.typing ? (
              <button
                type="button"
                onClick={freeTyping.skip}
                className="-my-1.5 min-h-[36px] px-2 font-body text-[11.5px] text-candle-gold/80 underline underline-offset-2 hover:text-candle-gold"
              >
                Hiện hết
              </button>
            ) : (
              <button
                type="button"
                onClick={() => resetAll(false)}
                className="-my-1.5 min-h-[36px] px-2 font-body text-[11.5px] text-lilac/55 underline underline-offset-2 hover:text-candle-gold"
              >
                Xem lại
              </button>
            )}
          </div>

          <ReadingFrame
            text={free.basic_result}
            revealed={freeTyping.revealed}
            typing={freeTyping.typing}
            onSkip={freeTyping.skip}
          >
            <RichText text={free.basic_result} reveal={freeTyping.revealed} />
          </ReadingFrame>

          {/* ── Bản đầy đủ ── */}
          {phase !== "full" && (
            <div className="mt-4 rounded-xl border border-candle-gold/35 bg-candle-gold/5 p-3.5">
              {!order && (
                <>
                  <p className="font-body text-[14px] font-semibold text-mist">
                    Muốn đi sâu hơn?
                  </p>
                  <p className="mt-1 font-body text-[12.5px] leading-relaxed text-lilac/75">
                    Bản đầy đủ đi sâu vào chân dung, tình yêu, công việc, điểm mạnh – điểm yếu và
                    lời khuyên dành riêng cho bạn.
                  </p>
                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={phase === "paying"}
                    className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-candle-gold/70 bg-candle-gold/15 px-4 py-2.5 font-body text-[13.5px] font-semibold text-candle-gold transition-all hover:bg-candle-gold/25 active:scale-[0.99] disabled:opacity-60"
                  >
                    {phase === "paying" ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-candle-gold/30 border-t-candle-gold" />
                        My đang mở đơn…
                      </>
                    ) : (
                      <>
                        Mở bản đầy đủ · {svc?.price_full.toLocaleString("vi-VN")}₫
                        <span aria-hidden>→</span>
                      </>
                    )}
                  </button>
                  <p className="mt-1.5 text-center font-body text-[11px] text-lilac/45">
                    Chưa cần ngay — bản miễn phí ở trên vẫn giữ nguyên.
                  </p>
                </>
              )}

              {/* Chưa chuyển khoản: QR tại chỗ */}
              {order && !paid && (
                <div className="text-center">
                  <p className="font-body text-[12px] text-lilac/70">
                    Quét mã để nhận bản đầy đủ
                  </p>
                  <img
                    src={order.qr_url}
                    alt="Mã QR chuyển khoản"
                    width={208}
                    height={208}
                    loading="lazy"
                    className="mx-auto my-2 h-44 w-44 rounded-xl bg-white p-2"
                  />
                  <p className="font-display text-lg font-bold text-candle-gold">
                    {order.amount.toLocaleString("vi-VN")}₫
                  </p>
                  <p className="font-body text-[11px] leading-relaxed text-lilac/60">
                    {order.bank} · {order.account} · {order.account_name}
                  </p>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="mt-2 min-h-[40px] rounded-lg border border-candle-gold/50 px-3 py-1.5 font-body text-[12px] text-mist transition-all hover:bg-candle-gold/10 active:scale-[0.98]"
                  >
                    {copied ? "Đã chép ✓" : `Chép nội dung: ${order.transfer_content}`}
                  </button>
                  <p className="mt-2 animate-pulse font-body text-[11px] italic text-lilac/60">
                    Đang chờ bạn chuyển khoản…
                  </p>
                  {error && (
                    <p className="mt-1.5 font-body text-[12px] italic text-red-400">{error}</p>
                  )}
                  <button
                    type="button"
                    onClick={cancelOrder}
                    className="mt-1 min-h-[36px] px-3 font-body text-[11.5px] text-lilac/55 underline underline-offset-2 hover:text-candle-gold"
                  >
                    Để sau, xem bản miễn phí
                  </button>
                </div>
              )}

              {/* Đã trả phí: chờ My viết bản đầy đủ */}
              {order && paid && (
                <div className="py-1 text-center" aria-live="polite">
                  {phase === "writing" ? (
                    <>
                      <span className="mx-auto flex h-7 w-7 animate-spin rounded-full border-2 border-candle-gold/30 border-t-candle-gold" />
                      <p className="mt-2 font-body text-[13px] text-mist">{step}</p>
                      <p className="mt-0.5 font-body text-[11px] text-lilac/50">
                        Đã nhận phí trà · {order.code}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-body text-[13px] text-candle-gold">
                        ✦ Đã nhận phí trà · {order.code}
                      </p>
                      {error && (
                        <p className="mt-1 font-body text-[12px] italic text-red-400">{error}</p>
                      )}
                      <button
                        type="button"
                        onClick={retryFull}
                        disabled={!pending && !svc}
                        className="mt-2 min-h-[40px] rounded-xl border border-candle-gold/60 px-4 py-1.5 font-body text-[12.5px] text-candle-gold hover:bg-candle-gold/10 disabled:opacity-60"
                      >
                        Thử lại
                      </button>
                    </>
                  )}
                </div>
              )}

              {error && !order && (
                <p className="mt-2 text-center font-body text-[12px] italic text-red-400">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* ── Bản đầy đủ đã có ── */}
          {phase === "full" && full && (
            <div
              ref={fullRef}
              className="mt-4 scroll-mt-24 rounded-xl border border-candle-gold/40 bg-arcane/10 p-3.5"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-body text-[11px] tracking-widest uppercase text-candle-gold">
                  ✦ Bản đầy đủ của bạn ✦
                </p>
                {fullTyping.typing && (
                  <button
                    type="button"
                    onClick={fullTyping.skip}
                    className="-my-1.5 min-h-[36px] px-2 font-body text-[11.5px] text-candle-gold/80 underline underline-offset-2 hover:text-candle-gold"
                  >
                    Hiện hết
                  </button>
                )}
              </div>
              <ReadingFrame
                text={full}
                revealed={fullTyping.revealed}
                typing={fullTyping.typing}
                onSkip={fullTyping.skip}
              >
                <RichText text={full} reveal={fullTyping.revealed} />
              </ReadingFrame>
              <button
                type="button"
                onClick={() => resetAll()}
                className="mt-4 min-h-[44px] w-full rounded-xl border border-candle-gold/60 px-4 py-2 font-body text-[13px] text-candle-gold transition-all hover:bg-candle-gold/10 active:scale-[0.99]"
              >
                Xem món khác
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
