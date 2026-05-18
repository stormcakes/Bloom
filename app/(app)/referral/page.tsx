"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Copy, Share2, Check } from "lucide-react";

const BASE_URL = "https://bloom-ten-fawn.vercel.app";

interface ReferralData {
  code: string | null;
  referral_count: number;
  reward_months: number;
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [applyStatus, setApplyStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    async function loadReferral() {
      try {
        const res = await fetch("/api/referral");
        const json = await res.json();
        const referralData: ReferralData = json.data ?? { code: null, referral_count: 0, reward_months: 0 };

        if (!referralData.code) {
          const genRes = await fetch("/api/referral/generate", { method: "POST" });
          const genJson = await genRes.json();
          referralData.code = genJson.code ?? null;
        }

        setData(referralData);
      } catch (e) {
        console.error("Failed to load referral data", e);
      } finally {
        setLoading(false);
      }
    }

    loadReferral();
  }, []);

  const referralUrl = data?.code ? `${BASE_URL}/signup?ref=${data.code}` : "";

  async function copyLink() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement("textarea");
      el.value = referralUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function shareLink() {
    if (!referralUrl) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Bloom",
          text: "I've been using Bloom for daily faith devotionals. Join me and we both get 1 month of Premium free!",
          url: referralUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy
      }
    }
    await copyLink();
  }

  async function applyCode() {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    setApplyStatus(null);
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setApplyStatus({ type: "success", message: "Code applied! You both get 1 month of Premium." });
        setManualCode("");
      } else {
        setApplyStatus({ type: "error", message: json.error ?? "Failed to apply code." });
      }
    } catch {
      setApplyStatus({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28 gap-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="w-9 h-9 rounded-full bg-white border border-border/60 flex items-center justify-center shadow-sm hover:bg-muted/40 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Invite Friends 🌸</h1>
      </div>

      {/* Hero card */}
      <div
        className="bloom-card relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #E6567A 0%, #C4458F 100%)" }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none flex items-center justify-end pr-4 text-8xl">
          🌸
        </div>
        <div className="relative space-y-2">
          <p className="text-white font-bold text-lg leading-snug">Give a month, get a month</p>
          <p className="text-white/80 text-sm leading-relaxed">
            Invite a friend to Bloom. When they join and complete their first devotional,
            you both get 1 month of Premium free.
          </p>
        </div>
      </div>

      {/* Referral link card */}
      <div className="bloom-card space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your referral link</p>
        {loading ? (
          <div className="h-10 rounded-xl bg-muted animate-pulse" />
        ) : (
          <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5">
            <p className="flex-1 text-xs text-foreground truncate font-mono">{referralUrl}</p>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={copyLink}
            disabled={loading || !referralUrl}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied! ✓
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </button>
          <button
            onClick={shareLink}
            disabled={loading || !referralUrl}
            className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-border/60 text-foreground text-sm font-semibold hover:bg-muted/40 active:scale-95 transition-all disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bloom-card text-center py-4 space-y-1">
          <p className="text-2xl font-bold text-foreground">{data?.referral_count ?? 0}</p>
          <p className="text-xs text-muted-foreground">friends invited</p>
        </div>
        <div className="bloom-card text-center py-4 space-y-1">
          <p className="text-2xl font-bold text-foreground">{data?.reward_months ?? 0}</p>
          <p className="text-xs text-muted-foreground">months earned</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bloom-card space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">How it works</p>
        {[
          { emoji: "🔗", title: "Share your link", desc: "Send your unique link to a friend" },
          { emoji: "🌸", title: "Friend signs up", desc: "They create an account using your link" },
          { emoji: "🎁", title: "Both get 1 free month", desc: "Premium unlocked for both of you" },
        ].map(({ emoji, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg">
              {emoji}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Apply a code manually */}
      <div className="bloom-card space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Have a friend&apos;s code?</p>
        <p className="text-xs text-muted-foreground">Enter a referral code to get your free month of Premium.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="e.g. JAYA1K3P"
            maxLength={8}
            className="flex-1 h-11 px-3 rounded-xl border border-border/60 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/50"
          />
          <button
            onClick={applyCode}
            disabled={applying || !manualCode.trim()}
            className="px-4 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {applying ? "Applying…" : "Apply"}
          </button>
        </div>
        {applyStatus && (
          <p
            className={`text-xs font-medium ${
              applyStatus.type === "success" ? "text-green-600" : "text-rose-500"
            }`}
          >
            {applyStatus.message}
          </p>
        )}
      </div>

    </div>
  );
}
