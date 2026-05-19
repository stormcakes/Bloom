"use client";

import { motion } from "framer-motion";
import { useBloomTheme } from "@/components/providers/ThemeProvider";

interface Props {
  text: string;
  reference: string;
  label?: string;
}

// Floating light orbs inside the verse card
const ORBS = [
  { size: 80,  top: "10%",  left: "-5%",  delay: 0,   duration: 8  },
  { size: 60,  top: "60%",  right: "-3%", delay: 3,   duration: 11 },
  { size: 50,  top: "30%",  left: "70%",  delay: 5.5, duration: 9  },
];

export function AnimatedVerseCard({ text, reference, label = "Today's Verse" }: Props) {
  const theme = useBloomTheme();
  const isGamer = theme === "gamer";

  const cleanText = text.replace(/^["'"]+|["'"]+$/g, "").trim();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="verse-card relative overflow-hidden"
    >
      {isGamer ? (
        <>
          {/* Neon border pulse */}
          <motion.div
            className="absolute inset-0 rounded-[var(--radius)] pointer-events-none"
            animate={{ boxShadow: [
              "0 0 0px 0px rgba(139,92,246,0)",
              "0 0 20px 4px rgba(139,92,246,0.4), inset 0 0 20px rgba(6,182,212,0.08)",
              "0 0 0px 0px rgba(139,92,246,0)",
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Scanline sweep */}
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: "200%" }}
            transition={{ duration: 2.5, delay: 0.4, ease: "linear", repeat: Infinity, repeatDelay: 4 }}
            className="absolute inset-x-0 h-8 pointer-events-none"
            style={{ background: "linear-gradient(180deg, transparent, rgba(6,182,212,0.06), transparent)" }}
          />
          {/* Corner accent — top-left */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-[var(--radius)]" />
          {/* Corner accent — bottom-right */}
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-400/60 rounded-br-[var(--radius)]" />
          {/* Floating neon orbs */}
          {ORBS.map((orb, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: orb.size,
                height: orb.size,
                top: orb.top,
                left: "left" in orb ? (orb as { left: string } & typeof orb).left : undefined,
                right: "right" in orb ? (orb as { right: string } & typeof orb).right : undefined,
                background: i % 2 === 0
                  ? "radial-gradient(circle, rgba(139,92,246,0.2), transparent 70%)"
                  : "radial-gradient(circle, rgba(6,182,212,0.15), transparent 70%)",
                filter: "blur(16px)",
              }}
              animate={{ y: [0, -14, 0], x: [0, i % 2 === 0 ? 8 : -8, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
          {/* Content */}
          <div className="relative z-10">
            <p className="gamer-label text-xs font-bold uppercase tracking-widest mb-3">{label}</p>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="text-white font-semibold text-base leading-relaxed"
              style={{ textShadow: "0 0 12px rgba(139,92,246,0.5)" }}
            >
              &ldquo;{cleanText}&rdquo;
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="text-cyan-300/90 text-sm mt-2 font-bold tracking-wide"
            >
              — {reference}
            </motion.p>
          </div>
        </>
      ) : (
        <>
          {/* Pulsing glow ring */}
          <motion.div
            className="absolute inset-0 rounded-[var(--radius)] pointer-events-none"
            animate={{ boxShadow: ["0 0 0px 0px rgba(255,255,255,0)", "0 0 24px 6px rgba(255,255,255,0.08)", "0 0 0px 0px rgba(255,255,255,0)"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Shimmer sweep on mount */}
          <motion.div
            initial={{ x: "-100%", opacity: 0.6 }}
            animate={{ x: "200%", opacity: 0 }}
            transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)" }}
          />

          {/* Floating orbs */}
          {ORBS.map((orb, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: orb.size,
                height: orb.size,
                top: orb.top,
                left: "left" in orb ? (orb as { left: string } & typeof orb).left : undefined,
                right: "right" in orb ? (orb as { right: string } & typeof orb).right : undefined,
                background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)",
                filter: "blur(16px)",
              }}
              animate={{ y: [0, -14, 0], x: [0, i % 2 === 0 ? 8 : -8, 0], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">{label}</p>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="text-white font-semibold text-base leading-relaxed italic"
            >
              &ldquo;{cleanText}&rdquo;
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="text-white/80 text-sm mt-2 font-medium"
            >
              {reference}
            </motion.p>
          </div>
        </>
      )}
    </motion.div>
  );
}
