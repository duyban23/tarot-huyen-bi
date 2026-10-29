import { useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import anime from "animejs";

interface SparkleButtonProps {
  children: React.ReactNode;
  className?: string;
  as?: "link" | "button";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export default function SparkleButton({
  children,
  className = "",
  as = "button",
  href,
  onClick,
  type = "button",
  disabled = false,
}: SparkleButtonProps) {
  const btnRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const sparkleCount = useRef(0);

  const handleMouseEnter = useCallback(() => {
    const btn = btnRef.current;
    if (!btn || disabled) return;

    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Limit concurrent sparkle groups
    sparkleCount.current++;
    if (sparkleCount.current > 3) return;

    // Create 8 sparkles around the button
    const count = 8;
    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < count; i++) {
      const spark = document.createElement("div");
      spark.style.cssText = `
        position: fixed;
        width: ${4 + Math.random() * 4}px;
        height: ${4 + Math.random() * 4}px;
        border-radius: 50%;
        background: ${["#d4a843", "#f0e8ed", "#a07392", "#cfa4ba"][Math.floor(Math.random() * 4)]};
        pointer-events: none;
        z-index: 9999;
        left: ${cx}px;
        top: ${cy}px;
      `;
      document.body.appendChild(spark);
      particles.push(spark);
    }

    const angleStep = (Math.PI * 2) / count;
    anime({
      targets: particles,
      translateX: () => Math.cos(Math.random() * Math.PI * 2) * (30 + Math.random() * 40),
      translateY: () => Math.sin(Math.random() * Math.PI * 2) * (30 + Math.random() * 40),
      scale: [
        { value: 1.5, duration: 100 },
        { value: 0, duration: 500 },
      ],
      opacity: [
        { value: 1, duration: 50 },
        { value: 0, duration: 500 },
      ],
      duration: 600 + Math.random() * 200,
      easing: "easeOutCubic",
      complete: () => {
        particles.forEach((p) => p.remove());
        sparkleCount.current--;
      },
    });
  }, [disabled]);

  if (as === "link" && href) {
    return (
      <Link
        ref={btnRef as React.Ref<HTMLAnchorElement>}
        to={href}
        className={className}
        onMouseEnter={handleMouseEnter}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={btnRef as React.Ref<HTMLButtonElement>}
      type={type}
      disabled={disabled}
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </button>
  );
}
