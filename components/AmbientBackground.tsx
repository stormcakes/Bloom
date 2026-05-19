"use client";

import { useBloomTheme } from "@/components/providers/ThemeProvider";

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
  const theme = useBloomTheme();
  const isGamer = theme === "gamer";

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {isGamer ? (
        <>
          {/* Twinkling star field */}
          {[
            { top: "8%",  left: "12%", d: "2s",  s: 1.5 },
            { top: "14%", left: "65%", d: "3.2s",s: 1   },
            { top: "6%",  left: "45%", d: "2.7s",s: 2   },
            { top: "22%", left: "82%", d: "4s",  s: 1.5 },
            { top: "18%", left: "30%", d: "3.5s",s: 1   },
            { top: "35%", left: "92%", d: "2.3s",s: 2   },
            { top: "42%", left: "5%",  d: "5s",  s: 1   },
            { top: "55%", left: "55%", d: "2.8s",s: 1.5 },
            { top: "60%", left: "78%", d: "3.8s",s: 1   },
            { top: "72%", left: "20%", d: "2.5s",s: 2   },
            { top: "78%", left: "88%", d: "4.2s",s: 1.5 },
            { top: "85%", left: "40%", d: "3s",  s: 1   },
            { top: "90%", left: "70%", d: "2.6s",s: 2   },
            { top: "48%", left: "35%", d: "4.5s",s: 1   },
            { top: "30%", left: "50%", d: "3.3s",s: 1.5 },
          ].map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-star-twinkle"
              style={{
                top: star.top,
                left: star.left,
                width: `${star.s}px`,
                height: `${star.s}px`,
                background: i % 4 === 0 ? "rgba(200,180,255,0.9)" : i % 4 === 1 ? "rgba(180,220,255,0.9)" : "rgba(255,255,255,0.9)",
                animationDuration: star.d,
                animationDelay: `${i * 0.3}s`,
              } as React.CSSProperties}
            />
          ))}
          {/* Circuit grid lines */}
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(139,92,246,0.8) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139,92,246,0.8) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          {/* Neon glow orbs */}
          {[
            { size: 300, top: "5%",  left: "-10%", color: "139,92,246" },
            { size: 240, top: "55%", right: "-8%", color: "6,182,212"  },
            { size: 180, top: "80%", left: "10%",  color: "168,85,247" },
          ].map((orb, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-orb-drift"
              style={{
                width: orb.size,
                height: orb.size,
                top: orb.top,
                left: "left" in orb ? (orb as { left: string } & typeof orb).left : undefined,
                right: "right" in orb ? (orb as { right: string } & typeof orb).right : undefined,
                background: `radial-gradient(circle, rgba(${orb.color},0.15), transparent 70%)`,
                filter: "blur(60px)",
                animationDelay: `${i * 4}s`,
                animationDuration: `${16 + i * 4}s`,
              }}
            />
          ))}
          {/* Floating pixel particles */}
          {["2%", "25%", "50%", "72%", "88%"].map((left, i) => (
            <div
              key={i}
              className="absolute bottom-0 w-1 h-1 rounded-sm opacity-0 animate-petal-rise"
              style={{
                left,
                background: i % 2 === 0 ? "rgba(139,92,246,0.7)" : "rgba(6,182,212,0.7)",
                animationDelay: `${i * 3}s`,
                animationDuration: `${14 + i * 2}s`,
              }}
            />
          ))}
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
