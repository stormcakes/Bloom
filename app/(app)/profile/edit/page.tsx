"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Check } from "lucide-react";
import type {
  EmotionalGoal,
  BibleFamiliarity,
  LifeSeason,
  TonePreference,
} from "@/types";

// ─── Option sets ─────────────────────────────────────────────────────────────

const GOAL_OPTIONS: { value: EmotionalGoal; label: string; emoji: string }[] = [
  { value: "anxiety", label: "Find peace", emoji: "🕊️" },
  { value: "confidence", label: "Build confidence", emoji: "💪" },
  { value: "discipline", label: "Stay disciplined", emoji: "📅" },
  { value: "healing", label: "Heal & recover", emoji: "🩹" },
  { value: "forgiveness", label: "Find forgiveness", emoji: "🤍" },
  { value: "purpose", label: "Discover purpose", emoji: "🌟" },
  { value: "loneliness", label: "Feel less alone", emoji: "🤝" },
  { value: "consistency", label: "Grow my faith", emoji: "🌱" },
  { value: "closer_to_god", label: "Feel closer to God", emoji: "✝️" },
  { value: "peace", label: "Find inner peace", emoji: "☮️" },
  { value: "joy", label: "Rediscover joy", emoji: "😊" },
  { value: "strength", label: "Find strength", emoji: "⚡" },
];

const FAMILIARITY_OPTIONS: { value: BibleFamiliarity; label: string; desc: string }[] = [
  { value: "never_read", label: "Never read it", desc: "Starting from scratch" },
  { value: "beginner", label: "Beginner", desc: "Read a little" },
  { value: "some_knowledge", label: "Some knowledge", desc: "Know the basics" },
  { value: "regular_reader", label: "Regular reader", desc: "Read often" },
  { value: "deep_student", label: "Deep student", desc: "Study deeply" },
];

const SEASON_OPTIONS: { value: LifeSeason; label: string; emoji: string }[] = [
  { value: "new_believer", label: "New believer", emoji: "🌱" },
  { value: "returning_to_faith", label: "Returning to faith", emoji: "🔄" },
  { value: "growing_deeper", label: "Growing deeper", emoji: "🌳" },
  { value: "going_through_hardship", label: "Going through hardship", emoji: "⛈️" },
  { value: "seeking_purpose", label: "Seeking purpose", emoji: "🌟" },
  { value: "raising_family", label: "Raising a family", emoji: "👨‍👩‍👧" },
  { value: "student_life", label: "Student life", emoji: "📚" },
  { value: "career_focused", label: "Career focused", emoji: "💼" },
  { value: "retirement", label: "Retirement", emoji: "🌅" },
  { value: "grief_or_loss", label: "Grief or loss", emoji: "🕯️" },
];

const TONE_OPTIONS: { value: TonePreference; label: string; desc: string }[] = [
  { value: "gentle_encouraging", label: "Gentle & encouraging", desc: "Warm, supportive, soft" },
  { value: "direct_firm", label: "Direct & firm", desc: "Straight to the point" },
  { value: "conversational_casual", label: "Conversational", desc: "Like a friend" },
  { value: "poetic_reflective", label: "Poetic & reflective", desc: "Lyrical, thoughtful" },
  { value: "teaching_educational", label: "Teaching", desc: "Informative, structured" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileEditPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [displayName, setDisplayName] = useState("");
  const [goals, setGoals] = useState<EmotionalGoal[]>([]);
  const [familiarity, setFamiliarity] = useState<BibleFamiliarity>("beginner");
  const [season, setSeason] = useState<LifeSeason>("growing_deeper");
  const [tone, setTone] = useState<TonePreference>("gentle_encouraging");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("user_profiles")
        .select("display_name, emotional_goals, bible_familiarity, life_season, tone_preference")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name ?? "");
        setGoals(data.emotional_goals ?? []);
        setFamiliarity(data.bible_familiarity ?? "beginner");
        setSeason(data.life_season ?? "growing_deeper");
        setTone(data.tone_preference ?? "gentle_encouraging");
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const toggleGoal = (g: EmotionalGoal) => {
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handleSave = () => {
    if (!displayName.trim()) { setError("Name can't be empty"); return; }
    setError("");

    startTransition(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          display_name: displayName.trim(),
          emotional_goals: goals,
          bible_familiarity: familiarity,
          life_season: season,
          tone_preference: tone,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        setError("Failed to save. Please try again.");
        return;
      }

      setSaved(true);
      setTimeout(() => router.push("/profile"), 800);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-6 pb-32 gap-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Edit Profile</h1>
      </div>

      {/* Name */}
      <section className="bloom-card space-y-2">
        <label className="text-sm font-semibold text-foreground">Your name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="What should we call you?"
          className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
        />
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </section>

      {/* Goals */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground px-1">What are you working on?</h2>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map(({ value, label, emoji }) => {
            const active = goals.includes(value);
            return (
              <button
                key={value}
                onClick={() => toggleGoal(value)}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-left text-sm font-medium transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground"
                }`}
              >
                <span className="text-base">{emoji}</span>
                <span className="leading-tight">{label}</span>
                {active && <Check className="h-3.5 w-3.5 ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Life season */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground px-1">Your current season</h2>
        <div className="grid grid-cols-2 gap-2">
          {SEASON_OPTIONS.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setSeason(value)}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-left text-sm font-medium transition-all ${
                season === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground"
              }`}
            >
              <span className="text-base">{emoji}</span>
              <span className="leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Bible familiarity */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground px-1">Bible familiarity</h2>
        <div className="bloom-card p-0 overflow-hidden divide-y divide-border/40">
          {FAMILIARITY_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setFamiliarity(value)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                familiarity === value ? "bg-primary/8" : "hover:bg-muted/40"
              }`}
            >
              <div className="flex-1">
                <p className={`text-sm font-medium ${familiarity === value ? "text-primary" : "text-foreground"}`}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              {familiarity === value && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Tone */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground px-1">Devotional tone</h2>
        <div className="bloom-card p-0 overflow-hidden divide-y divide-border/40">
          {TONE_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => setTone(value)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                tone === value ? "bg-primary/8" : "hover:bg-muted/40"
              }`}
            >
              <div className="flex-1">
                <p className={`text-sm font-medium ${tone === value ? "text-primary" : "text-foreground"}`}>
                  {label}
                </p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              {tone === value && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Save button — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-background/90 backdrop-blur-sm border-t border-border/30">
        <button
          onClick={handleSave}
          disabled={isPending || saved}
          className="w-full h-14 rounded-2xl font-bold text-white text-base shadow-lg active:scale-95 transition-all disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #E6567A 0%, #C4458F 100%)" }}
        >
          {saved ? "✓ Saved!" : isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
