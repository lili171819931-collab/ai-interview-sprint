export function RadarHero() {
  return (
    <div
      className="relative aspect-square w-full max-w-[360px] mx-auto"
      aria-hidden
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2BB673" stopOpacity="0.35" />
            <stop offset="70%" stopColor="#2BB673" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#2BB673" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="url(#glow)" />
        {[30, 50, 70, 90].map((r) => (
          <circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="rgba(232,238,245,0.12)"
            strokeWidth="1"
          />
        ))}
        <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(232,238,245,0.1)" />
        <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(232,238,245,0.1)" />
        <g className="radar-sweep">
          <path d="M100 100 L100 18 A82 82 0 0 1 170 55 Z" fill="rgba(43,182,115,0.18)" />
          <line x1="100" y1="100" x2="100" y2="18" stroke="#2BB673" strokeWidth="1.5" />
        </g>
        {[
          [132, 58],
          [150, 120],
          [70, 145],
          [55, 70],
          [118, 150],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.2" fill="#E6A23C" opacity={0.85}>
            <animate
              attributeName="opacity"
              values="0.35;1;0.35"
              dur={`${2 + i * 0.35}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
        <circle cx="100" cy="100" r="3" fill="#2BB673" />
      </svg>
    </div>
  );
}
