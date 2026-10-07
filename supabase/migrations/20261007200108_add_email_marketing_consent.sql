/*
  # Add Email and Marketing Consent to User Profiles

  ## Overview
  Adds email storage and marketing consent tracking to user_profiles so the app
  can collect emails for marketing campaigns (e.g. via Resend, Mailchimp, etc.).

  ## Changes
  1. Adds `email` column (text, nullable) to user_profiles — stores the user's
     email for marketing list exports. The email is copied from the Supabase Auth
     user during onboarding.
  2. Adds `marketing_consent` column (boolean, default false) — tracks whether
     the user explicitly opted in to receive marketing emails.
  3. Adds `marketing_consent_at` column (timestamptz, nullable) — records when
     consent was given, for compliance/audit purposes (UU PDP).

  ## Security
  - No new tables created. Existing RLS policies on user_profiles remain intact.
  - Users can still only read/update their own profile (auth.uid() = id).
  - No policy changes needed — the new columns are covered by existing
    SELECT/INSERT/UPDATE policies on user_profiles.
*/

-- Add email column (nullable since existing users won't have it)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
    ALTER TABLE user_profiles ADD COLUMN email text;
  END IF;
END $$;

-- Add marketing_consent column (default false)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'marketing_consent') THEN
    ALTER TABLE user_profiles ADD COLUMN marketing_consent boolean DEFAULT false;
  END IF;
END $$;

-- Add marketing_consent_at column (records when consent was given)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'marketing_consent_at') THEN
    ALTER TABLE user_profiles ADD COLUMN marketing_consent_at timestamptz;
  END IF;
END $$;
