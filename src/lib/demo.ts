import { supabase } from '../lib/supabase';

const DEMO_SESSION_KEY = 'sisatset_demo_session';

export type DemoSession = {
  email: string;
  password: string;
};

export function getStoredDemoSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    return raw ? (JSON.parse(raw) as DemoSession) : null;
  } catch {
    return null;
  }
}

function storeDemoSession(session: DemoSession | null) {
  if (session) {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(DEMO_SESSION_KEY);
  }
}

const SAMPLE_CHILDREN = [
  { name: 'Rara', grade: 'SMP 1', color: '#FF6B9D' },
  { name: 'Eyza', grade: 'TK A', color: '#4ECDC4' },
];

const DAY = 24 * 60 * 60 * 1000;

function iso(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
}

export async function enterDemo(): Promise<void> {
  const session: DemoSession = {
    email: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@demo.sisatset.local`,
    password: `dm-${crypto.randomUUID()}`,
  };

  const { data, error } = await supabase.auth.signUp({
    email: session.email,
    password: session.password,
  });
  if (error) throw error;
  if (!data.user) throw new Error('Gagal memulai sesi demo');

  storeDemoSession(session);
  await seedDemoData(data.user.id);
}

export async function exitDemo(): Promise<void> {
  const session = getStoredDemoSession();

  const { data: { user } } = await supabase.auth.getUser();
  if (session && user && user.email === session.email) {
    const tables: Array<'children' | 'notes' | 'expenses' | 'meal_plans' | 'shopping_list' | 'events' | 'monthly_budgets' | 'recipes' | 'user_recipes' | 'fridge_inventory' | 'announcements' | 'weekly_meal_plans'> =
      ['children', 'notes', 'expenses', 'meal_plans', 'shopping_list', 'events', 'monthly_budgets', 'recipes', 'user_recipes', 'fridge_inventory', 'announcements', 'weekly_meal_plans'];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('user_id', user.id);
      if (error) break;
    }

    await supabase.from('user_profiles').delete().eq('id', user.id);
  }

  await supabase.auth.signOut();
  storeDemoSession(null);
}

export function isDemoEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith('@demo.sisatset.local');
}

async function seedDemoData(userId: string): Promise<void> {
  const now = new Date().toISOString();

  await supabase.from('user_profiles').upsert({
    id: userId,
    mama_name: 'Mama Demo',
    show_children_in_greeting: true,
    onboarding_completed: true,
    email: null,
    marketing_consent: false,
  });

  const { data: children } = await supabase
    .from('children')
    .insert(SAMPLE_CHILDREN.map((c) => ({ ...c, user_id: userId })))
    .select('id, name');

  if (!children || children.length === 0) return;
  const rara = children.find((c) => c.name === 'Rara')?.id ?? children[0].id;
  const eyza = children.find((c) => c.name === 'Eyza')?.id ?? children[children.length - 1].id;

  await supabase.from('schedules').insert([
    { child_id: rara, day_of_week: 'senin', subjects: ['Matematika', 'Bahasa Indonesia', 'IPA'], uniform: 'Putih Biru', school_hours: '07:00 - 13:30' },
    { child_id: rara, day_of_week: 'selasa', subjects: ['Bahasa Inggris', 'IPS', 'Penjaskes'], uniform: 'Batik', school_hours: '07:00 - 14:00' },
    { child_id: rara, day_of_week: 'rabu', subjects: ['Matematika', 'IPA', 'Informatika'], uniform: 'Putih Biru', school_hours: '07:00 - 13:30' },
    { child_id: eyza, day_of_week: 'senin', subjects: ['Mengenal Huruf', 'Menghitung', 'Menggambar'], uniform: 'Merah Putih', school_hours: '07:30 - 11:00' },
    { child_id: eyza, day_of_week: 'selasa', subjects: ['Bernyanyi', 'Bermain Peran', 'Olahraga'], uniform: 'Olahraga', school_hours: '07:30 - 11:00' },
  ]);

  await supabase.from('homework').insert([
    { child_id: rara, subject: 'Matematika', description: 'Contoh PR: kerjakan latihan halaman 45-46, pengurangan pecahan', deadline: iso(2), completed: false },
    { child_id: rara, subject: 'Bahasa Indonesia', description: 'Contoh PR: buat ringkasan cerpen "Kisah Tiara"', deadline: iso(4), completed: false },
    { child_id: rara, subject: 'IPA', description: 'Contoh PR: laporan praktikum fotosintesis', deadline: iso(-1), completed: true },
    { child_id: eyza, subject: 'Mewarnai', description: 'Contoh PR: mewarnai gambar buah', deadline: iso(3), completed: false },
  ]);

  await supabase.from('events').insert([
    { user_id: userId, child_id: rara, title: 'Contoh: Ujian Matematika', category: 'Ujian', event_date: iso(3), event_time: '08:00' },
    { user_id: userId, child_id: eyza, title: 'Contoh: Pameran karya TK', category: 'Kegiatan', event_date: iso(6), event_time: '09:00' },
  ]);

  await supabase.from('notes').insert([
    { user_id: userId, content: 'Contoh: bawa kotak pensil warna setiap hari Kamis (jam praktik)', pinned: true, done: false },
    { user_id: userId, content: 'Contoh: bayar SPP sebelum tanggal 10', pinned: false, done: false },
    { user_id: userId, content: 'Contoh: belikan kostum renang', pinned: false, done: true },
  ]);

  await supabase.from('expenses').insert([
    { user_id: userId, category: 'Belanja Bulanan', amount: 450000, expense_date: iso(-5), notes: 'Contoh: belanja mingguan di supermarket', payment_method: 'Debit', cashback: 10000 },
    { user_id: userId, category: 'Sekolah', amount: 250000, expense_date: iso(-3), notes: 'Contoh: SPP bulan ini', payment_method: 'Transfer', cashback: 0 },
    { user_id: userId, category: 'Makanan', amount: 85000, expense_date: iso(-1), notes: 'Contoh: bekal dan makan siang anak', payment_method: 'Cash', cashback: 0 },
  ]);

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  await supabase.from('monthly_budgets').insert([
    { user_id: userId, month, year, category: 'Belanja Bulanan', planned_amount: 2000000 },
    { user_id: userId, month, year, category: 'Makanan', planned_amount: 1500000 },
    { user_id: userId, month, year, category: 'Sekolah', planned_amount: 500000 },
  ]);

  const { data: recipe } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      name: 'Nasi Goreng Spesial',
      icon: '🍳',
      category: 'utama',
      time: '30 menit',
      difficulty: 'Mudah',
      ingredients: ['Nasi putih 2 porsi', 'Telur 2 butir', 'Ayam fillet 100g', 'Kecap manis', 'Bawang merah & putih'],
      instructions: ['Tumis bawang hingga harum', 'Masukkan ayam, masak sampai matang', 'Tambahkan nasi, aduk rata', 'Bumbui dengan kecap dan garam', 'Sajikan dengan telur mata sapi'],
    })
    .select('id')
    .maybeSingle();

  await supabase.from('meal_plans').insert([
    { user_id: userId, plan_date: iso(1), meal_type: 'makan_malam', recipe_name: 'Contoh: Nasi Goreng Spesial' },
    { user_id: userId, plan_date: iso(2), meal_type: 'sarapan', recipe_name: 'Contoh: Bubur Ayam' },
  ]);

  if (recipe) {
    await supabase.from('weekly_meal_plans').insert([
      { user_id: userId, day_of_week: 'senin', meal_type: 'makan_malam', recipe_id: recipe.id, week_start_date: iso(0) },
    ]);
  }

  await supabase.from('shopping_list').insert([
    { user_id: userId, item: 'Contoh: Telur', quantity: '1 kg', price: 28000, category: 'Bahan Makanan' },
    { user_id: userId, item: 'Contoh: Beras', quantity: '5 kg', price: 72000, category: 'Bahan Makanan' },
    { user_id: userId, item: 'Contoh: Sabun mandi', quantity: '2 pcs', price: 15000, category: 'Kebutuhan Rumah' },
  ]);
}
