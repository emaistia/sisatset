/*
  # SiSatSet Complete Schema - Fresh Setup

  ## Overview
  Full database schema for SiSatSet application.
  This migration ensures all tables, RLS policies, and indexes are properly set up.

  ## Tables
  1. user_profiles - User profile data (mama name, preferences)
  2. children - Children data (name, grade, color)
  3. schedules - School schedules per child per day
  4. homework - Homework tracking
  5. user_recipes - Custom user recipes
  6. meal_plans - Daily meal planning
  7. monthly_budgets - Monthly budget per category
  8. expenses - Daily expenses/transactions
  9. shopping_list - Shopping list items
  10. notes - Notes and reminders
  11. announcements - Parsed school announcements
  12. events - Family and school events
  13. recipes - Default and custom recipes (references auth.users)
  14. weekly_meal_plans - Weekly meal plans (references auth.users)
  15. fridge_inventory - Fridge inventory (references auth.users)
  16. shopping_lists - Shopping lists v2 (references auth.users)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Default recipes readable by all authenticated users
*/

-- Ensure pgcrypto extension is available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  mama_name text NOT NULL,
  show_children_in_greeting boolean DEFAULT true,
  onboarding_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own profile' AND polrelid = 'user_profiles'::regclass) THEN
    CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own profile' AND polrelid = 'user_profiles'::regclass) THEN
    CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own profile' AND polrelid = 'user_profiles'::regclass) THEN
    CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Children Table
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  grade text NOT NULL,
  color text DEFAULT '#FF6B9D',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own children' AND polrelid = 'children'::regclass) THEN
    CREATE POLICY "Users can read own children" ON children FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own children' AND polrelid = 'children'::regclass) THEN
    CREATE POLICY "Users can insert own children" ON children FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own children' AND polrelid = 'children'::regclass) THEN
    CREATE POLICY "Users can update own children" ON children FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own children' AND polrelid = 'children'::regclass) THEN
    CREATE POLICY "Users can delete own children" ON children FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week IN ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu')),
  subjects jsonb DEFAULT '[]'::jsonb,
  uniform text DEFAULT '',
  school_hours text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_child_id_day_of_week_key') THEN
    ALTER TABLE schedules ADD CONSTRAINT schedules_child_id_day_of_week_key UNIQUE (child_id, day_of_week);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read schedules of own children' AND polrelid = 'schedules'::regclass) THEN
    CREATE POLICY "Users can read schedules of own children" ON schedules FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM children WHERE children.id = schedules.child_id AND children.user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert schedules for own children' AND polrelid = 'schedules'::regclass) THEN
    CREATE POLICY "Users can insert schedules for own children" ON schedules FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM children WHERE children.id = child_id AND children.user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update schedules of own children' AND polrelid = 'schedules'::regclass) THEN
    CREATE POLICY "Users can update schedules of own children" ON schedules FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM children WHERE children.id = schedules.child_id AND children.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM children WHERE children.id = child_id AND children.user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete schedules of own children' AND polrelid = 'schedules'::regclass) THEN
    CREATE POLICY "Users can delete schedules of own children" ON schedules FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM children WHERE children.id = schedules.child_id AND children.user_id = auth.uid()));
  END IF;
END $$;

-- Homework Table
CREATE TABLE IF NOT EXISTS homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  deadline date NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE homework ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read homework of own children' AND polrelid = 'homework'::regclass) THEN
    CREATE POLICY "Users can read homework of own children" ON homework FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM children WHERE children.id = homework.child_id AND children.user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert homework for own children' AND polrelid = 'homework'::regclass) THEN
    CREATE POLICY "Users can insert homework for own children" ON homework FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM children WHERE children.id = child_id AND children.user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update homework of own children' AND polrelid = 'homework'::regclass) THEN
    CREATE POLICY "Users can update homework of own children" ON homework FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM children WHERE children.id = homework.child_id AND children.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM children WHERE children.id = child_id AND children.user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete homework of own children' AND polrelid = 'homework'::regclass) THEN
    CREATE POLICY "Users can delete homework of own children" ON homework FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM children WHERE children.id = homework.child_id AND children.user_id = auth.uid()));
  END IF;
END $$;

-- User Recipes Table
CREATE TABLE IF NOT EXISTS user_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text DEFAULT 'Lainnya',
  cooking_time text DEFAULT '',
  difficulty text DEFAULT 'Mudah',
  ingredients jsonb DEFAULT '[]'::jsonb,
  instructions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own recipes' AND polrelid = 'user_recipes'::regclass) THEN
    CREATE POLICY "Users can read own recipes" ON user_recipes FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own recipes' AND polrelid = 'user_recipes'::regclass) THEN
    CREATE POLICY "Users can insert own recipes" ON user_recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own recipes' AND polrelid = 'user_recipes'::regclass) THEN
    CREATE POLICY "Users can update own recipes" ON user_recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own recipes' AND polrelid = 'user_recipes'::regclass) THEN
    CREATE POLICY "Users can delete own recipes" ON user_recipes FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Meal Plans Table
CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  plan_date date NOT NULL,
  meal_type text NOT NULL CHECK (meal_type IN ('sarapan', 'bekal', 'makan_siang', 'makan_malam')),
  recipe_name text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own meal plans' AND polrelid = 'meal_plans'::regclass) THEN
    CREATE POLICY "Users can read own meal plans" ON meal_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own meal plans' AND polrelid = 'meal_plans'::regclass) THEN
    CREATE POLICY "Users can insert own meal plans" ON meal_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own meal plans' AND polrelid = 'meal_plans'::regclass) THEN
    CREATE POLICY "Users can update own meal plans" ON meal_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own meal plans' AND polrelid = 'meal_plans'::regclass) THEN
    CREATE POLICY "Users can delete own meal plans" ON meal_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Monthly Budgets Table
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  category text NOT NULL,
  planned_amount numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month, year, category)
);

ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own budgets' AND polrelid = 'monthly_budgets'::regclass) THEN
    CREATE POLICY "Users can read own budgets" ON monthly_budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own budgets' AND polrelid = 'monthly_budgets'::regclass) THEN
    CREATE POLICY "Users can insert own budgets" ON monthly_budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own budgets' AND polrelid = 'monthly_budgets'::regclass) THEN
    CREATE POLICY "Users can update own budgets" ON monthly_budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own budgets' AND polrelid = 'monthly_budgets'::regclass) THEN
    CREATE POLICY "Users can delete own budgets" ON monthly_budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  payment_method text DEFAULT 'Cash',
  cashback numeric(12,2) DEFAULT 0,
  paid boolean DEFAULT false NOT NULL,
  recurring boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own expenses' AND polrelid = 'expenses'::regclass) THEN
    CREATE POLICY "Users can read own expenses" ON expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own expenses' AND polrelid = 'expenses'::regclass) THEN
    CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own expenses' AND polrelid = 'expenses'::regclass) THEN
    CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own expenses' AND polrelid = 'expenses'::regclass) THEN
    CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Shopping List Table
CREATE TABLE IF NOT EXISTS shopping_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  item text NOT NULL,
  quantity text DEFAULT '1',
  price numeric(12,2) DEFAULT 0,
  category text DEFAULT 'Lainnya',
  checked boolean DEFAULT false,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own shopping list' AND polrelid = 'shopping_list'::regclass) THEN
    CREATE POLICY "Users can read own shopping list" ON shopping_list FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own shopping items' AND polrelid = 'shopping_list'::regclass) THEN
    CREATE POLICY "Users can insert own shopping items" ON shopping_list FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own shopping items' AND polrelid = 'shopping_list'::regclass) THEN
    CREATE POLICY "Users can update own shopping items" ON shopping_list FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own shopping items' AND polrelid = 'shopping_list'::regclass) THEN
    CREATE POLICY "Users can delete own shopping items" ON shopping_list FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  pinned boolean DEFAULT false,
  done boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own notes' AND polrelid = 'notes'::regclass) THEN
    CREATE POLICY "Users can read own notes" ON notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own notes' AND polrelid = 'notes'::regclass) THEN
    CREATE POLICY "Users can insert own notes" ON notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own notes' AND polrelid = 'notes'::regclass) THEN
    CREATE POLICY "Users can update own notes" ON notes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own notes' AND polrelid = 'notes'::regclass) THEN
    CREATE POLICY "Users can delete own notes" ON notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  original_text text NOT NULL,
  parsed_data jsonb DEFAULT '{}'::jsonb,
  announcement_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own announcements' AND polrelid = 'announcements'::regclass) THEN
    CREATE POLICY "Users can read own announcements" ON announcements FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own announcements' AND polrelid = 'announcements'::regclass) THEN
    CREATE POLICY "Users can insert own announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own announcements' AND polrelid = 'announcements'::regclass) THEN
    CREATE POLICY "Users can update own announcements" ON announcements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own announcements' AND polrelid = 'announcements'::regclass) THEN
    CREATE POLICY "Users can delete own announcements" ON announcements FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text DEFAULT 'Lainnya',
  event_date date NOT NULL,
  event_time text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can read own events' AND polrelid = 'events'::regclass) THEN
    CREATE POLICY "Users can read own events" ON events FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert own events' AND polrelid = 'events'::regclass) THEN
    CREATE POLICY "Users can insert own events" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own events' AND polrelid = 'events'::regclass) THEN
    CREATE POLICY "Users can update own events" ON events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own events' AND polrelid = 'events'::regclass) THEN
    CREATE POLICY "Users can delete own events" ON events FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Recipes Table (references auth.users for default recipes)
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '🍽️',
  category text NOT NULL CHECK (category IN ('sarapan', 'bekal', 'utama')),
  tags text[] DEFAULT '{}',
  time text NOT NULL DEFAULT '30 menit',
  difficulty text NOT NULL DEFAULT 'Sedang' CHECK (difficulty IN ('Mudah', 'Sedang', 'Susah')),
  ingredients jsonb NOT NULL DEFAULT '[]',
  instructions text[] NOT NULL DEFAULT '{}',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view default recipes' AND polrelid = 'recipes'::regclass) THEN
    CREATE POLICY "Users can view default recipes" ON recipes FOR SELECT TO authenticated USING (is_default = true OR auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create own recipes' AND polrelid = 'recipes'::regclass) THEN
    CREATE POLICY "Users can create own recipes" ON recipes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_default = false);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own recipes' AND polrelid = 'recipes'::regclass) THEN
    CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE TO authenticated USING (auth.uid() = user_id AND is_default = false) WITH CHECK (auth.uid() = user_id AND is_default = false);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own recipes' AND polrelid = 'recipes'::regclass) THEN
    CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE TO authenticated USING (auth.uid() = user_id AND is_default = false);
  END IF;
END $$;

-- Weekly Meal Plans Table
CREATE TABLE IF NOT EXISTS weekly_meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week text NOT NULL CHECK (day_of_week IN ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu')),
  meal_type text NOT NULL CHECK (meal_type IN ('sarapan', 'bekal', 'siang', 'malam')),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  week_start_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date, day_of_week, meal_type)
);

ALTER TABLE weekly_meal_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view own meal plans' AND polrelid = 'weekly_meal_plans'::regclass) THEN
    CREATE POLICY "Users can view own meal plans" ON weekly_meal_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create own meal plans' AND polrelid = 'weekly_meal_plans'::regclass) THEN
    CREATE POLICY "Users can create own meal plans" ON weekly_meal_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own meal plans' AND polrelid = 'weekly_meal_plans'::regclass) THEN
    CREATE POLICY "Users can update own meal plans" ON weekly_meal_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own meal plans' AND polrelid = 'weekly_meal_plans'::regclass) THEN
    CREATE POLICY "Users can delete own meal plans" ON weekly_meal_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Fridge Inventory Table
CREATE TABLE IF NOT EXISTS fridge_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity text NOT NULL,
  category text NOT NULL CHECK (category IN ('Protein', 'Sayur', 'Karbohidrat', 'Bumbu', 'Lainnya')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fridge_inventory ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view own fridge inventory' AND polrelid = 'fridge_inventory'::regclass) THEN
    CREATE POLICY "Users can view own fridge inventory" ON fridge_inventory FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create own fridge items' AND polrelid = 'fridge_inventory'::regclass) THEN
    CREATE POLICY "Users can create own fridge items" ON fridge_inventory FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own fridge items' AND polrelid = 'fridge_inventory'::regclass) THEN
    CREATE POLICY "Users can update own fridge items" ON fridge_inventory FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own fridge items' AND polrelid = 'fridge_inventory'::regclass) THEN
    CREATE POLICY "Users can delete own fridge items" ON fridge_inventory FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Shopping Lists Table (v2)
CREATE TABLE IF NOT EXISTS shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity text NOT NULL DEFAULT '1',
  category text NOT NULL DEFAULT 'Lainnya',
  completed boolean DEFAULT false,
  from_meal_plan boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view own shopping lists' AND polrelid = 'shopping_lists'::regclass) THEN
    CREATE POLICY "Users can view own shopping lists" ON shopping_lists FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create own shopping items' AND polrelid = 'shopping_lists'::regclass) THEN
    CREATE POLICY "Users can create own shopping items" ON shopping_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update own shopping items' AND polrelid = 'shopping_lists'::regclass) THEN
    CREATE POLICY "Users can update own shopping items" ON shopping_lists FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete own shopping items' AND polrelid = 'shopping_lists'::regclass) THEN
    CREATE POLICY "Users can delete own shopping items" ON shopping_lists FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_children_user_id ON children(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_child_id ON schedules(child_id);
CREATE INDEX IF NOT EXISTS idx_homework_child_id ON homework(child_id);
CREATE INDEX IF NOT EXISTS idx_homework_deadline ON homework(deadline);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_notes_user_pinned ON notes(user_id, pinned);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_events_child_date ON events(child_id, event_date);