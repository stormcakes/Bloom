"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MoodEntry {
  date: string; // "YYYY-MM-DD"
  mood: string;
}

interface Props {
  entries: MoodEntry[];
}

const MOOD_VALUES: Record<string, number> = {
  rough: 1,
  meh: 2,
  okay: 3,
  good: 4,
  great: 5,
};

const MOOD_EMOJIS: Record<number, string> = {
  1: "😔",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "🥰",
};

const MOOD_LABELS: Record<string, string> = {
  rough: "Rough",
  meh: "Meh",
  okay: "Okay",
  good: "Good",
  great: "Great",
};

// SVG layout constants
const MARGIN_LEFT = 44;
const MARGIN_RIGHT = 16;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 36;
const CHART_HEIGHT = 180;
const TOTAL_HEIGHT = CHART_HEIGHT + MARGIN_TOP + MARGIN_BOTTOM;
const TOTAL_WIDTH = 360; // viewBox width; scales responsively

function getLast30Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function formatAxisLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}

function formatTooltipDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}

// Map a mood value (1–5) to a Y pixel coordinate within the chart area
function moodToY(value: number): number {
  // value 5 → top (MARGIN_TOP), value 1 → bottom (MARGIN_TOP + CHART_HEIGHT)
  return MARGIN_TOP + ((5 - value) / 4) * CHART_HEIGHT;
}

// Map a day index (0–29) to an X pixel coordinate
function dayToX(index: number, totalDays: number): number {
  const chartWidth = TOTAL_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  return MARGIN_LEFT + (index / (totalDays - 1)) * chartWidth;
}

// Build a smooth cubic bezier path from an array of [x, y] points
// Gaps (null) break the path into separate segments
function buildSmoothPath(points: ([number, number] | null)[]): string[] {
  const segments: string[] = [];
  let current: [number, number][] = [];

  const flushSegment = () => {
    if (current.length < 1) return;
    if (current.length === 1) {
      // Single isolated point — no line, just a dot (handled separately)
      current = [];
      return;
    }

    let d = `M ${current[0][0].toFixed(2)} ${current[0][1].toFixed(2)}`;
    for (let i = 1; i < current.length; i++) {
      const prev = current[i - 1];
      const curr = current[i];
      const cp1x = prev[0] + (curr[0] - prev[0]) / 3;
      const cp1y = prev[1];
      const cp2x = curr[0] - (curr[0] - prev[0]) / 3;
      const cp2y = curr[1];
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${curr[0].toFixed(2)} ${curr[1].toFixed(2)}`;
    }
    segments.push(d);
    current = [];
  };

  for (const pt of points) {
    if (pt === null) {
      flushSegment();
    } else {
      current.push(pt);
    }
  }
  flushSegment();
  return segments;
}

export default function MoodChart({ entries }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    mood: string;
    date: string;
  } | null>(null);

  const days = getLast30Days();

  // Build a lookup map for quick access
  const entryMap: Record<string, string> = {};
  for (const e of entries) {
    entryMap[e.date] = e.mood;
  }

  const hasData = entries.length > 0;

  // Build the point array (null = no data for that day)
  const points: ([number, number] | null)[] = days.map((day, i) => {
    const mood = entryMap[day];
    if (!mood || MOOD_VALUES[mood] === undefined) return null;
    const x = dayToX(i, days.length);
    const y = moodToY(MOOD_VALUES[mood]);
    return [x, y];
  });

  const pathSegments = buildSmoothPath(points);

  // Determine X-axis label indices (every 7 days, starting from index 0)
  const xAxisIndices = [0, 7, 14, 21, 29];

  const handleMouseEnter = useCallback(
    (day: string, mood: string, x: number, y: number) => {
      setTooltip({ x, y, mood, date: day });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (!hasData) {
    return (
      <div className="bloom-card flex flex-col items-center justify-center py-10 gap-2">
        <p className="text-3xl">🌱</p>
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          No mood data yet — start checking in daily
        </p>
      </div>
    );
  }

  return (
    <div className={cn("bloom-card overflow-hidden select-none")}>
      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${TOTAL_WIDTH} ${TOTAL_HEIGHT}`}
          className="w-full"
          style={{ height: "auto" }}
          aria-label="Mood history chart"
        >
          {/* Y-axis grid lines + emoji labels */}
          {[1, 2, 3, 4, 5].map((level) => {
            const y = moodToY(level);
            return (
              <g key={level}>
                <line
                  x1={MARGIN_LEFT}
                  y1={y}
                  x2={TOTAL_WIDTH - MARGIN_RIGHT}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  strokeWidth={1}
                />
                <text
                  x={MARGIN_LEFT - 6}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={12}
                  className="fill-current"
                >
                  {MOOD_EMOJIS[level]}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {xAxisIndices.map((i) => {
            const x = dayToX(i, days.length);
            const label = formatAxisLabel(days[i]);
            return (
              <text
                key={i}
                x={x}
                y={TOTAL_HEIGHT - 6}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                fillOpacity={0.45}
              >
                {label}
              </text>
            );
          })}

          {/* Smooth line path segments */}
          {pathSegments.map((d, idx) => (
            <path
              key={idx}
              d={d}
              fill="none"
              stroke="#F472A0"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Data points (circles) */}
          {days.map((day, i) => {
            const pt = points[i];
            if (!pt) return null;
            const [x, y] = pt;
            const mood = entryMap[day];
            return (
              <circle
                key={day}
                cx={x}
                cy={y}
                r={4}
                fill="white"
                stroke="#F472A0"
                strokeWidth={2}
                className="cursor-pointer"
                onMouseEnter={() => handleMouseEnter(day, mood, x, y)}
                onMouseLeave={handleMouseLeave}
                onTouchStart={() => handleMouseEnter(day, mood, x, y)}
                onTouchEnd={handleMouseLeave}
              />
            );
          })}

          {/* Tooltip */}
          {tooltip && (() => {
            const tooltipW = 80;
            const tooltipH = 36;
            // Clamp X so it doesn't go out of viewBox
            const rawTx = tooltip.x - tooltipW / 2;
            const tx = Math.max(2, Math.min(rawTx, TOTAL_WIDTH - tooltipW - 2));
            const ty = tooltip.y - tooltipH - 10;
            const tipX = tooltip.x - tx; // tip triangle center relative to rect

            return (
              <g pointerEvents="none">
                <rect
                  x={tx}
                  y={ty}
                  width={tooltipW}
                  height={tooltipH}
                  rx={8}
                  fill="#1a1a2e"
                  fillOpacity={0.9}
                />
                {/* Triangle tip */}
                <polygon
                  points={`${tx + tipX - 5},${ty + tooltipH} ${tx + tipX + 5},${ty + tooltipH} ${tx + tipX},${ty + tooltipH + 6}`}
                  fill="#1a1a2e"
                  fillOpacity={0.9}
                />
                <text
                  x={tx + tooltipW / 2}
                  y={ty + 13}
                  textAnchor="middle"
                  fontSize={13}
                  dominantBaseline="middle"
                >
                  {MOOD_EMOJIS[MOOD_VALUES[tooltip.mood]]}
                  {" "}
                  <tspan fontSize={9} fill="white" fillOpacity={0.9}>
                    {MOOD_LABELS[tooltip.mood]}
                  </tspan>
                </text>
                <text
                  x={tx + tooltipW / 2}
                  y={ty + 26}
                  textAnchor="middle"
                  fontSize={8}
                  fill="white"
                  fillOpacity={0.6}
                  dominantBaseline="middle"
                >
                  {formatTooltipDate(tooltip.date)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
