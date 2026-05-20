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
    /* Breathing float wrapper — lifts 5px and back every 6s after mount */
    <motion.div
      animate={isGamer ? {} : { y: [0, -5, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
    >
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
          {/* Eagle + mountain silhouette (gamer mood illustration) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[var(--radius)]">
            {/* Mountain silhouette */}
            <svg
              className="absolute bottom-0 right-0 opacity-20"
              width="180" height="100" viewBox="0 0 180 100"
              fill="none"
            >
              <polygon points="0,100 50,30 80,60 110,15 140,55 180,20 180,100" fill="url(#mtGrad)" />
              <defs>
                <linearGradient id="mtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#4c1d95" />
                </linearGradient>
              </defs>
            </svg>
            {/* Glow behind peak */}
            <div className="absolute bottom-6 right-12 w-20 h-20 rounded-full bg-purple-400/20 blur-2xl" />
            {/* Eagle — animated float */}
            <motion.div
              className="absolute"
              style={{ top: "10%", right: "8%", fontSize: "2rem", filter: "drop-shadow(0 0 10px rgba(139,92,246,0.9))", opacity: 0.9 }}
              animate={{ y: [0, -10, 0], rotate: [-3, 4, -3], scale: [1, 1.08, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              🦅
            </motion.div>
          </div>

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
          {/* Pulsing glow ring — synced to 6s breathe */}
          <motion.div
            className="absolute inset-0 rounded-[var(--radius)] pointer-events-none"
            animate={{ boxShadow: [
              "0 0 0px 0px rgba(255,255,255,0), 0 8px 32px rgba(168,85,247,0.12)",
              "0 0 28px 8px rgba(255,255,255,0.1), 0 16px 48px rgba(168,85,247,0.25)",
              "0 0 0px 0px rgba(255,255,255,0), 0 8px 32px rgba(168,85,247,0.12)",
            ]}}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
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
    </motion.div>
  );
}
