"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrayerRequest {
  id: string;
  content: string;
  is_anonymous: boolean;
  prayer_count: number;
  created_at: string;
  display_name: string | null;
  has_prayed: boolean;
  is_own: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

const MAX_CHARS = 300;

export default function PrayerWallPage() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [prayingId, setPrayingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchPrayers();
  }, []);

  useEffect(() => {
    if (showModal) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [showModal]);

  async function fetchPrayers() {
    setLoading(true);
    try {
      const res = await fetch("/api/prayer-wall");
      const { data } = await res.json();
      setPrayers(data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function submitPrayer() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/prayer-wall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, is_anonymous: isAnonymous }),
      });
      const { data } = await res.json();
      if (data) {
        setPrayers((prev) => [
          {
            ...data,
            display_name: null,
            has_prayed: false,
            is_own: true,
          },
          ...prev,
        ]);
        setContent("");
        setIsAnonymous(true);
        setShowModal(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePray(prayer: PrayerRequest) {
    if (prayingId === prayer.id) return;
    setPrayingId(prayer.id);
    try {
      const res = await fetch(`/api/prayer-wall/${prayer.id}/pray`, {
        method: "POST",
      });
      const { has_prayed } = await res.json();
      setPrayers((prev) =>
        prev.map((p) =>
          p.id === prayer.id
            ? {
                ...p,
                has_prayed,
                prayer_count: p.prayer_count + (has_prayed ? 1 : -1),
              }
            : p
        )
      );
    } finally {
      setPrayingId(null);
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Prayer Wall 🙏</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-sm shadow-primary/30 active:scale-95 transition-transform"
        >
          Share a Prayer
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && prayers.length === 0 && (
        <div className="flex flex-col items-center text-center gap-3 py-16">
          <span className="text-5xl">🕊️</span>
          <div>
            <p className="font-semibold text-foreground text-sm">No prayers yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Be the first to share a prayer request 🕊️
            </p>
          </div>
        </div>
      )}

      {/* Prayer feed */}
      {!loading && prayers.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {prayers.map((prayer) => {
              const isExpanded = expandedId === prayer.id;
              const authorName = prayer.is_anonymous
                ? "Anonymous"
                : prayer.display_name ?? "Friend";

              return (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bloom-card space-y-3">
                    {/* Content */}
                    <button
                      className="w-full text-left"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : prayer.id)
                      }
                    >
                      <p
                        className={cn(
                          "text-sm text-foreground/85 leading-relaxed",
                          !isExpanded && "line-clamp-3"
                        )}
                      >
                        {prayer.content}
                      </p>
                      {!isExpanded && prayer.content.length > 180 && (
                        <span className="text-xs text-primary font-medium mt-0.5 inline-block">
                          read more
                        </span>
                      )}
                    </button>

                    {/* Meta row */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground/70">
                          {authorName}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo(prayer.created_at)}
                        </span>
                      </div>

                      {/* Pray button */}
                      <button
                        onClick={() => togglePray(prayer)}
                        disabled={prayingId === prayer.id}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all active:scale-95",
                          prayer.has_prayed
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground bg-transparent"
                        )}
                      >
                        {prayingId === prayer.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <span>🙏</span>
                        )}
                        <span>
                          {prayer.has_prayed ? "Praying" : "Praying for you"}
                        </span>
                        {prayer.prayer_count > 0 && (
                          <span
                            className={cn(
                              "ml-0.5 tabular-nums",
                              prayer.has_prayed
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          >
                            · {prayer.prayer_count}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Share a Prayer modal (bottom sheet) */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "rgba(0,0,0,0.45)" }}
          >
            {/* Backdrop tap to close */}
            <div className="flex-1" onClick={() => setShowModal(false)} />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="bg-background rounded-t-3xl px-5 pt-5 pb-10 space-y-4"
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full bg-border mx-auto mb-1" />

              {/* Title row */}
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-base">
                  Share a Prayer Request
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS)
                      setContent(e.target.value);
                  }}
                  placeholder="Share what's on your heart… the community will pray with you. 🙏"
                  rows={5}
                  className={cn(
                    "w-full resize-none rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                  )}
                />
                <span
                  className={cn(
                    "absolute bottom-2.5 right-3 text-[10px] tabular-nums",
                    content.length >= MAX_CHARS
                      ? "text-red-400 font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {content.length}/{MAX_CHARS}
                </span>
              </div>

              {/* Anonymous toggle */}
              <button
                onClick={() => setIsAnonymous((v) => !v)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all",
                  isAnonymous
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                )}
              >
                <span className="text-sm">{isAnonymous ? "🙈" : "👤"}</span>
                {isAnonymous ? "Posting anonymously" : "Posting with your name"}
              </button>

              {/* Submit */}
              <button
                onClick={submitPrayer}
                disabled={!content.trim() || submitting}
                className={cn(
                  "w-full py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]",
                  content.trim() && !submitting
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sharing…
                  </span>
                ) : (
                  "Share Prayer Request 🙏"
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
