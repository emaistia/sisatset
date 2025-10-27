import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  mama_name: string;
  show_children_in_greeting: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type Child = {
  id: string;
  user_id: string;
  name: string;
  grade: string;
  color: string;
  created_at: string;
};

export type Schedule = {
  id: string;
  child_id: string;
  day_of_week: 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu';
  subjects: string[];
  uniform: string;
  school_hours: string;
  created_at: string;
};

export type Homework = {
  id: string;
  child_id: string;
  subject: string;
  description: string;
  deadline: string;
  completed: boolean;
  created_at: string;
};

export type UserRecipe = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  cooking_time: string;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
  created_at: string;
};

export type MealPlan = {
  id: string;
  user_id: string;
  plan_date: string;
  meal_type: 'sarapan' | 'bekal' | 'makan_siang' | 'makan_malam';
  recipe_name: string;
  notes: string;
  created_at: string;
};

export type MonthlyBudget = {
  id: string;
  user_id: string;
  month: number;
  year: number;
  category: string;
  planned_amount: number;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  expense_date: string;
  notes: string;
  payment_method: string;
  cashback: number;
  created_at: string;
};

export type ShoppingItem = {
  id: string;
  user_id: string;
  item: string;
  quantity: string;
  price: number;
  category: string;
  checked: boolean;
  source: string;
  created_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  content: string;
  pinned: boolean;
  done: boolean;
  created_at: string;
  updated_at: string;
};

export type Announcement = {
  id: string;
  user_id: string;
  original_text: string;
  parsed_data: any;
  announcement_date: string;
  created_at: string;
};

export type Event = {
  id: string;
  user_id: string;
  child_id?: string;
  title: string;
  category: string;
  event_date: string;
  event_time: string;
  notes: string;
  created_at: string;
};
