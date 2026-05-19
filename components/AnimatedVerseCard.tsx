"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

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
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="verse-card relative overflow-hidden"
    >
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
          animate={{
            y: [0, -14, 0],
            x: [0, i % 2 === 0 ? 8 : -8, 0],
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
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
          &ldquo;{text.length > 120 ? text.slice(0, 120) + "…" : text}&rdquo;
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
    </motion.div>
  );
}
