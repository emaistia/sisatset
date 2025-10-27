/*
  # Meal Planner System Schema

  1. New Tables
    - `recipes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - allows custom recipes per user
      - `name` (text) - recipe name
      - `icon` (text) - emoji icon
      - `category` (text) - sarapan/bekal/utama
      - `tags` (text[]) - array of tags (praktis, favorit, bergizi, cepat)
      - `time` (text) - cooking time (e.g., "15 menit")
      - `difficulty` (text) - Mudah/Sedang/Susah
      - `ingredients` (jsonb) - array of ingredient objects with name and amount
      - `instructions` (text[]) - step by step instructions
      - `is_default` (boolean) - true for system recipes, false for user recipes
      - `created_at` (timestamptz)
    
    - `weekly_meal_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `day_of_week` (text) - senin/selasa/rabu/kamis/jumat/sabtu/minggu
      - `meal_type` (text) - sarapan/bekal/siang/malam
      - `recipe_id` (uuid, references recipes)
      - `week_start_date` (date) - Monday of the week
      - `created_at` (timestamptz)
    
    - `fridge_inventory`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - ingredient name
      - `quantity` (text) - amount (e.g., "500g", "2 butir")
      - `category` (text) - Protein/Sayur/Karbohidrat/Bumbu/Lainnya
      - `created_at` (timestamptz)
    
    - `shopping_lists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `item_name` (text)
      - `quantity` (text)
      - `category` (text)
      - `completed` (boolean, default false)
      - `from_meal_plan` (boolean, default false) - auto-generated vs manual
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - System default recipes are readable by all authenticated users
    - Users can create custom recipes
*/

-- Create recipes table
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

-- Create weekly_meal_plans table
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

-- Create fridge_inventory table
CREATE TABLE IF NOT EXISTS fridge_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity text NOT NULL,
  category text NOT NULL CHECK (category IN ('Protein', 'Sayur', 'Karbohidrat', 'Bumbu', 'Lainnya')),
  created_at timestamptz DEFAULT now()
);

-- Create shopping_lists table
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

-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE fridge_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- Recipes policies
CREATE POLICY "Users can view default recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "Users can create own recipes"
  ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false);

-- Weekly meal plans policies
CREATE POLICY "Users can view own meal plans"
  ON weekly_meal_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal plans"
  ON weekly_meal_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
  ON weekly_meal_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
  ON weekly_meal_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fridge inventory policies
CREATE POLICY "Users can view own fridge inventory"
  ON fridge_inventory FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own fridge items"
  ON fridge_inventory FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fridge items"
  ON fridge_inventory FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own fridge items"
  ON fridge_inventory FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Shopping lists policies
CREATE POLICY "Users can view own shopping lists"
  ON shopping_lists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shopping items"
  ON shopping_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping items"
  ON shopping_lists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping items"
  ON shopping_lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default recipes
INSERT INTO recipes (user_id, name, icon, category, tags, time, difficulty, ingredients, instructions, is_default) VALUES
  -- Breakfast recipes
  (NULL, 'Nasi Uduk', '🍚', 'sarapan', '{praktis,favorit}', '30 menit', 'Sedang', 
   '[{"name":"beras","amount":"2 gelas"},{"name":"santan","amount":"400ml"},{"name":"daun salam","amount":"2 lembar"},{"name":"serai","amount":"1 batang"}]',
   ARRAY['Cuci beras hingga bersih', 'Masak beras dengan santan, daun salam dan serai', 'Masak hingga matang dan pulen', 'Sajikan dengan lauk pendamping'],
   true),
  (NULL, 'Roti Bakar Telur', '🍞', 'sarapan', '{cepat,praktis}', '10 menit', 'Mudah',
   '[{"name":"roti tawar","amount":"2 lembar"},{"name":"telur","amount":"1 butir"},{"name":"margarin","amount":"1 sdm"},{"name":"keju parut","amount":"2 sdm"}]',
   ARRAY['Orak-arik telur dengan sedikit garam', 'Oles roti dengan margarin', 'Panggang roti hingga kecoklatan', 'Letakkan telur orak-arik di atas roti', 'Taburi keju parut'],
   true),
  (NULL, 'Pancake Pisang', '🥞', 'sarapan', '{favorit,bergizi}', '20 menit', 'Mudah',
   '[{"name":"tepung terigu","amount":"1 gelas"},{"name":"telur","amount":"1 butir"},{"name":"susu cair","amount":"150ml"},{"name":"pisang","amount":"2 buah"},{"name":"madu","amount":"2 sdm"}]',
   ARRAY['Campur tepung, telur dan susu hingga rata', 'Haluskan 1 pisang, masukkan ke adonan', 'Tuang adonan di teflon panas', 'Masak hingga berlubang-lubang', 'Sajikan dengan irisan pisang dan madu'],
   true),
  (NULL, 'Bubur Ayam', '🥣', 'sarapan', '{bergizi,favorit}', '45 menit', 'Sedang',
   '[{"name":"beras","amount":"1/2 gelas"},{"name":"air","amount":"1 liter"},{"name":"ayam suwir","amount":"100g"},{"name":"daun bawang","amount":"2 batang"},{"name":"bawang goreng","amount":"2 sdm"}]',
   ARRAY['Masak beras dengan air hingga lembut', 'Aduk sesekali agar tidak gosong', 'Tumis ayam dengan bumbu', 'Sajikan bubur dengan topping ayam, daun bawang dan bawang goreng'],
   true),
  
  -- Lunch box recipes
  (NULL, 'Nasi Goreng Mini', '🍳', 'bekal', '{praktis,cepat,favorit}', '15 menit', 'Mudah',
   '[{"name":"nasi putih","amount":"1 porsi"},{"name":"telur","amount":"1 butir"},{"name":"kecap manis","amount":"1 sdm"},{"name":"bawang putih","amount":"2 siung"},{"name":"sayuran cincang","amount":"50g"}]',
   ARRAY['Tumis bawang putih hingga harum', 'Masukkan telur orak-arik', 'Tambahkan nasi putih aduk rata', 'Beri kecap manis dan sayuran', 'Masak hingga matang'],
   true),
  (NULL, 'Roti Isi Telur Keju', '🥪', 'bekal', '{cepat,praktis}', '10 menit', 'Mudah',
   '[{"name":"roti tawar","amount":"2 lembar"},{"name":"telur","amount":"1 butir"},{"name":"keju lembaran","amount":"1 lembar"},{"name":"mayones","amount":"1 sdm"},{"name":"selada","amount":"1 lembar"}]',
   ARRAY['Rebus telur hingga matang, kupas dan iris', 'Oles roti dengan mayones', 'Susun selada, irisan telur dan keju', 'Tutup dengan roti lainnya', 'Potong diagonal'],
   true),
  (NULL, 'Ayam Goreng Tepung', '🍗', 'bekal', '{favorit,bergizi}', '30 menit', 'Sedang',
   '[{"name":"ayam","amount":"4 potong"},{"name":"tepung bumbu","amount":"100g"},{"name":"telur","amount":"1 butir"},{"name":"air","amount":"50ml"},{"name":"minyak goreng","amount":"500ml"}]',
   ARRAY['Lumuri ayam dengan bumbu, diamkan 15 menit', 'Kocok telur dengan air', 'Celup ayam ke kocokan telur', 'Gulingkan di tepung bumbu', 'Goreng hingga kuning kecoklatan'],
   true),
  (NULL, 'Macaroni Schotel Mini', '🧀', 'bekal', '{bergizi,favorit}', '40 menit', 'Sedang',
   '[{"name":"makaroni","amount":"150g"},{"name":"susu cair","amount":"200ml"},{"name":"keju parut","amount":"100g"},{"name":"telur","amount":"2 butir"},{"name":"daging cincang","amount":"50g"}]',
   ARRAY['Rebus makaroni hingga matang', 'Tumis daging cincang', 'Campur makaroni, daging, susu, telur dan keju', 'Tuang ke wadah tahan panas', 'Panggang 20 menit suhu 180°C'],
   true),
  (NULL, 'Nugget Sayur Homemade', '🥦', 'bekal', '{bergizi,praktis}', '35 menit', 'Sedang',
   '[{"name":"wortel parut","amount":"100g"},{"name":"brokoli cincang","amount":"100g"},{"name":"tepung terigu","amount":"3 sdm"},{"name":"telur","amount":"1 butir"},{"name":"bawang putih bubuk","amount":"1 sdt"}]',
   ARRAY['Campur semua sayuran dengan tepung dan telur', 'Bentuk bulat pipih', 'Gulingkan di tepung roti', 'Goreng dengan minyak panas', 'Tiriskan dan sajikan'],
   true),
  (NULL, 'Nasi Bento Karakter', '🍱', 'bekal', '{favorit,bergizi}', '25 menit', 'Mudah',
   '[{"name":"nasi putih","amount":"1 porsi"},{"name":"nori","amount":"1 lembar"},{"name":"sosis","amount":"2 buah"},{"name":"telur dadar","amount":"1 butir"},{"name":"sayuran rebus","amount":"50g"}]',
   ARRAY['Bentuk nasi menjadi karakter lucu', 'Gunting nori untuk mata dan mulut', 'Goreng sosis, bentuk sesuai keinginan', 'Buat telur dadar, potong sesuai selera', 'Susun semua dalam kotak bento'],
   true),
  (NULL, 'Sosis Gulung', '🌭', 'bekal', '{cepat,praktis,favorit}', '15 menit', 'Mudah',
   '[{"name":"sosis","amount":"5 buah"},{"name":"kulit lumpia","amount":"5 lembar"},{"name":"keju lembaran","amount":"2 lembar"},{"name":"tepung terigu","amount":"2 sdm"},{"name":"air","amount":"2 sdm"}]',
   ARRAY['Potong keju sesuai ukuran sosis', 'Letakkan sosis dan keju di kulit lumpia', 'Gulung dan rekatkan dengan campuran tepung dan air', 'Goreng hingga kecoklatan', 'Sajikan dengan saus'],
   true),
  (NULL, 'Sandwich Tuna', '🥪', 'bekal', '{praktis,bergizi}', '10 menit', 'Mudah',
   '[{"name":"roti tawar","amount":"4 lembar"},{"name":"tuna kaleng","amount":"1 kaleng"},{"name":"mayones","amount":"2 sdm"},{"name":"selada","amount":"2 lembar"},{"name":"tomat","amount":"1 buah"}]',
   ARRAY['Tiriskan tuna, campur dengan mayones', 'Oles roti dengan campuran tuna', 'Tambahkan selada dan irisan tomat', 'Tutup dengan roti', 'Potong diagonal dan sajikan'],
   true),
  (NULL, 'Perkedel Kentang', '🥔', 'bekal', '{praktis,favorit}', '30 menit', 'Mudah',
   '[{"name":"kentang","amount":"3 buah"},{"name":"daun bawang","amount":"2 batang"},{"name":"telur","amount":"1 butir"},{"name":"bawang merah goreng","amount":"2 sdm"},{"name":"tepung terigu","amount":"2 sdm"}]',
   ARRAY['Rebus kentang hingga matang, haluskan', 'Campur dengan daun bawang cincang dan bawang goreng', 'Bentuk bulat pipih', 'Celup ke kocokan telur lalu tepung', 'Goreng hingga kecoklatan'],
   true),
  
  -- Family meals
  (NULL, 'Soto Ayam', '🍜', 'utama', '{bergizi,favorit}', '60 menit', 'Sedang',
   '[{"name":"ayam","amount":"500g"},{"name":"kunyit","amount":"2 cm"},{"name":"serai","amount":"2 batang"},{"name":"daun jeruk","amount":"3 lembar"},{"name":"tauge","amount":"100g"},{"name":"bihun","amount":"100g"}]',
   ARRAY['Rebus ayam dengan bumbu hingga empuk', 'Suwir ayam, sisihkan kaldu', 'Tumis bumbu halus hingga harum', 'Masukkan kaldu, masak hingga mendidih', 'Sajikan dengan tauge, bihun dan pelengkap'],
   true),
  (NULL, 'Spaghetti Bolognese', '🍝', 'utama', '{favorit,bergizi}', '40 menit', 'Sedang',
   '[{"name":"spaghetti","amount":"250g"},{"name":"daging cincang","amount":"200g"},{"name":"saus tomat","amount":"200ml"},{"name":"bawang bombay","amount":"1 buah"},{"name":"keju parut","amount":"50g"}]',
   ARRAY['Rebus spaghetti hingga al dente', 'Tumis bawang bombay hingga harum', 'Masukkan daging cincang, masak hingga matang', 'Tambahkan saus tomat, masak 15 menit', 'Sajikan dengan taburan keju'],
   true),
  (NULL, 'Ayam Bakar', '🍗', 'utama', '{favorit,bergizi}', '50 menit', 'Sedang',
   '[{"name":"ayam","amount":"1 ekor"},{"name":"kecap manis","amount":"3 sdm"},{"name":"jeruk nipis","amount":"2 buah"},{"name":"bawang putih","amount":"5 siung"},{"name":"kemiri","amount":"3 butir"}]',
   ARRAY['Haluskan bumbu, campur dengan kecap dan jeruk nipis', 'Lumuri ayam dengan bumbu, diamkan 30 menit', 'Bakar ayam dengan api sedang', 'Bolak-balik sambil oles bumbu', 'Bakar hingga matang kecoklatan'],
   true),
  (NULL, 'Lumpia Sayur', '🌯', 'utama', '{praktis,bergizi}', '35 menit', 'Sedang',
   '[{"name":"kulit lumpia","amount":"10 lembar"},{"name":"wortel","amount":"2 buah"},{"name":"kol","amount":"100g"},{"name":"tauge","amount":"100g"},{"name":"udang","amount":"100g"}]',
   ARRAY['Potong sayuran memanjang', 'Tumis bumbu, masukkan sayuran dan udang', 'Masak hingga layu', 'Bungkus isian dengan kulit lumpia', 'Goreng hingga kecoklatan'],
   true),
  (NULL, 'Capcay', '🥗', 'utama', '{bergizi,praktis}', '25 menit', 'Mudah',
   '[{"name":"sawi","amount":"100g"},{"name":"wortel","amount":"1 buah"},{"name":"brokoli","amount":"100g"},{"name":"bakso","amount":"5 buah"},{"name":"saus tiram","amount":"2 sdm"}]',
   ARRAY['Potong semua sayuran', 'Tumis bawang putih hingga harum', 'Masukkan sayuran keras terlebih dahulu', 'Tambahkan bakso dan saus tiram', 'Masak hingga sayuran matang tapi tetap renyah'],
   true)
ON CONFLICT DO NOTHING;