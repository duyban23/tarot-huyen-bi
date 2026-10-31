/**
 * Hình minh hoạ "bản đồ sao" (vòng hoàng đạo) vẽ bằng SVG — không cần file ảnh,
 * không phụ thuộc mạng, sắc nét mọi kích thước. Màu lấy theo `currentColor`
 * nên chỉ cần đặt text-candle-gold / text-lilac ở chỗ dùng.
 */
export default function AstroWheel({ className = "w-16 h-16" }: { className?: string }) {
  const R_OUT = 46;
  const R_MID = 37;
  const R_IN = 17;
  const C = 50;

  const spokes = Array.from({ length: 12 }, (_, i) => (i * 30 - 90) * (Math.PI / 180));
  const pt = (r: number, rad: number) => [C + r * Math.cos(rad), C + r * Math.sin(rad)] as const;

  // vài "hành tinh" cố định để hình có hồn
  const planets: Array<[number, number, number]> = [
    [R_MID - 4, -80, 2.1],
    [R_MID - 2, -20, 1.7],
    [R_MID - 6, 45, 2.4],
    [R_MID - 3, 120, 1.8],
    [R_MID - 5, 175, 2.2],
    [R_MID - 2, 235, 1.6],
  ];

  // góc chiếu nối các hành tinh
  const aspects = [
    [0, 2],
    [2, 4],
    [4, 1],
    [1, 5],
    [5, 3],
  ];

  const planetPts = planets.map(([r, deg]) => pt(r, (deg * Math.PI) / 180));

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* vòng ngoài + vòng trong */}
      <circle cx={C} cy={C} r={R_OUT} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.3" />
      <circle
        cx={C}
        cy={C}
        r={R_MID}
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="0.9"
        strokeDasharray="2 3"
      />
      <circle cx={C} cy={C} r={R_IN} stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />

      {/* 12 cung */}
      {spokes.map((rad, i) => {
        const [x1, y1] = pt(R_MID, rad);
        const [x2, y2] = pt(R_OUT, rad);
        const [mx, my] = pt((R_OUT + R_MID) / 2, rad + Math.PI / 12);
        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="0.9"
            />
            <circle cx={mx} cy={my} r="0.9" fill="currentColor" fillOpacity="0.55" />
          </g>
        );
      })}

      {/* góc chiếu */}
      {aspects.map(([a, b], i) => {
        const [x1, y1] = planetPts[a];
        const [x2, y2] = planetPts[b];
        return (
          <line
            key={`asp-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeOpacity="0.22"
            strokeWidth="0.7"
          />
        );
      })}

      {/* hành tinh */}
      {planets.map(([r, deg, size], i) => {
        const [x, y] = pt(r, (deg * Math.PI) / 180);
        return <circle key={`p-${i}`} cx={x} cy={y} r={size} fill="currentColor" fillOpacity="0.85" />;
      })}

      {/* tâm + tia sáng */}
      <circle cx={C} cy={C} r="2.6" fill="currentColor" fillOpacity="0.9" />
      <path
        d="M50 4.5l1.3 3.6 3.6 1.3-3.6 1.3L50 14.3l-1.3-3.6-3.6-1.3 3.6-1.3L50 4.5z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <path
        d="M86 62l.9 2.5 2.5.9-2.5.9-.9 2.5-.9-2.5-2.5-.9 2.5-.9.9-2.5z"
        fill="currentColor"
        fillOpacity="0.6"
      />
    </svg>
  );
}
