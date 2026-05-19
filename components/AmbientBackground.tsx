"use client";

// Floating petals + slow gradient orbs — fixed behind all content, pointer-events-none
const PETALS = [
  { left: "8%",  delay: "0s",  duration: "20s", scale: 1.1 },
  { left: "22%", delay: "4s",  duration: "15s", scale: 0.8 },
  { left: "45%", delay: "9s",  duration: "22s", scale: 1.0 },
  { left: "63%", delay: "2s",  duration: "17s", scale: 0.7 },
  { left: "80%", delay: "6s",  duration: "19s", scale: 0.9 },
  { left: "91%", delay: "13s", duration: "16s", scale: 0.75 },
];

const ORBS = [
  { width: 280, height: 280, top: "5%",  left: "-8%",  hue: "var(--orb-hue, 340)", delay: "0s",  duration: "18s" },
  { width: 220, height: 220, top: "50%", right: "-5%", hue: "var(--orb-hue, 280)", delay: "6s",  duration: "22s" },
  { width: 180, height: 180, top: "75%", left: "15%",  hue: "var(--orb-hue, 20)",  delay: "11s", duration: "16s" },
];

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Soft gradient orbs */}
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-[80px] opacity-[0.07] animate-orb-drift"
          style={{
            width: orb.width,
            height: orb.height,
            top: orb.top,
            left: "left" in orb ? orb.left : undefined,
            right: "right" in orb ? (orb as { right: string }).right : undefined,
            background: `radial-gradient(circle, hsl(${orb.hue} 70% 70%), transparent 70%)`,
            animationDelay: orb.delay,
            animationDuration: orb.duration,
          }}
        />
      ))}

      {/* Floating petals */}
      {PETALS.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-0 text-base animate-petal-rise select-none opacity-0"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: `${p.scale}rem`,
          }}
        >
          🌸
        </span>
      ))}
    </div>
  );
}
