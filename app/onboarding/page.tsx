"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { ChevronLeft, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type {
  OnboardingState,
  BibleFamiliarity,
  LifeSeason,
  EmotionalGoal,
  BloomTheme,
} from "@/types";

const TOTAL_STEPS = 5;
const FLOWER_STAGES = ["🌱", "🌿", "🌸", "🌺", "🌻"];

// ── Data ────────────────────────────────────────────────────────────────────

const GOALS: {
  value: EmotionalGoal;
  label: string;
  icon: string;
  border: string;
  bg: string;
  activeBorder: string;
}[] = [
  { value: "consistency",   label: "Grow my faith",        icon: "🌱", bg: "bg-rose-50",   border: "border-rose-200",   activeBorder: "border-rose-500"   },
  { value: "closer_to_god", label: "Feel closer to God",   icon: "🤍", bg: "bg-purple-50", border: "border-purple-200", activeBorder: "border-purple-500" },
  { value: "purpose",       label: "Understand the Bible", icon: "📖", bg: "bg-amber-50",  border: "border-amber-200",  activeBorder: "border-amber-500"  },
  { value: "peace",         label: "Find peace",           icon: "🕊️", bg: "bg-sky-50",   border: "border-sky-200",    activeBorder: "border-sky-500"    },
  { value: "discipline",    label: "Daily encouragement",  icon: "☀️", bg: "bg-yellow-50", border: "border-yellow-200", activeBorder: "border-yellow-500" },
  { value: "anxiety",       label: "Heal from anxiety",    icon: "💙", bg: "bg-blue-50",   border: "border-blue-200",   activeBorder: "border-blue-500"   },
  { value: "healing",       label: "Season of healing",    icon: "🌿", bg: "bg-green-50",  border: "border-green-200",  activeBorder: "border-green-500"  },
  { value: "confidence",    label: "Build confidence",     icon: "✨", bg: "bg-pink-50",   border: "border-pink-200",   activeBorder: "border-pink-500"   },
];

const DESCRIPTIONS: { value: LifeSeason; label: string; icon: string }[] = [
  { value: "student_life",           label: "I'm a student",                 icon: "🎓" },
  { value: "career_focused",         label: "I'm a busy professional",       icon: "💼" },
  { value: "raising_family",         label: "I'm a stay-at-home parent",     icon: "🏡" },
  { value: "going_through_hardship", label: "I'm in a season of healing",    icon: "💙" },
  { value: "new_believer",           label: "I'm just exploring my faith",   icon: "✨" },
  { value: "growing_deeper",         label: "Other",                         icon: "🌿" },
];

const THEME_OPTIONS: { id: BloomTheme; label: string; emoji: string; from: string; to: string; art: string }[] = [
  { id: "soft_feminine", label: "Soft & Feminine", emoji: "🌸", from: "#F4C2D8", to: "#FAF0F7", art: "🌸🌷🌸" },
  { id: "cozy",          label: "Cozy",            emoji: "☕", from: "#F7C5A0", to: "#FDF8F0", art: "☕📖🕯️" },
  { id: "minimalist",    label: "Minimalist",      emoji: "◻️", from: "#E8E8E8", to: "#F8F8F8", art: "✦"     },
  { id: "gamer",         label: "Gamer",           emoji: "🎮", from: "#4A1D8C", to: "#1A0A3C", art: "🎮⚔️🏆" },
  { id: "healing_season",label: "Nature",          emoji: "🌿", from: "#A8C5A0", to: "#E8F4E8", art: "🌿🌱🍃" },
  { id: "kids_mode",     label: "Kids",            emoji: "🌈", from: "#FFD580", to: "#FFF4CC", art: "🌈⭐🦁" },
];

const BIBLE_LEVELS: { value: BibleFamiliarity; label: string; desc: string }[] = [
  { value: "never_read",    label: "New to the Bible",  desc: "I'm just getting started" },
  { value: "beginner",      label: "A little familiar", desc: "I know some stories"       },
  { value: "some_knowledge",label: "Pretty familiar",   desc: "I read sometimes"          },
  { value: "regular_reader",label: "Very familiar",     desc: "I read often"              },
];

// ── Floating garden background ───────────────────────────────────────────────

const GARDEN_FLOWERS = [
  { emoji: "🌸", x: "4%",  y: "12%", size: 28, speed: 9,  rotate: 15,  delay: 0    },
  { emoji: "🌷", x: "88%", y: "7%",  size: 22, speed: 12, rotate: -20, delay: 1.2  },
  { emoji: "🌸", x: "14%", y: "68%", size: 18, speed: 14, rotate: 10,  delay: 2.5  },
  { emoji: "🌺", x: "91%", y: "52%", size: 26, speed: 8,  rotate: -15, delay: 0.8  },
  { emoji: "🌸", x: "48%", y: "4%",  size: 16, speed: 15, rotate: 25,  delay: 3.1  },
  { emoji: "🌷", x: "72%", y: "78%", size: 20, speed: 11, rotate: -10, delay: 1.8  },
  { emoji: "🌸", x: "28%", y: "88%", size: 14, speed: 13, rotate: 20,  delay: 4.0  },
  { emoji: "🌺", x: "6%",  y: "42%", size: 24, speed: 7,  rotate: -25, delay: 0.4  },
  { emoji: "🌸", x: "62%", y: "28%", size: 16, speed: 16, rotate: 12,  delay: 2.0  },
  { emoji: "🌷", x: "44%", y: "62%", size: 18, speed: 10, rotate: -8,  delay: 3.5  },
];

function FloatingGarden() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {GARDEN_FLOWERS.map((f, i) => (
        <motion.span
          key={i}
          className="absolute select-none"
          style={{ left: f.x, top: f.y, fontSize: f.size, opacity: 0.3 }}
          animate={{
            y: [0, -14, 0],
            rotate: [f.rotate, -f.rotate, f.rotate],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: f.speed,
            delay: f.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {f.emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ── Animation variants ───────────────────────────────────────────────────────

const pageVariants = {
  enter: (dir: number) => ({
    rotateY: dir > 0 ? 50 : -50,
    opacity: 0,
    scale: 0.9,
    z: -120,
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    scale: 1,
    z: 0,
  },
  exit: (dir: number) => ({
    rotateY: dir > 0 ? -50 : 50,
    opacity: 0,
    scale: 0.9,
    z: -120,
  }),
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const slideDown = {
  hidden: { y: -18, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

const slideUp = {
  hidden: { y: 22, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

// ── Reusable card + pill wrappers ────────────────────────────────────────────

function SelectionCard({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      variants={slideUp}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02, boxShadow: "0px 10px 30px rgba(255,105,180,0.2)" }}
      className={cn(
        "relative transition-all duration-200 cursor-pointer",
        selected && "ring-2 ring-rose-500 ring-offset-1",
        className
      )}
    >
      {children}
    </motion.button>
  );
}

function PersonaPill({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <motion.button
      variants={slideUp}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02, boxShadow: "0px 8px 24px rgba(255,105,180,0.18)" }}
      className={cn(
        "flex items-center gap-3 w-full px-5 py-3.5 rounded-full border-2 text-left transition-all duration-200",
        selected
          ? "border-rose-400 bg-rose-50 shadow-[inset_0_1px_8px_rgba(255,105,180,0.15)]"
          : "border-rose-100 bg-white hover:border-rose-300"
      )}
    >
      <span className="text-xl w-7 text-center">{icon}</span>
      <span className={cn("text-sm font-medium", selected ? "text-rose-600" : "text-gray-700")}>
        {label}
      </span>
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto w-5 h-5 rounded-full bg-rose-400 flex items-center justify-center"
        >
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </motion.span>
      )}
    </motion.button>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
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

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("bloom_referral_code", ref.toUpperCase());
  }, [searchParams]);

  function next() { setDirection(1);  setStep((s) => s + 1); }
  function back() { if (step === 1) return; setDirection(-1); setStep((s) => s - 1); }

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

    const storedRef = localStorage.getItem("bloom_referral_code");
    if (storedRef) {
      try {
        await fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: storedRef }),
        });
      } catch { /* non-fatal */ } finally {
        localStorage.removeItem("bloom_referral_code");
      }
    }

    setSaving(false);
    setCelebrating(true);
    setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 2400);
  }

  // ── Celebration screen ─────────────────────────────────────────────────────
  if (celebrating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
        style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FDF6F9 100%)" }}
      >
        <FloatingGarden />
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="relative flex flex-col items-center gap-4 z-10"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-rose-200/60 rounded-full blur-3xl scale-[2]" />
            <motion.span
              animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative text-8xl block"
            >
              🌱
            </motion.span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center space-y-2"
          >
            <h2
              className="text-3xl font-bold text-gray-800"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Your garden is planted!
            </h2>
            <p className="text-gray-500 text-sm">Taking you to Bloom…</p>
          </motion.div>
        </motion.div>
        {[...Array(8)].map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 0],
              y: -140 - i * 18,
              x: (i % 2 === 0 ? 1 : -1) * (25 + i * 18),
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{ duration: 2, delay: 0.15 + i * 0.12, ease: "easeOut" }}
            className="absolute text-2xl pointer-events-none z-10"
            style={{ bottom: "40%", left: "50%" }}
          >
            {i % 3 === 0 ? "🌸" : i % 3 === 1 ? "🌷" : "🌺"}
          </motion.span>
        ))}
      </motion.div>
    );
  }

  const selectedTheme = THEME_OPTIONS.find((t) => t.id === state.theme);

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: "linear-gradient(160deg, #FFF0F5 0%, #FDF6F9 60%, #F5EFFF 100%)" }}
    >
      <FloatingGarden />

      {/* ── Progress bar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-sm">
        <div className="h-1.5 bg-rose-100">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #FB7185, #F472B6)" }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <div className="flex justify-between items-center px-8 py-2">
          {FLOWER_STAGES.map((flower, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center gap-0.5"
              animate={{
                scale: step === i + 1 ? 1.5 : step > i + 1 ? 1.1 : 0.75,
                opacity: step >= i + 1 ? 1 : 0.3,
              }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            >
              <span className="text-base leading-none">{flower}</span>
              {step > i + 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="w-4 h-0.5 rounded-full bg-rose-400"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Nav header ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-16 pb-2">
        <motion.button
          onClick={back}
          disabled={step === 1}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-full bg-white/80 border border-rose-100 flex items-center justify-center disabled:opacity-30 shadow-sm backdrop-blur-sm"
        >
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </motion.button>

        <div className="flex items-center gap-1.5">
          <motion.span
            key={step}
            initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 16 }}
            className="text-xl"
          >
            {FLOWER_STAGES[step - 1]}
          </motion.span>
          <span
            className="font-bold text-rose-400 text-lg"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              filter: "drop-shadow(0 0 8px rgba(255,105,180,0.4))",
            }}
          >
            Bloom
          </span>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-gray-400 hover:text-gray-500 transition-colors px-2 py-2"
        >
          Skip
        </button>
      </div>

      {/* ── Step content ── */}
      <LayoutGroup>
        <div
          className="relative z-10 flex-1 flex flex-col px-5 pt-2 pb-8 overflow-hidden"
          style={{ perspective: "1200px" }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden" }}
              className="flex flex-col gap-5 flex-1"
            >

              {/* ── Step 1: Goals ── */}
              {step === 1 && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-5"
                >
                  <motion.div variants={slideDown}>
                    <h2
                      className="text-[1.6rem] font-bold text-gray-800 leading-tight"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      What brings you to Bloom?
                    </h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Choose all that apply</p>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3">
                    {GOALS.map((goal) => {
                      const selected = state.emotional_goals.includes(goal.value);
                      return (
                        <SelectionCard
                          key={goal.value}
                          selected={selected}
                          onClick={() => toggleGoal(goal.value)}
                          className={cn(
                            "flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 text-center",
                            selected
                              ? `${goal.bg} ${goal.activeBorder} shadow-md`
                              : `${goal.bg} ${goal.border}`
                          )}
                        >
                          <span className="text-2xl">{goal.icon}</span>
                          <span className="text-xs font-semibold text-gray-700 leading-tight">{goal.label}</span>
                          {selected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center"
                            >
                              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                            </motion.div>
                          )}
                        </SelectionCard>
                      );
                    })}
                  </div>

                  <motion.div variants={slideUp}>
                    <motion.button
                      onClick={next}
                      disabled={state.emotional_goals.length === 0}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.01, boxShadow: "0px 12px 32px rgba(255,105,180,0.35)" }}
                      className="w-full h-14 rounded-2xl text-white font-semibold text-base disabled:opacity-40 transition-all"
                      style={{ background: "linear-gradient(135deg, #FB7185, #F472B6)" }}
                    >
                      Continue →
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {/* ── Step 2: Life season ── */}
              {step === 2 && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-5"
                >
                  <motion.div variants={slideDown}>
                    <h2
                      className="text-[1.6rem] font-bold text-gray-800 leading-tight"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      How would you describe yourself?
                    </h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium">This helps us personalize your experience</p>
                  </motion.div>

                  <div className="flex flex-col gap-2.5">
                    {DESCRIPTIONS.map(({ value, label, icon }) => (
                      <PersonaPill
                        key={value}
                        selected={state.life_season === value}
                        onClick={() => {
                          setState((s) => ({ ...s, life_season: value }));
                          setTimeout(next, 180);
                        }}
                        icon={icon}
                        label={label}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Theme ── */}
              {step === 3 && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-5"
                >
                  <motion.div variants={slideDown}>
                    <h2
                      className="text-[1.6rem] font-bold text-gray-800 leading-tight"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      Choose your vibe
                    </h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Pick the style that inspires you most</p>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3">
                    {THEME_OPTIONS.map(({ id, label, emoji, from, to, art }) => {
                      const selected = state.theme === id;
                      return (
                        <SelectionCard
                          key={id}
                          selected={selected}
                          onClick={() => {
                            setState((s) => ({ ...s, theme: id }));
                            setTimeout(next, 200);
                          }}
                          className="rounded-2xl overflow-hidden border-2"
                        >
                          <div
                            className="w-full h-24 flex items-center justify-center relative"
                            style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                          >
                            <span className="text-3xl drop-shadow-sm">{art}</span>
                            {selected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow"
                              >
                                <Check className="h-3.5 w-3.5 text-rose-500" strokeWidth={3} />
                              </motion.div>
                            )}
                          </div>
                          <div className="bg-white px-3 py-2 text-center">
                            <p className="text-xs font-semibold text-gray-700">{emoji} {label}</p>
                          </div>
                        </SelectionCard>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Step 4: Bible familiarity ── */}
              {step === 4 && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-5"
                >
                  <motion.div variants={slideDown} className="text-center">
                    <h2
                      className="text-[1.6rem] font-bold text-gray-800 leading-tight"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      Almost there! 🌸
                    </h2>
                    <p className="text-gray-500 text-sm mt-1 font-medium">What&apos;s your Bible experience?</p>
                  </motion.div>

                  <div className="flex flex-col gap-2.5">
                    {BIBLE_LEVELS.map(({ value, label, desc }) => {
                      const selected = state.bible_familiarity === value;
                      return (
                        <SelectionCard
                          key={value}
                          selected={selected}
                          onClick={() => setState((s) => ({ ...s, bible_familiarity: value }))}
                          className={cn(
                            "flex items-center justify-between px-4 py-4 rounded-2xl border-2 text-left w-full",
                            selected
                              ? "border-rose-400 bg-rose-50 shadow-md"
                              : "border-rose-100 bg-white"
                          )}
                        >
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                          </div>
                          <motion.div
                            animate={selected ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                              selected ? "border-rose-400 bg-rose-400" : "border-gray-300"
                            )}
                          >
                            {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </motion.div>
                        </SelectionCard>
                      );
                    })}
                  </div>

                  <motion.div variants={slideUp} className="space-y-1.5">
                    <p className="text-sm text-gray-600 font-medium">Anything you&apos;d like us to know?</p>
                    <Input
                      value={extraNote}
                      onChange={(e) => setExtraNote(e.target.value)}
                      placeholder="Optional — we read every note 🤍"
                      className="bg-white/80 border-rose-100 rounded-xl focus:border-rose-300 focus:ring-rose-200"
                    />
                  </motion.div>

                  <motion.div variants={slideUp}>
                    <motion.button
                      onClick={next}
                      disabled={!state.bible_familiarity}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.01, boxShadow: "0px 12px 32px rgba(255,105,180,0.35)" }}
                      className="w-full h-14 rounded-2xl text-white font-semibold text-base disabled:opacity-40 transition-all"
                      style={{ background: "linear-gradient(135deg, #FB7185, #F472B6)" }}
                    >
                      Let&apos;s Bloom ✦
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {/* ── Step 5: Ready ── */}
              {step === 5 && (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center text-center gap-6 py-4 flex-1 justify-center"
                >
                  <motion.div variants={slideDown} className="relative">
                    <div className="absolute inset-0 bg-rose-200/50 rounded-full blur-3xl scale-[2]" />
                    <motion.div
                      animate={{ scale: [1, 1.04, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="relative w-32 h-32 rounded-full flex items-center justify-center text-5xl shadow-2xl shadow-rose-200"
                      style={{
                        background: selectedTheme
                          ? `linear-gradient(135deg, ${selectedTheme.from}, ${selectedTheme.to})`
                          : "linear-gradient(135deg, #F4C2D8, #FAF0F7)",
                        filter: "drop-shadow(0 0 15px rgba(255,105,180,0.5))",
                      }}
                    >
                      🌸
                    </motion.div>
                  </motion.div>

                  <motion.div variants={slideDown} className="space-y-2">
                    <h2
                      className="text-3xl font-bold text-gray-800"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      You&apos;re ready! 🎉
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                      Your personalized faith space is ready. A fresh devotional is waiting for you every morning.
                    </p>
                  </motion.div>

                  <motion.div
                    variants={slideUp}
                    className="w-full rounded-2xl border border-rose-100 bg-white/70 backdrop-blur-sm p-4 text-left space-y-2.5"
                  >
                    <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">Your Setup</p>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{selectedTheme?.emoji ?? "🌸"}</span>
                      <span className="font-semibold text-sm text-gray-700">
                        {selectedTheme?.label ?? "Soft & Feminine"} theme
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">📖</span>
                      <span className="font-semibold text-sm text-gray-700">
                        {BIBLE_LEVELS.find((b) => b.value === state.bible_familiarity)?.label ?? "Beginner"}
                      </span>
                    </div>
                    {state.emotional_goals.length > 0 && (
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">🎯</span>
                        <span className="font-semibold text-sm text-gray-700">
                          {state.emotional_goals.length} goal{state.emotional_goals.length > 1 ? "s" : ""} selected
                        </span>
                      </div>
                    )}
                  </motion.div>

                  <motion.div variants={slideUp} className="w-full">
                    <motion.button
                      onClick={finish}
                      disabled={saving}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.01, boxShadow: "0px 16px 40px rgba(255,105,180,0.45)" }}
                      className="w-full h-14 rounded-2xl text-white font-bold text-base disabled:opacity-60 transition-all"
                      style={{
                        background: "linear-gradient(135deg, #FB7185, #F472B6)",
                        filter: "drop-shadow(0 0 15px rgba(255,105,180,0.5))",
                      }}
                    >
                      {saving ? "Setting up your space…" : "Enter Bloom 🌸"}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </div>
  );
}
