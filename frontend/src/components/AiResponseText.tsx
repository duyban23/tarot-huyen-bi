import { useMemo } from "react";

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
 * Hiển thị câu trả lời của My: tách dòng, nhận heading `###`, bullet và bỏ các
 * dấu markdown thô (`**`, `*`, backtick) để khách không thấy ký tự kỹ thuật.
 * `reveal` = số ký tự đã hiện; bỏ trống thì hiện đủ ngay.
 */
export default function AiResponseText({
  text,
  reveal,
  className = "",
}: {
  text: string;
  reveal?: number;
  className?: string;
}) {
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
    const heading = /^(#{1,6})\s*(.*)$/.exec(t);
    const bullet = /^[-*•]\s+(.*)$/.exec(t);
    const isHeading = Boolean(heading && heading[2].length > 0);

    // Bỏ ký hiệu markdown còn sót để chữ hiện ra sạch, kể cả khi đang gõ dở.
    let body = heading ? heading[2] : bullet ? bullet[1] : t;
    body = body
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*\*/g, "")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^\*+|\*+$/g, "")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/`/g, "");

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
            : bullet
              ? "flex gap-2 font-body text-[15px] leading-relaxed text-mist/90"
              : "font-body text-[15px] leading-relaxed text-mist/90"
        }
      >
        {bullet && (
          <span aria-hidden className="mt-[2px] shrink-0 text-candle-gold/70">
            •
          </span>
        )}
        <span>
          {body}
          {caretHere && <Caret />}
        </span>
      </p>
    );
  }

  return <div className={`space-y-1.5 ${className}`}>{nodes}</div>;
}
