-- ============================================================
-- BLOOM — Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE age_range AS ENUM (
  'under_13', '13_17', '18_24', '25_34', '35_49', '50_plus'
);

CREATE TYPE bible_familiarity AS ENUM (
  'never_read', 'beginner', 'some_knowledge', 'regular_reader', 'deep_student'
);

CREATE TYPE life_season AS ENUM (
  'new_believer', 'returning_to_faith', 'growing_deeper', 'going_through_hardship',
  'seeking_purpose', 'raising_family', 'student_life', 'career_focused',
  'retirement', 'grief_or_loss'
);

CREATE TYPE emotional_goal AS ENUM (
  'anxiety', 'confidence', 'discipline', 'healing', 'forgiveness', 'purpose',
  'loneliness', 'consistency', 'closer_to_god', 'joy', 'peace', 'strength'
);

CREATE TYPE tone_preference AS ENUM (
  'gentle_encouraging', 'direct_firm', 'conversational_casual',
  'poetic_reflective', 'teaching_educational'
);

CREATE TYPE bloom_theme AS ENUM (
  'cozy', 'soft_feminine', 'gamer', 'minimalist', 'healing_season',
  'student', 'busy_professional', 'kids_mode', 'beginner_bible'
);

CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'family');

CREATE TYPE garden_stage AS ENUM (
  'seed', 'sprout', 'bud', 'bloom', 'full_bloom', 'garden'
);

-- ─── USER PROFILES ───────────────────────────────────────────────────────────

CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          TEXT NOT NULL DEFAULT '',
  age_range             age_range,
  bible_familiarity     bible_familiarity DEFAULT 'beginner',
  life_season           life_season,
  emotional_goals       emotional_goal[] DEFAULT '{}',
  tone_preference       tone_preference DEFAULT 'gentle_encouraging',
  theme                 bloom_theme DEFAULT 'cozy',
  interests             TEXT[] DEFAULT '{}',
  subscription_tier     subscription_tier DEFAULT 'free',
  streak_current        INTEGER DEFAULT 0,
  streak_longest        INTEGER DEFAULT 0,
  devotionals_completed INTEGER DEFAULT 0,
  garden_stage          garden_stage DEFAULT 'seed',
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  last_active_date      DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── DEVOTIONALS ─────────────────────────────────────────────────────────────

CREATE TABLE devotionals (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date                  DATE NOT NULL,
  title                 TEXT NOT NULL,
  scripture_reference   TEXT NOT NULL,
  scripture_text        TEXT NOT NULL,
  reflection            TEXT NOT NULL,
  simple_explanation    TEXT NOT NULL,
  real_life_application TEXT NOT NULL,
  prayer                TEXT NOT NULL,
  journal_prompt        TEXT NOT NULL,
  action_step           TEXT NOT NULL,
  theme                 bloom_theme NOT NULL,
  emotional_goal        emotional_goal,
  is_completed          BOOLEAN DEFAULT FALSE,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ─── JOURNAL ENTRIES ─────────────────────────────────────────────────────────

CREATE TABLE journal_entries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  devotional_id  UUID REFERENCES devotionals(id) ON DELETE SET NULL,
  title          TEXT,
  content        TEXT NOT NULL,
  mood           TEXT,
  tags           TEXT[] DEFAULT '{}',
  is_prayer      BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CHAT SESSIONS ────────────────────────────────────────────────────────────

CREATE TABLE chat_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  context    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CHAT MESSAGES ────────────────────────────────────────────────────────────

CREATE TABLE chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GARDEN MILESTONES ────────────────────────────────────────────────────────

CREATE TABLE garden_achievements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage        garden_stage NOT NULL,
  achieved_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stage)
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_achievements ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users own their profile"
  ON user_profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their devotionals"
  ON devotionals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their journal"
  ON journal_entries FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their chat sessions"
  ON chat_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their chat messages"
  ON chat_messages FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their achievements"
  ON garden_achievements FOR ALL USING (auth.uid() = user_id);

-- ─── FUNCTIONS & TRIGGERS ────────────────────────────────────────────────────

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- Update garden stage based on devotionals completed
CREATE OR REPLACE FUNCTION update_garden_stage()
RETURNS TRIGGER AS $$
DECLARE
  completed_count INTEGER;
  new_stage garden_stage;
BEGIN
  SELECT devotionals_completed INTO completed_count
  FROM user_profiles
  WHERE user_id = NEW.user_id;

  new_stage := CASE
    WHEN completed_count >= 100 THEN 'garden'::garden_stage
    WHEN completed_count >= 50  THEN 'full_bloom'::garden_stage
    WHEN completed_count >= 21  THEN 'bloom'::garden_stage
    WHEN completed_count >= 7   THEN 'bud'::garden_stage
    WHEN completed_count >= 3   THEN 'sprout'::garden_stage
    ELSE 'seed'::garden_stage
  END;

  UPDATE user_profiles
  SET garden_stage = new_stage
  WHERE user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER devotional_completed_garden
  AFTER UPDATE OF is_completed ON devotionals
  FOR EACH ROW
  WHEN (NEW.is_completed = TRUE AND OLD.is_completed = FALSE)
  EXECUTE PROCEDURE update_garden_stage();

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_devotionals_user_date ON devotionals(user_id, date DESC);
CREATE INDEX idx_journal_user_created ON journal_entries(user_id, created_at DESC);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at ASC);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id, created_at DESC);
