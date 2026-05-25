
-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  pretest_done BOOLEAN DEFAULT FALSE,
  streak_count INTEGER DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

-- 3. QUIZ SESSIONS
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  is_pretest BOOLEAN DEFAULT FALSE,
  is_timed BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
  ON public.quiz_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);

-- 4. PERFORMANCE 
CREATE TABLE IF NOT EXISTS public.performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  accuracy_rate FLOAT DEFAULT 0,
  total_answered INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

ALTER TABLE public.performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own performance"
  ON public.performance FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_performance_user_id ON public.performance(user_id);

-- 5. PRETEST RESULTS 
CREATE TABLE IF NOT EXISTS public.pretest_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  accuracy DECIMAL(5,2) GENERATED ALWAYS AS ((score::DECIMAL / NULLIF(total_questions, 0)) * 100) STORED,
  weak_category BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

ALTER TABLE public.pretest_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own pretest results"
  ON public.pretest_results FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_pretest_results_user_id ON public.pretest_results(user_id);
CREATE INDEX IF NOT EXISTS idx_pretest_results_category ON public.pretest_results(category_id);

-- 6. VERIFICATION CODES (for OTP login)
CREATE TABLE IF NOT EXISTS public.verification_codes (
  email TEXT PRIMARY KEY,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert verification codes"
  ON public.verification_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes by email"
  ON public.verification_codes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update verification codes by email"
  ON public.verification_codes FOR UPDATE
  USING (true);

-- ============================================
-- SEED DATA (Fixed category names)
-- ============================================
INSERT INTO public.categories (name, description) VALUES
  ('Verbal Ability', 'Grammar, vocabulary, and reading comprehension'),
  ('Numerical Ability', 'Basic arithmetic, algebra, geometry, and data interpretation'),
  ('Analytical Ability', 'Logical reasoning, analogies, patterns, and critical thinking'),
  ('General Information', 'Philippine Constitution, RA 6713, environmental laws, and current events')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (NEW.id, NEW.email, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();