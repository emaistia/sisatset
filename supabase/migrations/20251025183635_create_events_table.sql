/*
  # Create Events Table
  
  ## Overview
  Table untuk menyimpan event/acara keluarga dan anak-anak
  
  ## New Tables
  1. **events**
     - `id` (uuid, primary key)
     - `user_id` (uuid, references user_profiles)
     - `child_id` (uuid, references children, optional)
     - `title` (text) - Judul event
     - `category` (text) - Kategori: Sekolah, Les, Ekstrakurikuler, Acara Keluarga, Lainnya
     - `event_date` (date) - Tanggal event
     - `event_time` (text, optional) - Jam event
     - `notes` (text, optional) - Catatan tambahan
     - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled
  - Users can only access their own events
*/

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

CREATE POLICY "Users can read own events"
  ON events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_events_user_date ON events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_events_child_date ON events(child_id, event_date);