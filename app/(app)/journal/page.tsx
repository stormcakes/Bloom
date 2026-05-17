"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Heart, Trash2, Loader2, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, todayISO } from "@/lib/utils";
import type { JournalEntry } from "@/types";
import { cn } from "@/lib/utils";

type Tab = "today" | "week" | "all";

const DAILY_PROMPTS = [
  "What is one thing you're grateful for today?",
  "Where did you see God at work this week?",
  "What is one area you want God to help you trust Him more?",
  "Write a prayer for someone you love.",
  "What scripture has been on your heart lately?",
];

export default function JournalPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState("");
  const [isPrayer, setIsPrayer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const todayPrompt = DAILY_PROMPTS[new Date().getDay() % DAILY_PROMPTS.length];

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    setLoading(true);
    const res = await fetch("/api/journal");
    const { data } = await res.json();
    setEntries(data ?? []);
    setLoading(false);
  }

  async function saveEntry() {
    if (!content.trim()) return;
    setSaving(true);
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, is_prayer: isPrayer }),
    });
    const { data } = await res.json();
    if (data) setEntries((prev) => [data, ...prev]);
    setContent("");
    setIsPrayer(false);
    setComposing(false);
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/journal?id=${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const today = todayISO();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const filteredEntries = entries.filter((e) => {
    if (tab === "today") return e.created_at.startsWith(today);
    if (tab === "week") return new Date(e.created_at) >= weekAgo;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-foreground">Journal</h1>
        <button
          onClick={() => setComposing(true)}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm shadow-primary/30 active:scale-95 transition-transform"
        >
          <Edit3 className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-5">
        {(["today", "week", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all",
              tab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {t === "today" ? "Today" : t === "week" ? "This Week" : "All Entries"}
          </button>
        ))}
      </div>

      {/* Today's Prompt */}
      {tab === "today" && (
        <div className="bloom-card mb-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Today&apos;s Prompt</p>
              <p className="text-sm font-medium text-foreground leading-relaxed">{todayPrompt}</p>
            </div>
            <span className="text-2xl flex-shrink-0">🌸</span>
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Write your thoughts…"
              value={composing ? content : ""}
              onChange={(e) => { setComposing(true); setContent(e.target.value); }}
              rows={3}
              className="bg-muted/40 border-0 focus-visible:ring-1 text-sm resize-none"
            />
            {content.trim() && (
              <Button size="sm" onClick={saveEntry} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Entry"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Compose overlay for non-today tabs */}
      <AnimatePresence>
        {composing && tab !== "today" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            <div className="flex-1" onClick={() => setComposing(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-background rounded-t-3xl p-5 pb-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">New Entry</h3>
                <button onClick={() => setComposing(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your heart?"
                rows={6}
                autoFocus
                className="text-sm"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsPrayer((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                    isPrayer ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  <Heart className="h-3.5 w-3.5" />
                  {isPrayer ? "Prayer" : "Mark as Prayer"}
                </button>
                <Button size="sm" onClick={saveEntry} disabled={!content.trim() || saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Journal heading */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">My Journal</p>
        <p className="text-xs text-muted-foreground">{filteredEntries.length} {filteredEntries.length === 1 ? "entry" : "entries"}</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredEntries.length === 0 && (
        <div className="flex flex-col items-center text-center gap-3 py-12">
          <span className="text-4xl">📓</span>
          <div>
            <p className="font-medium text-foreground text-sm">No entries yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              This is your safe space to write to God and reflect.
            </p>
          </div>
        </div>
      )}

      {/* Entry list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
              >
                <div className={cn(
                  "bloom-card space-y-2",
                  entry.is_prayer && "border-purple-200 bg-purple-50/30"
                )}>
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {entry.is_prayer && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                              <Heart className="h-2.5 w-2.5" /> Prayer
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</span>
                        </div>
                        <p className={cn(
                          "text-sm text-foreground/85 leading-relaxed",
                          !isExpanded && "line-clamp-2"
                        )}>
                          {entry.content}
                        </p>
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2 border-t border-border/40"
                      >
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete entry
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
