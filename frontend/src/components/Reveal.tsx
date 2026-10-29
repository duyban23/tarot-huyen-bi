import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type RevealProps = {
  className?: string;
  /** ms — stagger, matches the previous `transition.delay` */
  delay?: number;
  /** 0..1 — fraction of the section that must be visible before revealing */
  amount?: number;
  children: ReactNode;
};

/**
 * Fade-up-on-scroll reveal. Replaces `motion.section` whileInView wrappers —
 * same behaviour, ~41 kB gzip less on the critical path.
 */
export default function Reveal({
  className,
  delay = 0,
  amount = 0.3,
  children,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    // Reveal on FIRST visibility (threshold 0), not on `amount` fraction.
    // A single `threshold: amount` (e.g. 0.3) never fires on very tall
    // sections: the 17-card feedback grid is ~2700px+, so 30% of it can
    // never be on screen at once — the whole section stayed opacity:0
    // forever while its children had already revealed (blank area that
    // was still clickable into the lightbox). `amount` is kept for API
    // compatibility and still observed, but the 0-crossing guarantees
    // the reveal cannot get stuck.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: [0, amount] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [amount, shown]);

  return (
    <section
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(30px)",
        transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </section>
  );
}