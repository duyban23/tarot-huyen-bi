import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  confirmDemoPayment,
  createAiFull,
  createAiReading,
  createPayment,
  getAiConfig,
  getAiServices,
  getPaymentStatus,
} from "../api/client";
import type { AiField, AiReadingResult, AiService, PaymentOrder } from "../api/types";
import AstroWheel from "./AstroWheel";
import AiResponseText from "./AiResponseText";
import DemoQr from "./DemoQr";
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

/** Giây đếm ngược giả lập xác nhận thanh toán demo. */
const DEMO_CONFIRM_SECONDS = 3;

type Phase = "form" | "reading" | "result" | "paying" | "pay" | "writing" | "full";

const errMsg = (e: unknown) => {
  const raw = e instanceof Error ? e.message : "";
  if (/internal server error/i.test(raw)) {
    return "My đang bận một chút — bạn thử lại giúp My nhé.";
  }
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) {
    return "Kết nối đang chập chờn — bạn kiểm tra mạng rồi thử lại nhé.";
  }
  return raw || "Có lỗi xảy ra, bạn thử lại giúp My nhé.";
};

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
 * Khung đọc kiểu "ô chat": cao cố định, chữ tự chạy ra và tự cuộn theo, có thanh
 * cuộn để khách kéo lên/xuống đọc lại. Bản đầy đủ có thể bấm "Mở rộng" để bỏ
 * giới hạn chiều cao khi muốn đọc trọn một mạch.
 */
function ReadingFrame({
  text,
  revealed,
  typing,
  onSkip,
  size = "free",
  expanded = false,
  children,
}: {
  text: string;
  revealed: number;
  typing: boolean;
  onSkip: () => void;
  size?: "free" | "full";
  expanded?: boolean;
  children: React.ReactNode;
}) {
  const progress = text.length === 0 ? 1 : Math.min(1, revealed / text.length);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  // Khách đang ở cuối khung → chữ mới hiện ra thì tự cuộn theo. Khách kéo lên
  // đọc lại thì dừng tự cuộn để không bị giật về cuối.
  const followRef = useRef(true);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    followRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
  }, []);

  // Chữ hiện dần làm nội dung cao lên; theo dõi khối chữ để cập nhật trạng thái.
  useEffect(() => {
    const el = contentRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    measure();
  }, [measure, expanded]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // Bài mới → về đầu khung và bật lại chế độ tự cuộn.
  useEffect(() => {
    followRef.current = true;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [text]);

  // Đang chạy chữ: giữ dòng mới nhất trong tầm mắt như khung chat.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !typing || !followRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [revealed, typing]);

  const cappedHeight =
    size === "full"
      ? "h-[55vh] sm:h-[500px]"
      : "h-[45vh] max-h-[380px] min-h-[240px]";

  return (
    <div className="relative">
      <div className="mb-2 h-px w-full overflow-hidden bg-candle-gold/10">
        <div
          className="h-px bg-gradient-to-r from-candle-gold/40 to-candle-gold/85 transition-[width] duration-150 ease-out"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <div
        ref={scrollRef}
        onClick={typing ? onSkip : undefined}
        onScroll={measure}
        className={`${
          expanded
            ? "p-3"
            : `${cappedHeight} overflow-y-auto p-3 [scrollbar-color:rgba(212,168,67,0.45)_rgba(255,255,255,0.04)] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-candle-gold/45 hover:[&::-webkit-scrollbar-thumb]:bg-candle-gold/65 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar]:w-2`
        } relative rounded-xl border border-candle-gold/20 bg-void/45 [overflow-wrap:anywhere] transition-colors`}
      >
        <div ref={contentRef} className="mx-auto max-w-[70ch]">
          {children}
        </div>
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
  const [reloadKey, setReloadKey] = useState(0);
  const [demoPaying, setDemoPaying] = useState(false);
  const [demoSeconds, setDemoSeconds] = useState(0);
  const [fullExpanded, setFullExpanded] = useState(false);
  // Backend đang mở bản đầy đủ cho mọi người xem thử (không cần thanh toán).
  const [fullDemoOpen, setFullDemoOpen] = useState(false);

  const pollRef = useRef<number | null>(null);
  const demoTimerRef = useRef<number | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
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
    setLoadError("");
    getAiConfig()
      .then((cfg) => alive && setFullDemoOpen(Boolean(cfg.full_demo_open)))
      .catch(() => {
        // Cấu hình không lấy được thì giữ luồng thanh toán như cũ.
      });
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
          // Đơn demo không có webhook — chờ khách bấm xác nhận, đừng poll vô ích.
          if (!saved.order.demo) {
            startPoll(saved.order.code, saved.mode, saved.values ?? {});
          }
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
      if (demoTimerRef.current) window.clearInterval(demoTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

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
    if (phase === "full" || phase === "writing") {
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

  function clearDemoTimer() {
    if (demoTimerRef.current) {
      window.clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  }

  function resetAll(clearValues = true) {
    clearPoll();
    clearDemoTimer();
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
    setDemoPaying(false);
    setDemoSeconds(0);
    setFullExpanded(false);
    if (clearValues) setValues({});
    // Kết quả biến mất làm trang ngắn lại — đưa khách về đúng chỗ điền thông tin.
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function retryLoad() {
    setLoadError("");
    setServices([]);
    setReloadKey((k) => k + 1);
  }

  function chooseMode(type: string) {
    if (type === mode) return;
    resetAll();
    setMode(type);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!svc || !canEditForm) return;

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
    // Xem lại từ đầu: bỏ kết quả/đơn cũ, giữ nguyên form và dữ liệu đã điền.
    if (phase !== "form") {
      setFree(null);
      setFull("");
      setOrder(null);
      setPaid(false);
      setPending(null);
      setFullExpanded(false);
    }
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
      // Đơn demo chờ khách bấm xác nhận; đơn thật mới poll SePay.
      if (!created.demo) {
        startPoll(created.code, svc.type, input);
      }
    } catch (err) {
      setError(errMsg(err));
      setPhase("result");
    }
  }

  function handleDemoConfirm() {
    if (!order?.demo || demoPaying || phase !== "pay") return;
    const currentOrder = order;
    setError("");
    setDemoPaying(true);
    setDemoSeconds(DEMO_CONFIRM_SECONDS);
    clearDemoTimer();
    let left = DEMO_CONFIRM_SECONDS;
    demoTimerRef.current = window.setInterval(() => {
      left -= 1;
      setDemoSeconds(Math.max(left, 0));
      if (left > 0) return;
      clearDemoTimer();
      void finishDemoConfirm(currentOrder);
    }, 1000);
  }

  async function finishDemoConfirm(currentOrder: PaymentOrder) {
    const type = pending?.type ?? svc?.type;
    const input = pending?.input ?? (svc ? buildInput(svc, values) : null);
    if (!type || !input) {
      setError("Không tìm thấy thông tin bài xem — bạn tạo lại giúp My nhé.");
      setDemoPaying(false);
      return;
    }
    try {
      await confirmDemoPayment(currentOrder.code);
      setPaid(true);
      await fetchFull(currentOrder.code, type, input);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setDemoPaying(false);
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

  async function fetchFull(
    code: string | null,
    type: string,
    input: Record<string, unknown>
  ) {
    setError("");
    setPhase("writing");
    instantRef.current = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const r = await createAiFull(type, input, code ?? "", controller.signal);
      setFull(r.full_result);
      setFullExpanded(false);
      setPhase("full");
    } catch (err) {
      if (isAbortError(err)) return;
      setError(errMsg(err));
      // Có mã đơn → quay lại hộp chờ thanh toán; xem thử thì về kết quả free.
      setPhase(code ? "pay" : "result");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  /** Xem thử bản đầy đủ: không tạo đơn, backend tự chặn quota theo IP. */
  async function handleDemoFull() {
    if (!svc || !free) return;
    const input = buildInput(svc, values);
    setPending({ type: svc.type, input });
    await fetchFull(null, svc.type, input);
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
    clearDemoTimer();
    setDemoPaying(false);
    setDemoSeconds(0);
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

  function toggleFullExpanded() {
    const next = !fullExpanded;
    setFullExpanded(next);
    if (!next) {
      // Thu gọn xong khung ngắn lại — kéo về đầu khung để không bị lạc chỗ.
      window.setTimeout(() => {
        fullRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }

  const steps = phase === "writing" ? FULL_STEPS : FREE_STEPS;
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  // Form luôn hiển thị; chỉ khoá khi đang xử lý/thanh toán để tránh đổi dữ liệu giữa chừng.
  const canEditForm = phase === "form" || phase === "result" || phase === "full";
  const showResult = free !== null && phase !== "reading";

  const inputCls =
    "w-full min-w-0 rounded-xl border bg-void px-3 py-2.5 font-body text-[15px] text-mist placeholder:text-lilac/40 focus:outline-none focus:border-candle-gold transition-colors";

  // Mất kết nối / backend lỗi: đừng để form trống + chữ "Internal Server Error".
  if (loadError && services.length === 0) {
    return (
      <div
        role="alert"
        className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-candle-gold/20 bg-void/40 px-6 py-10 text-center"
      >
        <AstroWheel className="h-12 w-12 text-candle-gold/40" />
        <p className="mt-3 font-display text-lg text-mist">Chưa kết nối được</p>
        <p className="mt-1 max-w-xs font-body text-sm leading-relaxed text-lilac/70">
          {loadError}
        </p>
        <button
          type="button"
          onClick={retryLoad}
          className="mt-4 min-h-[44px] rounded-xl border border-candle-gold/60 px-5 py-2 font-body text-sm text-candle-gold transition-colors hover:bg-candle-gold/10"
        >
          Thử lại
        </button>
        <p className="mt-3 max-w-[16rem] font-body text-[11px] leading-relaxed text-lilac/45">
          Bạn vẫn xem bảng giá và đặt lịch ở phía trên nhé.
        </p>
      </div>
    );
  }

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

      {/* ── Form điền tại chỗ: giữ nguyên khi câu trả lời xuất hiện ── */}
      <form ref={formRef} onSubmit={handleSubmit} className="mt-3.5 scroll-mt-24" noValidate>
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
                          disabled={!canEditForm}
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
                            disabled={!canEditForm}
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
                        disabled={!canEditForm}
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
            disabled={!svc || !canEditForm}
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
              My nhắn cho bạn
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
            <AiResponseText text={free.basic_result} reveal={freeTyping.revealed} />
          </ReadingFrame>

          {/* ── Bản đầy đủ ── */}
          {phase !== "full" && phase !== "writing" && (
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
                    onClick={fullDemoOpen ? handleDemoFull : handlePay}
                    disabled={phase === "paying"}
                    className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-candle-gold/70 bg-candle-gold/15 px-4 py-2.5 font-body text-[13.5px] font-semibold text-candle-gold transition-all hover:bg-candle-gold/25 active:scale-[0.99] disabled:opacity-60"
                  >
                    {phase === "paying" ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-candle-gold/30 border-t-candle-gold" />
                        My đang mở đơn…
                      </>
                    ) : fullDemoOpen ? (
                      <>
                        Xem bản đầy đủ · miễn phí thử nghiệm
                        <span aria-hidden>→</span>
                      </>
                    ) : (
                      <>
                        Mở bản đầy đủ · {svc?.price_full.toLocaleString("vi-VN")}₫
                        <span aria-hidden>→</span>
                      </>
                    )}
                  </button>
                  <p className="mt-1.5 text-center font-body text-[11px] text-lilac/45">
                    {fullDemoOpen
                      ? "Đang mở thử nghiệm — không cần thanh toán, mỗi người vài lượt mỗi ngày."
                      : "Chưa cần ngay — bản miễn phí ở trên vẫn giữ nguyên."}
                  </p>
                </>
              )}

              {/* Chưa thanh toán: QR thật hoặc thẻ demo */}
              {order && !paid && (
                <div className="text-center">
                  {order.demo ? (
                    <>
                      <p className="font-body text-[12px] font-semibold text-candle-gold">
                        Thanh toán thử nghiệm
                      </p>
                      <p className="mt-1 font-body text-[11.5px] leading-relaxed text-lilac/65">
                        Không trừ tiền thật. Bấm xác nhận để đi tiếp đúng luồng
                        thanh toán.
                      </p>
                      <DemoQr className="my-3 h-40 w-40" />
                      <p className="font-display text-lg font-bold text-candle-gold">
                        {order.amount.toLocaleString("vi-VN")}₫
                      </p>
                      <p className="font-body text-[11px] text-lilac/55">
                        Mã đơn: {order.code}
                      </p>
                      {demoPaying ? (
                        <div
                          className="mt-3 flex min-h-[46px] flex-col items-center justify-center rounded-xl border border-candle-gold/40 bg-void/40 px-4 py-2"
                          aria-live="polite"
                        >
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-candle-gold/30 border-t-candle-gold" />
                          <p className="mt-1.5 font-body text-[12px] text-mist">
                            {demoSeconds > 0
                              ? `Đang xác nhận giao dịch… ${demoSeconds}s`
                              : "Đang xác nhận giao dịch…"}
                          </p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleDemoConfirm}
                          className="mt-3 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-candle-gold px-4 py-2.5 font-display text-[12px] font-semibold uppercase tracking-widest text-void transition-all hover:bg-candle-gold/90 active:scale-[0.99]"
                        >
                          Xác nhận thanh toán demo
                        </button>
                      )}
                      <p className="mt-2 font-body text-[11px] italic text-lilac/55">
                        Đây là bản thử nghiệm — không phát sinh giao dịch thật.
                      </p>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}

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

              {/* Đã trả phí nhưng chưa viết xong: chỉ còn lỗi / nút thử lại.
                  Trạng thái đang viết hiển thị trong thẻ "Bản đầy đủ" bên dưới. */}
              {order && paid && (
                <div className="py-1 text-center" aria-live="polite">
                  <p className="font-body text-[13px] text-candle-gold">
                    Đã nhận phí trà · {order.code}
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
                </div>
              )}

              {error && !order && (
                <p className="mt-2 text-center font-body text-[12px] italic text-red-400">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* ── Bản đầy đủ: chờ viết xong tại chỗ rồi hiện luôn nội dung ── */}
          {(phase === "writing" || (phase === "full" && full)) && (
            <div
              ref={fullRef}
              className="mt-4 scroll-mt-24 overflow-hidden rounded-2xl border border-candle-gold/40 bg-gradient-to-br from-arcane/20 via-void/35 to-velvet/20 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 font-body text-[11px] uppercase tracking-widest text-candle-gold">
                  <Icon name="sparkles" className="h-3.5 w-3.5" />
                  Bản đầy đủ của bạn
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

              {phase === "writing" ? (
                <div className="py-6 text-center" aria-live="polite">
                  <span className="mx-auto flex h-7 w-7 animate-spin rounded-full border-2 border-candle-gold/30 border-t-candle-gold" />
                  <p className="mt-2 font-body text-[13px] text-mist">{step}</p>
                  <p className="mt-0.5 font-body text-[11px] text-lilac/50">
                    {order ? `Đã nhận phí trà · ${order.code}` : "Bản xem thử miễn phí"}
                  </p>
                </div>
              ) : (
                <>
                  <ReadingFrame
                    text={full}
                    revealed={fullTyping.revealed}
                    typing={fullTyping.typing}
                    onSkip={fullTyping.skip}
                    size="full"
                    expanded={fullExpanded}
                  >
                    <AiResponseText text={full} reveal={fullTyping.revealed} />
                  </ReadingFrame>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={toggleFullExpanded}
                      aria-expanded={fullExpanded}
                      className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-candle-gold/45 bg-candle-gold/10 px-3 py-2 font-body text-[12.5px] font-medium text-candle-gold transition-colors hover:bg-candle-gold/20 active:scale-[0.99]"
                    >
                      {fullExpanded ? "Thu gọn" : "Mở rộng"}
                      <span
                        aria-hidden
                        className={`text-[10px] transition-transform duration-200 ${
                          fullExpanded ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => resetAll()}
                      className="min-h-[42px] rounded-xl border border-velvet/70 px-3 py-2 font-body text-[12.5px] text-lilac/85 transition-colors hover:border-candle-gold/40 hover:text-candle-gold active:scale-[0.99]"
                    >
                      Xem món khác
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
