"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type {
  OnboardingState,
  AgeRange,
  BibleFamiliarity,
  LifeSeason,
  EmotionalGoal,
  TonePreference,
  BloomTheme,
} from "@/types";
import { THEMES } from "@/config/themes";

const TOTAL_STEPS = 5;

// Step 1: Goals (multi-select grid with icons)
const GOALS: { value: EmotionalGoal; label: string; icon: string; bg: string }[] = [
  { value: "consistency", label: "Grow my faith", icon: "🌱", bg: "bg-rose-50 border-rose-200" },
  { value: "closer_to_god", label: "Feel closer to God", icon: "🤍", bg: "bg-purple-50 border-purple-200" },
  { value: "purpose", label: "Understand the Bible", icon: "📖", bg: "bg-amber-50 border-amber-200" },
  { value: "peace", label: "Find peace", icon: "🕊️", bg: "bg-sky-50 border-sky-200" },
  { value: "discipline", label: "Daily encouragement", icon: "☀️", bg: "bg-yellow-50 border-yellow-200" },
  { value: "anxiety", label: "Heal from anxiety", icon: "💙", bg: "bg-blue-50 border-blue-200" },
  { value: "healing", label: "Season of healing", icon: "🌿", bg: "bg-green-50 border-green-200" },
  { value: "confidence", label: "Build confidence", icon: "✨", bg: "bg-pink-50 border-pink-200" },
];

// Step 2: Describe yourself
const DESCRIPTIONS: { value: LifeSeason; label: string; icon: string }[] = [
  { value: "student_life", label: "I'm a student", icon: "🎓" },
  { value: "career_focused", label: "I'm a busy professional", icon: "💼" },
  { value: "raising_family", label: "I'm a stay-at-home parent", icon: "🏡" },
  { value: "going_through_hardship", label: "I'm in a season of healing", icon: "💙" },
  { value: "new_believer", label: "I'm just exploring my faith", icon: "✨" },
  { value: "growing_deeper", label: "Other", icon: "•••" },
];

// Step 3: Themes with gradient swatches
const THEME_OPTIONS: { id: BloomTheme; label: string; emoji: string; from: string; to: string; art: string }[] = [
  { id: "soft_feminine", label: "Soft & Feminine", emoji: "🌸", from: "#F4C2D8", to: "#FAF0F7", art: "🌸🌷🌸" },
  { id: "cozy", label: "Cozy", emoji: "☕", from: "#F7C5A0", to: "#FDF8F0", art: "☕📖🕯️" },
  { id: "minimalist", label: "Minimalist", emoji: "◻️", from: "#E8E8E8", to: "#F8F8F8", art: "✦" },
  { id: "gamer", label: "Gamer", emoji: "🎮", from: "#4A1D8C", to: "#1A0A3C", art: "🎮⚔️🏆" },
  { id: "healing_season", label: "Nature", emoji: "🌿", from: "#A8C5A0", to: "#E8F4E8", art: "🌿🌱🍃" },
  { id: "kids_mode", label: "Kids", emoji: "🌈", from: "#FFD580", to: "#FFF4CC", art: "🌈⭐🦁" },
];

// Step 4: Bible familiarity
const BIBLE_LEVELS: { value: BibleFamiliarity; label: string; desc: string }[] = [
  { value: "never_read", label: "New to the Bible", desc: "I'm just getting started" },
  { value: "beginner", label: "A little familiar", desc: "I know some stories" },
  { value: "some_knowledge", label: "Pretty familiar", desc: "I read sometimes" },
  { value: "regular_reader", label: "Very familiar", desc: "I read often" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    step: 1,
    display_name: "",
    age_range: null,
    bible_familiarity: null,
    life_season: null,
    emotional_goals: [],
    tone_preference: "gentle_encouraging",
    theme: null,
    interests: [],
  });
  const [extraNote, setExtraNote] = useState("");

  const progress = (step / TOTAL_STEPS) * 100;

  function next() {
    setDirection(1);
    setStep((s) => s + 1);
  }
  function back() {
    if (step === 1) return;
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function toggleGoal(value: EmotionalGoal) {
    setState((s) => ({
      ...s,
      emotional_goals: s.emotional_goals.includes(value)
        ? s.emotional_goals.filter((g) => g !== value)
        : [...s.emotional_goals, value],
    }));
  }

  async function finish() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const nameFromAuth = user.user_metadata?.full_name || user.email?.split("@")[0] || "Friend";

    await supabase.from("user_profiles").update({
      display_name: state.display_name || nameFromAuth,
      life_season: state.life_season ?? "growing_deeper",
      emotional_goals: state.emotional_goals.length > 0 ? state.emotional_goals : ["closer_to_god"],
      tone_preference: state.tone_preference,
      theme: state.theme ?? "soft_feminine",
      bible_familiarity: state.bible_familiarity ?? "beginner",
      onboarding_completed: true,
    }).eq("user_id", user.id);

    router.push("/dashboard");
    router.refresh();
  }

  const variants = {
    enter: (dir: number) => ({ x: dir * 50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -50, opacity: 0 }),
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FDF6F9 100%)" }}
    >
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-rose-100">
        <motion.div
          className="h-full bg-rose-400 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-2">
        <button
          onClick={back}
          disabled={step === 1}
          className="w-9 h-9 rounded-full bg-white/80 border border-rose-100 flex items-center justify-center disabled:opacity-30 shadow-sm"
        >
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🌸</span>
          <span className="font-bold text-rose-400 text-base">Bloom</span>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col px-5 pt-4 pb-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col gap-6 flex-1"
          >

            {/* Step 1: Goals */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">What brings you to Bloom?</h2>
                  <p className="text-gray-500 text-sm mt-1">Choose all that apply</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map((goal, i) => {
                    const uniqueKey = `${goal.value}-${i}`;
                    const selected = state.emotional_goals.includes(goal.value) &&
                      // Pick first occurrence as selected
                      GOALS.indexOf(goal) === i;
                    return (
                      <button
                        key={uniqueKey}
                        onClick={() => toggleGoal(goal.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all active:scale-[0.97]",
                          selected
                            ? "border-rose-400 bg-rose-50"
                            : `${goal.bg} hover:border-rose-300`
                        )}
                      >
                        <span className="text-2xl">{goal.icon}</span>
                        <span className="text-xs font-semibold text-gray-700 leading-tight">{goal.label}</span>
                      </button>
                    );
                  })}
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 text-base rounded-2xl mt-auto bg-rose-400 hover:bg-rose-500 border-0"
                  onClick={next}
                  disabled={state.emotional_goals.length === 0}
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Describe yourself */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">How would you describe yourself?</h2>
                  <p className="text-gray-500 text-sm mt-1">This helps us personalize your experience</p>
                </div>
                <div className="flex flex-col gap-2">
                  {DESCRIPTIONS.map(({ value, label, icon }) => (
                    <button
                      key={value + label}
                      onClick={() => {
                        setState((s) => ({ ...s, life_season: value }));
                        next();
                      }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all active:scale-[0.98]",
                        state.life_season === value
                          ? "border-rose-400 bg-rose-50"
                          : "border-gray-200 bg-white hover:border-rose-300"
                      )}
                    >
                      <span className="text-xl w-7 text-center">{icon}</span>
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Choose your vibe */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Choose your vibe</h2>
                  <p className="text-gray-500 text-sm mt-1">Pick the style that inspires you most</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {THEME_OPTIONS.map(({ id, label, emoji, from, to, art }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setState((s) => ({ ...s, theme: id }));
                        next();
                      }}
                      className={cn(
                        "rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.97]",
                        state.theme === id ? "border-rose-400 shadow-md" : "border-transparent"
                      )}
                    >
                      <div
                        className="w-full h-24 flex items-center justify-center relative"
                        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                      >
                        <span className="text-4xl drop-shadow-sm">{art}</span>
                      </div>
                      <div className="bg-white px-3 py-2 text-center">
                        <p className="text-xs font-semibold text-gray-700">{emoji} {label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Bible familiarity + optional note */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800">Almost there!</h2>
                  <p className="text-gray-500 text-sm mt-1">What&apos;s your Bible experience?</p>
                </div>
                <div className="flex flex-col gap-2">
                  {BIBLE_LEVELS.map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setState((s) => ({ ...s, bible_familiarity: value }))}
                      className={cn(
                        "flex items-center justify-between px-4 py-4 rounded-2xl border text-left transition-all active:scale-[0.98]",
                        state.bible_familiarity === value
                          ? "border-rose-400 bg-rose-50"
                          : "border-gray-200 bg-white hover:border-rose-300"
                      )}
                    >
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all",
                        state.bible_familiarity === value
                          ? "border-rose-400 bg-rose-400"
                          : "border-gray-300"
                      )}>
                        {state.bible_familiarity === value && (
                          <div className="w-full h-full rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-gray-600 font-medium">Anything you&apos;d like us to know?</p>
                  <Input
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value)}
                    placeholder="Optional"
                    className="bg-white border-gray-200"
                  />
                </div>
                <Button
                  size="lg"
                  className="w-full h-14 text-base rounded-2xl bg-rose-400 hover:bg-rose-500 border-0 gap-2"
                  onClick={next}
                  disabled={!state.bible_familiarity}
                >
                  Let&apos;s Bloom ✦
                </Button>
              </div>
            )}

            {/* Step 5: Ready */}
            {step === 5 && (
              <div className="flex flex-col items-center text-center gap-6 py-4 flex-1 justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-200/40 rounded-full blur-3xl scale-150" />
                  <div
                    className="relative w-28 h-28 rounded-full flex items-center justify-center text-5xl shadow-xl animate-bloom-pulse"
                    style={{
                      background: state.theme
                        ? `linear-gradient(135deg, ${THEME_OPTIONS.find(t => t.id === state.theme)?.from}, ${THEME_OPTIONS.find(t => t.id === state.theme)?.to})`
                        : "linear-gradient(135deg, #F4C2D8, #FAF0F7)"
                    }}
                  >
                    🌸
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-gray-800">
                    You&apos;re ready! 🎉
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                    Your personalized faith space is ready. A fresh devotional is waiting for you every morning.
                  </p>
                </div>
                <div className="w-full bloom-card text-left space-y-2 bg-white/80">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Your Setup</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{THEME_OPTIONS.find(t => t.id === state.theme)?.emoji ?? "🌸"}</span>
                    <span className="font-semibold text-sm text-gray-700">
                      {THEME_OPTIONS.find(t => t.id === state.theme)?.label ?? "Soft & Feminine"} theme
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📖</span>
                    <span className="font-semibold text-sm text-gray-700">
                      {BIBLE_LEVELS.find(b => b.value === state.bible_familiarity)?.label ?? "Beginner"}
                    </span>
                  </div>
                </div>
                <Button
                  size="xl"
                  className="w-full h-14 text-base rounded-2xl bg-rose-400 hover:bg-rose-500 border-0 shadow-lg shadow-rose-200"
                  onClick={finish}
                  disabled={saving}
                >
                  {saving ? "Setting up your space…" : "Enter Bloom 🌸"}
                </Button>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
