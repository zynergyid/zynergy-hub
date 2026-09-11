/* Payload admin branding: replaces the default Payload logo and nav icon. */

function Mark({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 1000 1000" width={size} height={size} aria-hidden="true">
      <rect width="1000" height="1000" rx="220" fill="#0B1B3F" />
      <g
        transform="translate(500 500) scale(0.7) translate(-500 -500)"
        fill="none"
        stroke="#fff"
        strokeWidth="110"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 160 130 L 840 130 L 588.3 548.9" />
        <path d="M 840 870 L 160 870 L 411.7 451.1" />
        <circle cx="527.5" cy="650" r="82.5" strokeWidth="71" />
        <circle cx="472.5" cy="350" r="82.5" strokeWidth="71" />
      </g>
    </svg>
  );
}

export function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <Mark size={44} />
      <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1 }}>
        Zynergy <span style={{ opacity: 0.55 }}>Team</span>
      </span>
    </div>
  );
}

export function Icon() {
  return <Mark size={28} />;
}
