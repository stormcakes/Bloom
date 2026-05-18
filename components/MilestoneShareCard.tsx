"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MilestoneShareCardProps {
  milestone: number;
  name: string;
  onClose: () => void;
}

const MILESTONE_VERSES: Record<number, { verse: string; ref: string }> = {
  7: {
    verse:
      "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    ref: "Galatians 6:9",
  },
  21: {
    verse:
      "Being confident of this, that he who began a good work in you will carry it on to completion.",
    ref: "Philippians 1:6",
  },
  30: {
    verse:
      "Blessed is the one who perseveres under trial, having stood the test, that person will receive the crown of life.",
    ref: "James 1:12",
  },
  100: {
    verse: "I can do all this through him who gives me strength.",
    ref: "Philippians 4:13",
  },
};

const CANVAS_SIZE = 1080;

function drawCard(
  canvas: HTMLCanvasElement,
  milestone: number,
  name: string
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { verse, ref } =
    MILESTONE_VERSES[milestone] ?? MILESTONE_VERSES[7];

  // Background gradient: pink → purple
  const grad = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  grad.addColorStop(0, "#FFE8EE");
  grad.addColorStop(0.5, "#F3E8FF");
  grad.addColorStop(1, "#E8D5F5");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Soft circle accents
  const radialAccent = (
    x: number,
    y: number,
    r: number,
    color: string,
    alpha: number
  ) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, color.replace(")", `, ${alpha})`).replace("rgb", "rgba"));
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  radialAccent(200, 200, 380, "rgb(244, 114, 160)", 0.18);
  radialAccent(880, 880, 340, "rgb(192, 132, 252)", 0.16);

  // Wordmark — "🌸 Bloom"
  ctx.textAlign = "center";
  ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#F472A0";
  ctx.fillText("🌸 Bloom", CANVAS_SIZE / 2, 130);

  // Main headline
  ctx.font = "bold 112px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#1A0A1E";
  wrapText(ctx, `${milestone} Days of Faith 🌸`, CANVAS_SIZE / 2, 340, CANVAS_SIZE - 120, 128);

  // User name
  ctx.font = "italic 52px Georgia, 'Times New Roman', serif";
  ctx.fillStyle = "#7C3AED";
  ctx.fillText(`— ${name}'s journey`, CANVAS_SIZE / 2, 560);

  // Verse separator line
  ctx.strokeStyle = "#F472A0";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(180, 610);
  ctx.lineTo(CANVAS_SIZE - 180, 610);
  ctx.stroke();

  // Bible verse
  ctx.font = "italic 38px Georgia, 'Times New Roman', serif";
  ctx.fillStyle = "#3D1A5C";
  const verseY = wrapText(ctx, `"${verse}"`, CANVAS_SIZE / 2, 690, CANVAS_SIZE - 200, 50);

  // Verse reference
  ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#F472A0";
  ctx.fillText(`— ${ref}`, CANVAS_SIZE / 2, verseY + 60);

  // URL at bottom
  ctx.font = "400 34px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#A0768C";
  ctx.fillText("bloom-ten-fawn.vercel.app", CANVAS_SIZE / 2, CANVAS_SIZE - 70);
}

/** Wraps text and returns the Y position after the last line. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
  }
  return currentY;
}

export default function MilestoneShareCard({
  milestone,
  name,
  onClose,
}: MilestoneShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawCard(canvasRef.current, milestone, name);
    }
  }, [milestone, name]);

  async function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bloom-${milestone}-day-streak.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `bloom-${milestone}-day-streak.png`, {
          type: "image/png",
        });
        const shareData = {
          title: `${milestone}-Day Streak on Bloom!`,
          text: `I just hit a ${milestone}-day devotional streak on Bloom! 🌸 Join me at bloom-ten-fawn.vercel.app`,
          files: [file],
        };
        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            return;
          } catch {
            // Fallback to download if share is cancelled or unsupported
          }
        }
      }
      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bloom-${milestone}-day-streak.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md p-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Canvas preview — scaled to fit within viewport */}
      <motion.div
        className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-full h-full"
          style={{ imageRendering: "crisp-edges" }}
        />
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex flex-col gap-3 w-full max-w-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <button
          onClick={handleShare}
          className={cn(
            "w-full h-12 rounded-2xl font-semibold text-sm",
            "bg-primary text-white shadow-lg shadow-primary/30",
            "active:scale-95 transition-transform"
          )}
        >
          Share
        </button>
        <button
          onClick={handleDownload}
          className={cn(
            "w-full h-12 rounded-2xl font-semibold text-sm",
            "bg-white/20 text-white border border-white/30",
            "active:scale-95 transition-transform"
          )}
        >
          Download
        </button>
        <button
          onClick={onClose}
          className={cn(
            "w-full h-12 rounded-2xl font-semibold text-sm",
            "bg-white/10 text-white/70",
            "active:scale-95 transition-transform"
          )}
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}
