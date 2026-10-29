import { useCallback, useEffect, useRef, useState } from "react";
import anime from "animejs";

/* ── Card dimensions (7:12 ratio = 350:600) ── */
const CARD_W = 72;
const CARD_H = 123;

/* ── Spread positions ── */
const SPREAD: { left: string; top: string; rotate: number }[] = [
  { left: "6%",  top: "18%", rotate: -12 },
  { left: "4%",  top: "42%", rotate: -8  },
  { left: "8%",  top: "64%", rotate: -6  },
  { left: "82%", top: "20%", rotate: 10  },
  { left: "86%", top: "44%", rotate: 14  },
  { left: "82%", top: "66%", rotate: 8   },
];

/* ── Card face HTML (deck image) ── */
function cardFrontHTML(img: string, alt: string): string {
  return `<div style="position:relative;width:100%;height:100%;border-radius:5px;overflow:hidden;
    box-shadow:0 0 0 1.5px #d4a843,0 0 12px rgba(212,168,67,0.15),0 6px 24px rgba(0,0,0,0.55)">
    <img src="${img}" alt="${alt}" style="display:block;width:100%;height:100%;object-fit:cover" />
    <div style="position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(to bottom,transparent 55%,rgba(13,8,18,0.55) 100%)"></div>
  </div>`;
}

/* ── Card back SVG ── */
function cardBackHTML(): string {
  const g = "#d4a843";
  return `<svg viewBox="0 0 210 300" width="100%" height="100%">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a1025"/><stop offset="100%" stop-color="#0d0812"/>
    </linearGradient></defs>
    <rect width="210" height="300" rx="10" fill="url(#bg)" />
    <rect x="8" y="8" width="194" height="284" rx="8" fill="none" stroke="${g}" stroke-width="1.2" opacity="0.5" />
    <rect x="16" y="16" width="178" height="268" rx="6" fill="none" stroke="${g}" stroke-width="0.6" opacity="0.25" />
    <g transform="translate(105,150)" opacity="0.55">
      ${[0,45,90,135,180,225,270,315].map(a =>
        `<line x1="0" y1="0" x2="0" y2="-52" transform="rotate(${a})" stroke="${g}" stroke-width="0.8" opacity="0.35" />`
      ).join("")}
      ${[0,60,120,180,240,300].map(a =>
        `<line x1="0" y1="0" x2="0" y2="-38" transform="rotate(${a+22.5})" stroke="${g}" stroke-width="0.5" opacity="0.2" />`
      ).join("")}
      <circle cx="0" cy="0" r="20" fill="none" stroke="${g}" stroke-width="0.8" opacity="0.45" />
      <circle cx="0" cy="0" r="12" fill="none" stroke="${g}" stroke-width="0.5" opacity="0.25" />
      <circle cx="0" cy="0" r="4" fill="${g}" opacity="0.45" />
    </g>
  </svg>`;
}

/* ── Card data type ── */
interface TarotCard {
  id: string;
  name: string;
  nameVi: string;
  img: string;
  arcana: string;
  suit: string | null;
  meaning: string;
}

interface CardState extends TarotCard {
  pos: { left: string; top: string; rotate: number };
  flipped: boolean;
}

/* ── Component ── */
export default function FloatingTarotCards({ count = 6 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardElRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animDone = useRef(false);
  const poolRef = useRef<TarotCard[]>([]);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [cardsState, setCardsState] = useState<CardState[]>([]);

  /* ── Load card data from JSON ── */
  useEffect(() => {
    fetch("/data/tarot-cards.json")
      .then(r => r.json())
      .then((data: TarotCard[]) => {
        poolRef.current = data;
        pickRandom(data, count);
        setLoaded(true);
      })
      .catch(() => {
        // fallback: generate minimal data from image filenames
        const fallback: TarotCard[] = [];
        for (let i = 0; i < 22; i++) {
          const id = `m${i.toString().padStart(2, "0")}`;
          fallback.push({ id, name: `Major ${i}`, nameVi: `Major ${i}`, img: `/images/cards/${id}.webp`, arcana: "Major", suit: null, meaning: "" });
        }
        for (const s of ["c", "p", "s", "w"]) {
          for (let i = 1; i <= 14; i++) {
            const id = `${s}${i.toString().padStart(2, "0")}`;
            fallback.push({ id, name: id, nameVi: id, img: `/images/cards/${id}.webp`, arcana: "Minor", suit: s, meaning: "" });
          }
        }
        poolRef.current = fallback;
        pickRandom(fallback, count);
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickRandom(pool: TarotCard[], n: number) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setCardsState(shuffled.slice(0, Math.min(n, pool.length)).map((c, i) => ({
      ...c,
      pos: SPREAD[i],
      flipped: Math.random() >= 0.4,
    })));
  }

  /* ── Ref setter ── */
  const setCardRef = useCallback((i: number) => (el: HTMLDivElement | null) => {
    cardElRefs.current[i] = el;
    if (el && i === cardsState.length - 1) setReady(true);
  }, [cardsState.length]);

  /* ── Animate flip (squish 1→0→1 + swap content) ── */
  const animateFlip = useCallback((i: number, newFlipped: boolean) => {
    const el = cardElRefs.current[i];
    if (!el) return;
    const content = el.firstElementChild as HTMLElement | null;
    if (!content) return;

    anime.remove(el);
    anime({
      targets: content,
      scaleX: [
        { value: 1, duration: 1 },
        { value: 0, duration: 120, easing: "easeInCubic" },
      ],
      complete: () => {
        setCardsState(prev => prev.map((c, idx) =>
          idx === i ? { ...c, flipped: newFlipped } : c
        ));
        anime({
          targets: content,
          scaleX: [
            { value: 0, duration: 1 },
            { value: 1, duration: 200, easing: "easeOutCubic" },
          ],
          complete: () => {
            const card = cardsState[i];
            anime({
              targets: el,
              translateY: [
                { value: -8 - Math.random() * 10, duration: 3000 + Math.random() * 2500 },
                { value: 8 + Math.random() * 10, duration: 3000 + Math.random() * 2500 },
              ],
              rotate: [
                { value: card.pos.rotate + 3, duration: 4000 + Math.random() * 2000 },
                { value: card.pos.rotate - 3, duration: 4000 + Math.random() * 2000 },
              ],
              loop: true,
              easing: "easeInOutSine",
            });
          },
        });
      },
    });
  }, [cardsState]);

  /* ── Click: toggle flip ── */
  const handleFlip = useCallback((i: number) => {
    animateFlip(i, !cardsState[i].flipped);
  }, [cardsState, animateFlip]);

  /* ── Double-click: swap to another random card ── */
  const handleSwap = useCallback((i: number) => {
    const pool = poolRef.current.filter(c => !cardsState.some(cc => cc.id === c.id));
    if (pool.length === 0) return;
    const newCard = pool[Math.floor(Math.random() * pool.length)];
    const el = cardElRefs.current[i];
    if (!el) return;

    anime.remove(el);
    anime({
      targets: el,
      scale: [
        { value: 1, duration: 1 },
        { value: 0.6, duration: 150, easing: "easeInCubic" },
      ],
      rotate: [
        { value: cardsState[i].pos.rotate, duration: 1 },
        { value: cardsState[i].pos.rotate + 20, duration: 150, easing: "easeInCubic" },
      ],
      complete: () => {
        setCardsState(prev => prev.map((c, idx) =>
          idx === i ? { ...newCard, pos: c.pos, flipped: Math.random() >= 0.4 } : c
        ));
        anime({
          targets: el,
          scale: [
            { value: 0.6, duration: 1 },
            { value: 1.08, duration: 250, easing: "easeOutBack" },
            { value: 1, duration: 150, easing: "easeOutCubic" },
          ],
          rotate: [
            { value: cardsState[i].pos.rotate + 20, duration: 1 },
            { value: cardsState[i].pos.rotate, duration: 400, easing: "easeOutCubic" },
          ],
          complete: () => {
            const card = cardsState[i];
            anime({
              targets: el,
              translateY: [
                { value: -8 - Math.random() * 10, duration: 3000 + Math.random() * 2500 },
                { value: 8 + Math.random() * 10, duration: 3000 + Math.random() * 2500 },
              ],
              rotate: [
                { value: card.pos.rotate + 3, duration: 4000 + Math.random() * 2000 },
                { value: card.pos.rotate - 3, duration: 4000 + Math.random() * 2000 },
              ],
              loop: true,
              easing: "easeInOutSine",
            });
          },
        });
      },
    });
  }, [cardsState]);

  /* ── Auto-flip every 10s ── */
  useEffect(() => {
    if (!ready || cardsState.length === 0) return;
    const id = setInterval(() => {
      const idx = Math.floor(Math.random() * cardsState.length);
      animateFlip(idx, !cardsState[idx].flipped);
    }, 10000);
    return () => clearInterval(id);
  }, [ready, cardsState, animateFlip]);

  /* ── Deal animation ── */
  useEffect(() => {
    if (animDone.current) return;
    if (!ready || cardsState.length === 0) return;

    const refs = cardElRefs.current.slice(0, cardsState.length);
    if (refs.some((r) => !r)) return;

    const currentCards = cardsState;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    refs.forEach((el) => {
      if (!el) return;
      el.style.left = "50%";
      el.style.top = "55%";
      el.style.transform = "translate(-50%,-50%) rotate(0deg) scale(0.85)";
      el.style.opacity = "0";
      el.style.transition = "none";
    });

    void document.body.offsetHeight;

    if (prefersReduced) {
      currentCards.forEach((card, i) => {
        const el = refs[i];
        if (!el) return;
        el.style.left = card.pos.left;
        el.style.top = card.pos.top;
        el.style.transform = `rotate(${card.pos.rotate}deg) scale(1)`;
        el.style.opacity = "1";
      });
      animDone.current = true;
      return;
    }

    animDone.current = true;

    anime({
      targets: refs,
      opacity: [0, 1],
      scale: [
        { value: 0.85, duration: 1 },
        { value: 1, duration: 700, easing: "easeOutCubic" },
      ],
      left: (_el: any, i: number) => currentCards[i].pos.left,
      top: (_el: any, i: number) => currentCards[i].pos.top,
      rotate: (_el: any, i: number) => currentCards[i].pos.rotate,
      duration: 750,
      delay: anime.stagger(160, { start: 300 }),
      easing: "easeOutCubic",
      complete: () => {
        // Glow reveal for face cards
        currentCards.forEach((card, i) => {
          if (!card.flipped) return;
          const el = refs[i];
          if (!el) return;
          setTimeout(() => {
            const inner = el.firstElementChild?.firstElementChild as HTMLElement | null;
            if (!inner) return;
            inner.style.transition = "box-shadow 0.6s ease, filter 0.6s ease";
            inner.style.boxShadow = "0 0 0 1.5px #d4a843, 0 0 20px rgba(212,168,67,0.4), 0 6px 24px rgba(0,0,0,0.55)";
            inner.style.filter = "brightness(1.08)";
            setTimeout(() => {
              inner.style.boxShadow = "0 0 0 1.5px #d4a843, 0 0 12px rgba(212,168,67,0.15), 0 6px 24px rgba(0,0,0,0.55)";
              inner.style.filter = "brightness(1)";
            }, 500);
          }, 300 + i * 150);
        });

        setTimeout(() => {
          if (!prefersReduced) startFloating(refs, currentCards);
        }, 600);
      },
    });

    return () => {
      refs.forEach((el) => el && anime.remove(el));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, loaded]);

  if (cardsState.length === 0) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {cardsState.map((card, i) => (
        <div
          key={`slot-${i}`}
          ref={setCardRef(i)}
          className="absolute select-none"
          style={{
            width: CARD_W,
            height: CARD_H,
            zIndex: hovered === i ? 30 : 15 + i,
            transition: "box-shadow 0.3s ease, z-index 0s",
            boxShadow: hovered === i
              ? "0 0 30px rgba(212,168,67,0.35), 0 12px 40px rgba(0,0,0,0.6)"
              : "0 4px 16px rgba(0,0,0,0.3)",
            cursor: ready ? "pointer" : "default",
            pointerEvents: ready ? "auto" : "none",
          }}
          onMouseEnter={() => {
            if (!ready) return;
            const el = cardElRefs.current[i];
            if (el) anime.remove(el);
            setHovered(i);
          }}
          onMouseLeave={() => {
            setHovered(null);
            const el = cardElRefs.current[i];
            if (el && ready) {
              anime({
                targets: el,
                translateY: [
                  { value: -8 - Math.random() * 10, duration: 3000 + Math.random() * 2500 },
                  { value: 8 + Math.random() * 10, duration: 3000 + Math.random() * 2500 },
                ],
                rotate: [
                  { value: card.pos.rotate + 3, duration: 4000 + Math.random() * 2000 },
                  { value: card.pos.rotate - 3, duration: 4000 + Math.random() * 2000 },
                ],
                loop: true,
                easing: "easeInOutSine",
              });
            }
          }}
          onClick={() => handleFlip(i)}
          onDoubleClick={() => handleSwap(i)}
        >
          <div style={{ width: "100%", height: "100%" }}
            dangerouslySetInnerHTML={{
              __html: card.flipped ? cardFrontHTML(card.img, card.name) : cardBackHTML(),
            }}
          />

          {hovered === i && (
            <div style={{
              position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)",
              background: "rgba(13,8,18,0.85)", backdropFilter: "blur(4px)",
              border: "1px solid rgba(212,168,67,0.3)", borderRadius: 6, padding: "3px 10px",
              whiteSpace: "nowrap", fontSize: 11, fontFamily: "Playfair Display, serif",
              color: "#d4a843", letterSpacing: 0.5, pointerEvents: "none", zIndex: 40,
            }}>
              {card.name}
              <span style={{ display: "block", fontSize: 9, color: "#a07392", fontFamily: "Cormorant Garamond, serif" }}>
                {card.meaning} {card.flipped ? "🃏" : "🔮"}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Floating animation ── */
function startFloating(refs: (HTMLDivElement | null)[], cards: { pos: { rotate: number } }[]) {
  refs.forEach((el, i) => {
    if (!el) return;
    anime({
      targets: el,
      translateY: [
        { value: -8 - Math.random() * 10, duration: 3000 + Math.random() * 2500 },
        { value: 8 + Math.random() * 10, duration: 3000 + Math.random() * 2500 },
      ],
      rotate: [
        { value: cards[i].pos.rotate + 3, duration: 4000 + Math.random() * 2000 },
        { value: cards[i].pos.rotate - 3, duration: 4000 + Math.random() * 2000 },
      ],
      loop: true,
      delay: i * 400,
      easing: "easeInOutSine",
    });
  });
}
