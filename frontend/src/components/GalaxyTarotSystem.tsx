"use client";
import { useEffect, useMemo, useRef, useState } from "react";

interface TarotCard {
  id: string;
  name: string;
  nameVi: string;
  img: string;
  arcana: string;
  suit: string | null;
  meaning: string;
}

interface Rider {
  card: TarotCard;
  arm: number; // which spiral arm (round-robin)
  off: number; // journey offset [0,1)
  tilt: number; // fixed slight tilt, cards stay upright
  sizeJ: number; // size jitter
  wob: number; // wobble phase
}

/* Hệ số thu gọn hiệu ứng hero: 0.5 = card nhỏ bằng một nửa (desktop) */
const EFFECT_SCALE = 0.5;
/* Mobile: màn hẹp, card ở cỡ 0.5 chỉ ~27px nhìn như hạt bụi → để to hơn chút */
const MOBILE_SCALE = 0.66;

/* deterministic rng so SSR/first-frame matches */
function mulberry(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function GalaxyTarotSystem({
  count = 18,
  cardData,
}: {
  count?: number;
  cardData?: TarotCard[];
  starCount?: number; // kept for prop compat, unused in 2D mode
}) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const anim = useRef({ journey: 0, scrollY: 0, mx: 0, my: 0, fx: 0, fy: 0, t0: 0, hover: -1, zooms: [] as number[] });

  /* pick cards once */
  useEffect(() => {
    const deal = (pool: TarotCard[]) => {
      const mobile = window.innerWidth < 768;
      const n = mobile ? Math.min(7, count) : count;
      const arms = mobile ? 3 : 6;
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const rng = mulberry(42);
      // even slots per arm (ArtCraft-style track-gap): k-th card on an arm
      // sits at slot k, arms staggered by golden ratio so rings never align
      const perArm = Math.ceil(n / arms);
      const taken = new Array(arms).fill(0);
      setRiders(
        Array.from({ length: Math.min(n, shuffled.length) }, (_, i) => {
          const arm = i % arms;
          const k = taken[arm]++;
          return {
            card: shuffled[i % shuffled.length],
            arm,
            off: ((k + arm * 0.61803398875) / perArm) % 1,
            tilt: (rng() - 0.5) * 12,
            sizeJ: 0.8 + rng() * 0.45,
            wob: rng() * Math.PI * 2,
          };
        })
      );
    };
    if (cardData?.length) deal(cardData);
    else
      fetch("/data/tarot-cards.json")
        .then((r) => r.json())
        .then(deal)
        .catch(() => {});
  }, [count, cardData]);

  /* faint spiral guides + stars, drawn once per resize */
  useEffect(() => {
    const cv = canvasRef.current;
    const field = fieldRef.current;
    if (!cv || !field) return;
    const draw = () => {
      const w = field.clientWidth;
      const h = field.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = w * dpr;
      cv.height = h * dpr;
      const ctx = cv.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      const mobile = w < 768;
      const arms = mobile ? 3 : 6;
      const turns = mobile ? 0.7 : 1.05;
      const halfDiag = Math.hypot(w, h) / 2;
      const rMax = halfDiag * 0.7;
      const cx = w / 2;
      const cy = h / 2;
      const rng = mulberry(7);
      // arm guides
      ctx.lineWidth = 1;
      for (let a = 0; a < arms; a++) {
        ctx.strokeStyle = "rgba(212,168,67,0.07)";
        ctx.beginPath();
        for (let s = 0; s <= 60; s++) {
          const p = s / 60;
          const ang = (a / arms) * Math.PI * 2 + p * turns * Math.PI * 2;
          const r = rMax * 0.08 + p * (rMax * 1.1 - rMax * 0.08);
          const x = cx + Math.cos(ang) * r;
          const y = cy + Math.sin(ang) * r;
          s === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // construction circle
      ctx.strokeStyle = "rgba(184,132,159,0.08)";
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, rMax * 0.56, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // stars clustered near arms
      for (let i = 0; i < 420; i++) {
        const a = Math.floor(rng() * arms);
        const p = Math.pow(rng(), 0.7);
        const ang = (a / arms) * Math.PI * 2 + p * turns * Math.PI * 2 + (rng() - 0.5) * 0.35;
        const r = rMax * 0.08 + p * rMax * 1.15 + (rng() - 0.5) * 30;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        const tw = rng();
        ctx.fillStyle =
          tw > 0.9 ? "rgba(255,246,221,0.9)" : tw > 0.6 ? "rgba(232,196,106,0.55)" : "rgba(219,181,204,0.4)";
        const s = tw > 0.9 ? 1.8 : 1.1;
        ctx.fillRect(x, y, s, s);
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(field);
    return () => ro.disconnect();
  }, []);

  /* the conveyor: single rAF loop, transform-only writes */
  useEffect(() => {
    if (!riders.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const A = anim.current;
    A.t0 = performance.now();
    A.scrollY = window.scrollY;

    const onScroll = () => {
      A.scrollY = window.scrollY;
    };
    const onMouse = (e: MouseEvent) => {
      A.mx = (e.clientX / window.innerWidth) * 2 - 1;
      A.my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });

    const IDLE = 0.57 / 60; // journeys/sec (ArtCraft: 0.57 journeys/min)
    const spinRs = (-50 * Math.PI) / 180 / 60; // whole-system rotation, -50°/min
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const el = now - A.t0;
      const field = fieldRef.current;
      if (!field) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const w = field.clientWidth;
      const h = field.clientHeight;
      const mobile = w < 768;
      const arms = mobile ? 3 : 6;
      const turns = mobile ? 0.7 : 1.05;
      const halfDiag = Math.hypot(w, h) / 2;
      const rMax = halfDiag * 0.7;
      const birth = rMax * 0.08;
      const cx = w / 2;
      const cy = h / 2;
      const burst = 1 + 2 * Math.exp(-el / 1000 / 2.5); // intro burst ×3 → 1
      if (!reduced) A.journey += dt * IDLE * burst;
      const sysRot = reduced ? 0 : spinRs * (el / 1000);
      const scrub = reduced ? 0 : (A.scrollY * 0.2) / 1000; // journeys per 1000px, reversible
      // mouse parallax, lerped
      const k = 1 - Math.exp(-3 * dt);
      A.fx += ((reduced ? 0 : A.mx * 14) - A.fx) * k;
      A.fy += ((reduced ? 0 : A.my * 10) - A.fy) * k;
      const baseH = Math.max(64, Math.min(Math.min(w, h) * 0.16, h * 0.22));
      // track-gap cap: a card can never be taller than 80% of the radial
      // distance to its next same-arm neighbour → no stacking.
      // Tính theo số card BẢN GỐC (36 desktop · 14 mobile) để việc giảm số
      // card không làm card to lên (nếu không, bớt card = trần nới ra).
      const perArmOrig = mobile ? 5 : 6;
      const gapCap = ((rMax * 1.12 - birth) / perArmOrig) * 0.8;
      // keep hero copy readable: exclusion ellipse over the centered text block
      const exX = Math.min(w * 0.4, 380);
      const exY = Math.min(h * 0.3, 300);
      const sizeScale = mobile ? MOBILE_SCALE : EFFECT_SCALE;

      for (let i = 0; i < riders.length; i++) {
        const R = riders[i];
        const node = cardEls.current[i];
        if (!node) continue;
        const p = (((R.off + A.journey + scrub) % 1) + 1) % 1;
        const ang = (R.arm / arms) * Math.PI * 2 + sysRot + p * turns * Math.PI * 2;
        const r = birth + p * (rMax * 1.12 - birth);
        const wobx = Math.sin((el / 1000) * (Math.PI * 2 * 0.25) + R.wob) * 6;
        const woby = Math.cos((el / 1000) * (Math.PI * 2 * 0.25) + R.wob * 1.7) * 6;
        const x = cx + Math.cos(ang) * r + wobx + A.fx * (0.4 + p * 0.8);
        const y = cy + Math.sin(ang) * r + woby + A.fy * (0.4 + p * 0.8);
        const grow = 0.3 + 0.7 * smooth(0, 0.35, p);
        const shrink = 1 - 0.45 * smooth(0.85, 1, p);
        if (!A.zooms || A.zooms.length !== riders.length) A.zooms = riders.map(() => 1);
        const zTarget = i === A.hover ? 1.6 : 1; // hovered card pops up
        A.zooms[i] += (zTarget - A.zooms[i]) * (1 - Math.exp(-10 * dt));
        const cardH =
          Math.min(baseH * R.sizeJ * grow * shrink * A.zooms[i], gapCap * A.zooms[i]) *
          sizeScale;
        const cardW = cardH * (7 / 12);
        const alpha =
          smooth(0, 0.1, p) *
          (1 - smooth(0.88, 1, p)) *
          smooth(0.85, 1.2, Math.hypot((x - cx) / exX, (y - cy) / exY));
        // Giữ lá bài nằm trọn trong khung: trên điện thoại màn hẹp nên hay bị
        // cắt cụt ở mép trái/phải, nhìn rất luộm thuộm.
        let px = x;
        let py = y;
        if (mobile) {
          const mx = cardW / 2 + 6;
          const my = cardH / 2 + 6;
          px = Math.min(Math.max(px, mx), w - mx);
          py = Math.min(Math.max(py, my), h - my);
        }
        node.style.transform = `translate3d(${(px - cardW / 2).toFixed(1)}px,${(py - cardH / 2).toFixed(1)}px,0) rotate(${R.tilt.toFixed(2)}deg)`;
        node.style.width = `${cardW.toFixed(1)}px`;
        node.style.height = `${cardH.toFixed(1)}px`;
        node.style.opacity = alpha.toFixed(3);
        node.style.zIndex = String(i === A.hover ? 999 : 10 + Math.floor(p * 40));
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [riders]);

  const hoveredCard = useMemo(
    () => (hovered ? riders.find((r) => r.card.id === hovered)?.card ?? null : null),
    [hovered, riders]
  );

  return (
    <>
      {/* star + guide underlay */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }} />
      {/* riding cards */}
      <div ref={fieldRef} style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
        {riders.map((R, i) => (
          <div
            key={`${R.card.id}-${i}`}
            ref={(el) => {
              cardEls.current[i] = el;
            }}
            onMouseEnter={() => {
              anim.current.hover = i;
              setHovered(R.card.id);
            }}
            onMouseLeave={() => {
              anim.current.hover = -1;
              setHovered(null);
            }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              willChange: "transform, opacity",
              borderRadius: 6,
              overflow: "hidden",
              boxShadow: "0 0 0 1px rgba(212,168,67,0.55), 0 6px 24px rgba(0,0,0,0.55)",
              opacity: 0,
            }}
          >
            <img
              src={R.card.img}
              alt={R.card.name}
              draggable={false}
              style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
            />
          </div>
        ))}
      </div>
      {/* nebula pocket: hides births behind the hero copy */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          transform: "translate(-50%,-50%)",
          width: "min(72vmin,560px)",
          height: "min(72vmin,560px)",
          zIndex: 1,
          pointerEvents: "none",
          background: "radial-gradient(closest-side, rgba(26,16,40,0.88) 30%, rgba(26,16,40,0.45) 60%, transparent 100%)",
        }}
      />
      {/* vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 90% 70% at 50% 45%, transparent 55%, rgba(13,8,18,0.6) 100%)",
        }}
      />
      {hoveredCard && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 28,
            transform: "translateX(-50%)",
            zIndex: 2,
            pointerEvents: "none",
            background: "rgba(13,8,18,0.85)",
            border: "1px solid rgba(212,168,67,0.35)",
            borderRadius: 10,
            padding: "8px 18px",
            textAlign: "center",
            fontFamily: '"Playfair Display", serif',
            color: "#d4a843",
            fontSize: 14,
            whiteSpace: "nowrap",
          }}
        >
          {hoveredCard.nameVi || hoveredCard.name}
          <span style={{ display: "block", fontSize: 11, color: "#b8849f", fontFamily: '"Cormorant Garamond", serif' }}>
            {hoveredCard.meaning}
          </span>
        </div>
      )}
    </>
  );
}
