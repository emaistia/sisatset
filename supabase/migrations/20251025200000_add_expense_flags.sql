/*
  # Add expense payment status fields

  1. Changes
    - Add `paid` boolean field to track payment status
    - Add `recurring` boolean field to mark recurring expenses
    - Both default to false for existing records

  2. Notes
    - Safe to run multiple times (uses IF NOT EXISTS pattern)
    - Existing expenses will have paid=false, recurring=false
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'paid'
  ) THEN
    ALTER TABLE expenses ADD COLUMN paid boolean DEFAULT false NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'recurring'
  ) THEN
    ALTER TABLE expenses ADD COLUMN recurring boolean DEFAULT false NOT NULL;
  END IF;
END $$;
