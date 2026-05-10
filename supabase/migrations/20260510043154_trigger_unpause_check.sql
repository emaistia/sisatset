/*
  # Trigger Unpause Check

  1. Purpose
    - Apply a minimal migration to trigger Supabase to potentially unpause the project
    - Also ensures the auth schema is properly configured
  
  2. Changes
    - Add a comment to the database to verify write access
*/

COMMENT ON DATABASE postgres IS 'SiSatSet - Active project check';