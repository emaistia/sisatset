/*
  # Add unique constraint to schedules table
  
  ## Changes
  - Add UNIQUE constraint on (child_id, day_of_week) combination
  - This allows upsert operations to work properly when saving schedules
  
  ## Purpose
  - Ensures one schedule per child per day
  - Enables upsert functionality in Settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'schedules_child_id_day_of_week_key'
  ) THEN
    ALTER TABLE schedules 
    ADD CONSTRAINT schedules_child_id_day_of_week_key 
    UNIQUE (child_id, day_of_week);
  END IF;
END $$;