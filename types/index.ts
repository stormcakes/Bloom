// ─── User & Profile ────────────────────────────────────────────────────────

export type AgeRange = "under_13" | "13_17" | "18_24" | "25_34" | "35_49" | "50_plus";

export type BibleFamiliarity =
  | "never_read"
  | "beginner"
  | "some_knowledge"
  | "regular_reader"
  | "deep_student";

export type LifeSeason =
  | "new_believer"
  | "returning_to_faith"
  | "growing_deeper"
  | "going_through_hardship"
  | "seeking_purpose"
  | "raising_family"
  | "student_life"
  | "career_focused"
  | "retirement"
  | "grief_or_loss";

export type EmotionalGoal =
  | "anxiety"
  | "confidence"
  | "discipline"
  | "healing"
  | "forgiveness"
  | "purpose"
  | "loneliness"
  | "consistency"
  | "closer_to_god"
  | "peace"
  | "joy"
  | "strength";

export type TonePreference =
  | "gentle_encouraging"
  | "direct_firm"
  | "conversational_casual"
  | "poetic_reflective"
  | "teaching_educational";

export type BloomTheme =
  | "cozy"
  | "soft_feminine"
  | "gamer"
  | "minimalist"
  | "healing_season"
  | "student"
  | "busy_professional"
  | "kids_mode"
  | "beginner_bible";

export type SubscriptionTier = "free" | "premium" | "family";

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  age_range: AgeRange;
  bible_familiarity: BibleFamiliarity;
  life_season: LifeSeason;
  emotional_goals: EmotionalGoal[];
  tone_preference: TonePreference;
  theme: BloomTheme;
  interests: string[];
  subscription_tier: SubscriptionTier;
  streak_current: number;
  streak_longest: number;
  devotionals_completed: number;
  garden_stage: GardenStage;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Devotional ─────────────────────────────────────────────────────────────

export interface Devotional {
  id: string;
  user_id: string;
  date: string;
  title: string;
  scripture_reference: string;
  scripture_text: string;
  reflection: string;
  simple_explanation: string;
  real_life_application: string;
  prayer: string;
  journal_prompt: string;
  action_step: string;
  theme: BloomTheme;
  emotional_goal: EmotionalGoal;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface DevotionalGenerationParams {
  userProfile: Pick<
    UserProfile,
    | "display_name"
    | "age_range"
    | "bible_familiarity"
    | "life_season"
    | "emotional_goals"
    | "tone_preference"
    | "theme"
    | "interests"
  >;
  date: string;
  focusGoal?: EmotionalGoal;
}

// ─── Journal ─────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  user_id: string;
  devotional_id?: string;
  title?: string;
  content: string;
  mood?: string;
  tags: string[];
  is_prayer: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  messages: ChatMessage[];
  context?: string;
  created_at: string;
  updated_at: string;
}

// ─── Garden / Growth ─────────────────────────────────────────────────────────

export type GardenStage =
  | "seed"
  | "sprout"
  | "bud"
  | "bloom"
  | "full_bloom"
  | "garden";

export interface GardenMilestone {
  stage: GardenStage;
  devotionalsRequired: number;
  label: string;
  encouragement: string;
  emoji: string;
}

// ─── Theme Config ─────────────────────────────────────────────────────────────

export interface ThemeConfig {
  id: BloomTheme;
  label: string;
  description: string;
  emoji: string;
  gradient: {
    from: string;
    to: string;
    card: string;
  };
  cssVars: Record<string, string>;
  aiPersonaHint: string;
  targetAudience: string;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export interface OnboardingState {
  step: number;
  display_name: string;
  age_range: AgeRange | null;
  bible_familiarity: BibleFamiliarity | null;
  life_season: LifeSeason | null;
  emotional_goals: EmotionalGoal[];
  tone_preference: TonePreference | null;
  theme: BloomTheme | null;
  interests: string[];
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
