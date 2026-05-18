"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MilestoneCelebrationProps {
  milestone: number;
  onClose: () => void;
  onShare: () => void;
}

const MILESTONE_DATA: Record<
  number,
  { subtext: string; verse: string; verseRef: string }
> = {
  7: {
    subtext: "One week of growth!",
    verse:
      "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    verseRef: "Galatians 6:9",
  },
  21: {
    subtext: "Three weeks of blooming!",
    verse:
      "Being confident of this, that he who began a good work in you will carry it on to completion until the day of Christ Jesus.",
    verseRef: "Philippians 1:6",
  },
  30: {
    subtext: "A whole month!",
    verse:
      "Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life.",
    verseRef: "James 1:12",
  },
  100: {
    subtext: "You're a garden! 🌺",
    verse:
      "I can do all this through him who gives me strength.",
    verseRef: "Philippians 4:13",
  },
};

const CONFETTI_COLORS = [
  "#F472A0", // pink
  "#C084FC", // purple
  "#FBBF24", // gold
  "#F9A8D4", // light pink
  "#A78BFA", // violet
  "#FCD34D", // amber
  "#EC4899", // deep pink
  "#DDD6FE", // lavender
];

function seededRandom(seed: number) {
  // Simple deterministic pseudo-random for stable SSR
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const CONFETTI_COUNT = 20;

const confettiDots = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
  const r = seededRandom(i * 3);
  const angle = (i / CONFETTI_COUNT) * 2 * Math.PI + seededRandom(i) * 0.8;
  const distance = 120 + seededRandom(i * 2) * 180;
  return {
    id: i,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotate: seededRandom(i * 5) * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + seededRandom(i * 7) * 8,
    delay: seededRandom(i * 11) * 0.3,
  };
});

export default function MilestoneCelebration({
  milestone,
  onClose,
  onShare,
}: MilestoneCelebrationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const data = MILESTONE_DATA[milestone] ?? MILESTONE_DATA[7];

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onClose();
    }, 8000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onClose]);

  function handleInteraction() {
    // Cancel auto-dismiss when user interacts with action buttons
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="milestone-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Blurred backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Confetti dots */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {confettiDots.map((dot) => (
            <motion.div
              key={dot.id}
              className="absolute rounded-full"
              style={{
                width: dot.size,
                height: dot.size,
                backgroundColor: dot.color,
              }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                x: dot.x,
                y: dot.y,
                opacity: [0, 1, 1, 0],
                scale: [0, 1.2, 1, 0.8],
                rotate: dot.rotate,
              }}
              transition={{
                duration: 1.8,
                delay: dot.delay,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          ))}
        </div>

        {/* Main card */}
        <motion.div
          className="relative z-10 w-full max-w-sm"
          initial={{ scale: 0.7, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <div className="bloom-card text-center space-y-5 px-6 py-8 rounded-3xl">
            {/* Bouncing emoji */}
            <motion.div
              className="text-6xl select-none"
              animate={{ y: [0, -16, 0] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              🌸
            </motion.div>

            {/* Headline */}
            <div className="space-y-1">
              <h2 className="text-3xl font-bold text-foreground">
                🎉 {milestone}-Day Streak!
              </h2>
              <p className="text-primary font-semibold text-lg">
                {data.subtext}
              </p>
            </div>

            {/* Bible verse */}
            <div
              className={cn(
                "border-l-2 border-primary/40 pl-4 text-left",
                "bg-muted/40 rounded-r-xl py-3 pr-3"
              )}
            >
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                &ldquo;{data.verse}&rdquo;
              </p>
              <p className="text-xs text-primary font-semibold mt-1">
                — {data.verseRef}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 pt-1">
              <button
                onClick={() => {
                  handleInteraction();
                  onShare();
                }}
                className={cn(
                  "w-full h-12 rounded-2xl font-semibold text-sm",
                  "bg-primary text-white shadow-lg shadow-primary/30",
                  "active:scale-95 transition-transform"
                )}
              >
                Share Your Milestone
              </button>
              <button
                onClick={() => {
                  handleInteraction();
                  onClose();
                }}
                className={cn(
                  "w-full h-12 rounded-2xl font-semibold text-sm",
                  "bg-muted text-foreground",
                  "active:scale-95 transition-transform"
                )}
              >
                Keep Blooming →
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
