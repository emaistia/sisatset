import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  UtensilsCrossed,
  Plus,
  X,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  RefrigeratorIcon,
  Sparkles,
  Check,
  Trash2,
  Info,
  ArrowRight,
} from 'lucide-react';

interface Recipe {
  id: string;
  name: string;
  icon: string;
  category: 'sarapan' | 'bekal' | 'utama';
  tags: string[];
  time: string;
  difficulty: string;
  ingredients: { name: string; amount: string }[];
  instructions: string[];
  is_default: boolean;
}

interface MealPlan {
  id: string;
  day_of_week: string;
  meal_type: string;
  recipe_id: string;
  recipe?: Recipe;
}

interface FridgeItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
}

interface ShoppingItem {
  id: string;
  item_name: string;
  quantity: string;
  category: string;
  completed: boolean;
  from_meal_plan: boolean;
}

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
const DAY_LABELS = {
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
  minggu: 'Minggu',
};

const MEAL_TYPES = [
  { value: 'sarapan', label: '🌅 Sarapan', icon: '🌅' },
  { value: 'bekal', label: '🍱 Bekal Sekolah', icon: '🍱' },
  { value: 'siang', label: '🍽️ Makan Siang', icon: '🍽️' },
  { value: 'malam', label: '🌙 Makan Malam', icon: '🌙' },
];

const FRIDGE_CATEGORIES = ['Protein', 'Sayur', 'Karbohidrat', 'Bumbu', 'Lainnya'];

const CATEGORY_ICONS: Record<string, string> = {
  Protein: '🥩',
  Sayur: '🥬',
  Karbohidrat: '🍚',
  Bumbu: '🧂',
  Lainnya: '📦',
};

export default function MealPlanner() {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showRecipeDetailModal, setShowRecipeDetailModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; mealType: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('Semua');
  const [showSaturday, setShowSaturday] = useState(true);
  const [activeTab, setActiveTab] = useState<'planner' | 'fridge' | 'shopping'>('planner');
  const [newFridgeItem, setNewFridgeItem] = useState({ name: '', quantity: '', category: 'Protein' });
  const [newShoppingItem, setNewShoppingItem] = useState({ item_name: '', quantity: '', category: 'Lainnya' });
  const [showMatcher, setShowMatcher] = useState(false);
  const [matchedRecipes, setMatchedRecipes] = useState<{ perfect: Recipe[]; partial: Recipe[] }>({
    perfect: [],
    partial: [],
  });

  useEffect(() => {
    if (user) {
      loadRecipes();
      loadMealPlans();
      loadFridgeItems();
      loadShoppingList();
    }
  }, [user, currentWeekStart]);

  function getMonday(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  const loadRecipes = async () => {
    const { data } = await supabase.from('recipes').select('*').order('name');
    if (data) setRecipes(data as Recipe[]);
  };

  const loadMealPlans = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('weekly_meal_plans')
      .select('*, recipes(*)')
      .eq('user_id', user.id)
      .eq('week_start_date', currentWeekStart);

    if (data) {
      const plans = data.map((plan: any) => ({
        id: plan.id,
        day_of_week: plan.day_of_week,
        meal_type: plan.meal_type,
        recipe_id: plan.recipe_id,
        recipe: plan.recipes,
      }));
      setMealPlans(plans);
    }
  };

  const loadFridgeItems = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('fridge_inventory')
      .select('*')
      .eq('user_id', user.id)
      .order('category')
      .order('name');
    if (data) setFridgeItems(data);
  };

  const loadShoppingList = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('completed')
      .order('category');
    if (data) setShoppingList(data);
  };

  const handleAddToSlot = (day: string, mealType: string) => {
    setSelectedSlot({ day, mealType });
    setShowRecipeModal(true);
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!user || !selectedSlot) return;

    const existing = mealPlans.find(
      (p) => p.day_of_week === selectedSlot.day && p.meal_type === selectedSlot.mealType
    );

    if (existing) {
      await supabase
        .from('weekly_meal_plans')
        .update({ recipe_id: recipe.id })
        .eq('id', existing.id);
    } else {
      await supabase.from('weekly_meal_plans').insert({
        user_id: user.id,
        day_of_week: selectedSlot.day,
        meal_type: selectedSlot.mealType,
        recipe_id: recipe.id,
        week_start_date: currentWeekStart,
      });
    }

    setShowRecipeModal(false);
    setSelectedSlot(null);
    loadMealPlans();
  };

  const handleRemoveFromSlot = async (day: string, mealType: string) => {
    const plan = mealPlans.find((p) => p.day_of_week === day && p.meal_type === mealType);
    if (plan) {
      await supabase.from('weekly_meal_plans').delete().eq('id', plan.id);
      loadMealPlans();
    }
  };

  const handleAddFridgeItem = async () => {
    if (!user || !newFridgeItem.name || !newFridgeItem.quantity) return;
    await supabase.from('fridge_inventory').insert({ ...newFridgeItem, user_id: user.id });
    setNewFridgeItem({ name: '', quantity: '', category: 'Protein' });
    loadFridgeItems();
  };

  const handleDeleteFridgeItem = async (id: string) => {
    await supabase.from('fridge_inventory').delete().eq('id', id);
    loadFridgeItems();
  };

  const handleAddShoppingItem = async () => {
    if (!user || !newShoppingItem.item_name) return;
    await supabase.from('shopping_lists').insert({
      ...newShoppingItem,
      user_id: user.id,
      completed: false,
      from_meal_plan: false,
    });
    setNewShoppingItem({ item_name: '', quantity: '', category: 'Lainnya' });
    loadShoppingList();
  };

  const handleToggleShoppingItem = async (id: string, itemName: string) => {
    if (!user) return;

    const item = shoppingList.find(i => i.id === id);
    if (!item) return;

    await supabase.from('shopping_list').insert({
      user_id: user.id,
      item: itemName,
      quantity: '1',
      price: 0,
      category: item.category || 'Lainnya',
      checked: false,
      source: 'meal_plan',
    });

    await supabase.from('shopping_lists').delete().eq('id', id);

    loadShoppingList();
  };

  const handleDeleteShoppingItem = async (id: string) => {
    await supabase.from('shopping_lists').delete().eq('id', id);
    loadShoppingList();
  };

  const handleClearCompleted = async () => {
    if (!user) return;
    await supabase.from('shopping_lists').delete().eq('user_id', user.id).eq('completed', true);
    loadShoppingList();
  };

  const handleGenerateShoppingList = async () => {
    if (!user) return;

    await supabase.from('shopping_lists').delete().eq('user_id', user.id).eq('from_meal_plan', true);

    const ingredientsSet = new Set<string>();

    for (const plan of mealPlans) {
      if (plan.recipe && plan.recipe.ingredients) {
        for (const ing of plan.recipe.ingredients) {
          ingredientsSet.add(ing.name.toLowerCase().trim());
        }
      }
    }

    const items = Array.from(ingredientsSet).map((name) => ({
      user_id: user.id,
      item_name: name,
      quantity: '',
      category: 'Lainnya',
      completed: false,
      from_meal_plan: true,
    }));

    if (items.length > 0) {
      await supabase.from('shopping_lists').insert(items);
      loadShoppingList();
      setActiveTab('shopping');
    }
  };

  const handleMatchRecipes = () => {
    const fridgeIngredients = fridgeItems.map((item) => item.name.toLowerCase().trim());
    const perfect: Recipe[] = [];
    const partial: Recipe[] = [];

    const normalizeIngredient = (ing: string) => {
      const normalized = ing.toLowerCase().trim();
      if (normalized.includes('ayam') && !normalized.includes('telur')) return 'ayam';
      if (normalized.includes('daging')) return 'daging';
      if (normalized.includes('wortel')) return 'wortel';
      if (normalized.includes('kol') || normalized.includes('kubis')) return 'kol';
      if (normalized.includes('telur')) return 'telur';
      if (normalized.includes('bawang putih')) return 'bawang putih';
      if (normalized.includes('bawang merah')) return 'bawang merah';
      if (normalized.includes('bawang bombay')) return 'bawang bombay';
      return normalized;
    };

    const normalizedFridge = fridgeIngredients.map(normalizeIngredient);

    for (const recipe of recipes) {
      const recipeIngredients = recipe.ingredients.map((ing) => normalizeIngredient(ing.name));
      const mainIngredients = recipeIngredients.filter((ing) =>
        ['ayam', 'daging', 'ikan', 'udang', 'telur', 'tahu', 'tempe'].includes(ing)
      );

      const matchCount = recipeIngredients.filter((ing) => {
        return normalizedFridge.some(fridgeIng => {
          if (ing === fridgeIng) return true;
          if (ing.includes(fridgeIng) || fridgeIng.includes(ing)) return true;
          return false;
        });
      }).length;

      const mainIngredientMatch = mainIngredients.some(main => normalizedFridge.includes(main));
      const matchPercent = (matchCount / recipeIngredients.length) * 100;

      if (matchPercent >= 70 || (mainIngredientMatch && matchPercent >= 50)) {
        perfect.push(recipe);
      } else if (matchPercent >= 30 || (mainIngredientMatch && matchPercent >= 25)) {
        partial.push(recipe);
      }
    }

    perfect.sort((a, b) => {
      const aMatch = a.ingredients.filter((ing) =>
        normalizedFridge.some(f => normalizeIngredient(ing.name).includes(f) || f.includes(normalizeIngredient(ing.name)))
      ).length;
      const bMatch = b.ingredients.filter((ing) =>
        normalizedFridge.some(f => normalizeIngredient(ing.name).includes(f) || f.includes(normalizeIngredient(ing.name)))
      ).length;
      return bMatch - aMatch;
    });

    partial.sort((a, b) => {
      const aMatch = a.ingredients.filter((ing) =>
        normalizedFridge.some(f => normalizeIngredient(ing.name).includes(f) || f.includes(normalizeIngredient(ing.name)))
      ).length;
      const bMatch = b.ingredients.filter((ing) =>
        normalizedFridge.some(f => normalizeIngredient(ing.name).includes(f) || f.includes(normalizeIngredient(ing.name)))
      ).length;
      return bMatch - aMatch;
    });

    setMatchedRecipes({ perfect, partial });
    setShowMatcher(true);
  };

  const handleAddMissingToShopping = async (recipe: Recipe) => {
    if (!user) return;
    const fridgeIngredients = fridgeItems.map((item) => item.name.toLowerCase());
    const missing = recipe.ingredients.filter(
      (ing) => !fridgeIngredients.includes(ing.name.toLowerCase())
    );

    const items = missing.map((ing) => ({
      user_id: user.id,
      item_name: ing.name,
      quantity: ing.amount,
      category: 'Lainnya',
      completed: false,
      from_meal_plan: false,
    }));

    if (items.length > 0) {
      await supabase.from('shopping_lists').insert(items);
      loadShoppingList();
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === 'Semua' || recipe.tags.includes(filterTag.toLowerCase());
    return matchesSearch && matchesTag;
  });

  const getRecipeForSlot = (day: string, mealType: string) => {
    return mealPlans.find((p) => p.day_of_week === day && p.meal_type === mealType);
  };

  const displayDays = showSaturday ? DAYS : DAYS.filter((d) => d !== 'sabtu');
  const plannedMealsCount = mealPlans.length;

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <UtensilsCrossed size={28} />
            <h1 className="text-2xl font-bold">Meal Planner</h1>
          </div>
          <div className="text-sm bg-white/20 rounded-full px-3 py-1">
            {recipes.length} Resep
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('planner')}
            className={`flex-1 py-2 rounded-lg font-medium ${
              activeTab === 'planner' ? 'bg-white text-orange-600' : 'bg-white/20'
            }`}
          >
            📅 Jadwal
          </button>
          <button
            onClick={() => setActiveTab('fridge')}
            className={`flex-1 py-2 rounded-lg font-medium ${
              activeTab === 'fridge' ? 'bg-white text-orange-600' : 'bg-white/20'
            }`}
          >
            🧊 Kulkas
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex-1 py-2 rounded-lg font-medium ${
              activeTab === 'shopping' ? 'bg-white text-orange-600' : 'bg-white/20'
            }`}
          >
            🛒 Belanja
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'planner' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() - 7);
                    setCurrentWeekStart(getMonday(d));
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="text-center">
                  <div className="font-bold text-gray-800">Minggu Ini</div>
                  <div className="text-sm text-gray-500">
                    {new Date(currentWeekStart).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() + 7);
                    setCurrentWeekStart(getMonday(d));
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  {plannedMealsCount} makanan direncanakan
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sabtu</span>
                  <button
                    onClick={() => setShowSaturday(!showSaturday)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      showSaturday ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        showSaturday ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerateShoppingList}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-medium mb-2"
              >
                <ShoppingCart className="inline mr-2" size={18} />
                Generate Shopping List
              </button>
            </div>

            <div className="space-y-4">
              {displayDays.map((day) => (
                <div key={day} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-100 to-pink-100 px-4 py-3">
                    <h3 className="font-bold text-gray-800">{DAY_LABELS[day as keyof typeof DAY_LABELS]}</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {MEAL_TYPES.map((mealType) => {
                      const plan = getRecipeForSlot(day, mealType.value);
                      return (
                        <div key={mealType.value} className="border border-gray-200 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-600">{mealType.label}</div>
                          </div>
                          {plan && plan.recipe ? (
                            <div className="flex items-center justify-between bg-gradient-to-r from-orange-50 to-pink-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{plan.recipe.icon}</span>
                                <div>
                                  <div className="font-medium text-gray-800">{plan.recipe.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {plan.recipe.time} • {plan.recipe.difficulty}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedRecipe(plan.recipe!);
                                    setShowRecipeDetailModal(true);
                                  }}
                                  className="p-2 hover:bg-white rounded-lg"
                                >
                                  <Info size={18} className="text-blue-600" />
                                </button>
                                <button
                                  onClick={() => handleRemoveFromSlot(day, mealType.value)}
                                  className="p-2 hover:bg-white rounded-lg"
                                >
                                  <X size={18} className="text-red-600" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddToSlot(day, mealType.value)}
                              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-orange-400 hover:bg-orange-50 transition-colors"
                            >
                              <Plus size={20} className="mx-auto text-gray-400" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'fridge' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <h3 className="font-bold text-gray-800 mb-4">Bahan di Kulkas</h3>
              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  placeholder="Nama bahan"
                  value={newFridgeItem.name}
                  onChange={(e) => setNewFridgeItem({ ...newFridgeItem, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Jumlah (misal: 500g)"
                    value={newFridgeItem.quantity}
                    onChange={(e) => setNewFridgeItem({ ...newFridgeItem, quantity: e.target.value })}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  />
                  <select
                    value={newFridgeItem.category}
                    onChange={(e) => setNewFridgeItem({ ...newFridgeItem, category: e.target.value })}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {FRIDGE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_ICONS[cat]} {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddFridgeItem}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 rounded-lg font-medium"
                >
                  <Plus className="inline mr-2" size={18} />
                  Tambah Bahan
                </button>
              </div>

              <button
                onClick={handleMatchRecipes}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium mb-4"
              >
                <Sparkles className="inline mr-2" size={18} />
                🤖 Cari Resep dari Bahan Ini
              </button>
            </div>

            {FRIDGE_CATEGORIES.map((category) => {
              const items = fridgeItems.filter((item) => item.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category} className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                  <h4 className="font-bold text-gray-700 mb-3">
                    {CATEGORY_ICONS[category]} {category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-gray-800">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.quantity}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteFridgeItem(item.id)}
                          className="p-2 hover:bg-gray-200 rounded-lg"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'shopping' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <h3 className="font-bold text-gray-800 mb-2">Daftar Belanja dari Menu</h3>
              <div className="text-sm text-gray-600 mb-4">
                ✅ Klik checkbox untuk pindahkan ke tab <span className="font-bold text-pink-600">Belanja</span>
              </div>
              <div className="text-xs text-gray-500 mb-4">
                💡 Di tab Belanja, Anda bisa edit qty dan harga sesuai kebutuhan
              </div>
            </div>

            {['Protein', 'Sayur', 'Karbohidrat', 'Bumbu', 'Lainnya'].map((category) => {
              const items = shoppingList.filter((item) => item.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category} className="bg-white rounded-2xl shadow-sm p-4 mb-4">
                  <h4 className="font-bold text-gray-700 mb-3">
                    {CATEGORY_ICONS[category]} {category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => handleToggleShoppingItem(item.id, item.item_name)}
                            className="w-6 h-6 rounded border-2 border-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                            title="Pindahkan ke tab Belanja"
                          >
                            <ArrowRight size={16} className="text-blue-600" />
                          </button>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 capitalize">
                              {item.item_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Klik → untuk tambah ke Belanja
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteShoppingItem(item.id)}
                          className="p-2 hover:bg-blue-100 rounded-lg"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {showRecipeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Pilih Resep</h2>
                <button onClick={() => setShowRecipeModal(false)} className="p-2 hover:bg-white/20 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Cari resep..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  {['Semua', 'Praktis', 'Favorit', 'Bergizi', 'Cepat'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setFilterTag(tag)}
                      className={`px-4 py-1 rounded-full whitespace-nowrap ${
                        filterTag === tag ? 'bg-white text-orange-600' : 'bg-white/20'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 gap-3">
                {filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 rounded-xl text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{recipe.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold text-gray-800">{recipe.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {recipe.time} • {recipe.difficulty}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {recipe.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs bg-white px-2 py-1 rounded-full text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecipe(recipe);
                          setShowRecipeDetailModal(true);
                        }}
                        className="p-2 hover:bg-white rounded-lg"
                      >
                        <Info size={20} className="text-blue-600" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showRecipeDetailModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedRecipe.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold">{selectedRecipe.name}</h2>
                    <div className="text-sm opacity-90 mt-1">
                      {selectedRecipe.time} • {selectedRecipe.difficulty}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowRecipeDetailModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex gap-2">
                {selectedRecipe.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-white/20 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">Bahan-bahan</h3>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-gray-700">
                        {ing.name} - {ing.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-3">Cara Membuat</h3>
                <ol className="space-y-3">
                  {selectedRecipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </span>
                      <span className="text-gray-700 flex-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {selectedSlot && (
                <button
                  onClick={() => {
                    handleSelectRecipe(selectedRecipe);
                    setShowRecipeDetailModal(false);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-bold"
                >
                  Tambah ke Jadwal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showMatcher && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">🤖 Resep yang Cocok</h2>
                <button onClick={() => setShowMatcher(false)} className="p-2 hover:bg-white/20 rounded-full">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {matchedRecipes.perfect.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-green-600 mb-3">✅ Bisa Dibuat Sekarang</h3>
                  <div className="space-y-2">
                    {matchedRecipes.perfect.map((recipe) => (
                      <div key={recipe.id} className="bg-green-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{recipe.icon}</span>
                          <div className="flex-1">
                            <div className="font-bold text-gray-800">{recipe.name}</div>
                            <div className="text-sm text-gray-600">
                              {recipe.time} • {recipe.difficulty}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedRecipe(recipe);
                            setShowRecipeDetailModal(true);
                          }}
                          className="text-sm text-blue-600 font-medium"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchedRecipes.partial.length > 0 && (
                <div>
                  <h3 className="font-bold text-orange-600 mb-3 flex items-center gap-2">
                    ⚠️ Butuh Tambahan
                    <span className="text-xs font-normal text-gray-500">
                      (Klik tombol hijau untuk tambah bahan ke shopping list)
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {matchedRecipes.partial.map((recipe) => {
                      const normalizeIngredient = (ing: string) => {
                        const normalized = ing.toLowerCase().trim();
                        if (normalized.includes('ayam') && !normalized.includes('telur')) return 'ayam';
                        if (normalized.includes('daging')) return 'daging';
                        if (normalized.includes('wortel')) return 'wortel';
                        if (normalized.includes('kol') || normalized.includes('kubis')) return 'kol';
                        if (normalized.includes('telur')) return 'telur';
                        if (normalized.includes('bawang putih')) return 'bawang putih';
                        if (normalized.includes('bawang merah')) return 'bawang merah';
                        if (normalized.includes('bawang bombay')) return 'bawang bombay';
                        return normalized;
                      };

                      const fridgeIngredients = fridgeItems.map((item) => normalizeIngredient(item.name));
                      const missing = recipe.ingredients.filter((ing) => {
                        const normalized = normalizeIngredient(ing.name);
                        return !fridgeIngredients.some(f => {
                          if (f === normalized) return true;
                          if (f.includes(normalized) || normalized.includes(f)) return true;
                          return false;
                        });
                      });

                      const available = recipe.ingredients.filter((ing) => {
                        const normalized = normalizeIngredient(ing.name);
                        return fridgeIngredients.some(f => {
                          if (f === normalized) return true;
                          if (f.includes(normalized) || normalized.includes(f)) return true;
                          return false;
                        });
                      });

                      return (
                        <div key={recipe.id} className="bg-orange-50 border-2 border-orange-200 p-4 rounded-xl">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-3xl">{recipe.icon}</span>
                            <div className="flex-1">
                              <div className="font-bold text-gray-800 text-lg">{recipe.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {recipe.time} • {recipe.difficulty}
                              </div>
                              <div className="text-xs text-green-600 mt-1">
                                ✓ Sudah ada: {available.length} bahan
                              </div>
                              <div className="text-xs text-orange-600">
                                ⚠ Kurang: {missing.length} bahan
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-lg mb-3">
                            <div className="text-xs font-bold text-gray-700 mb-2">Bahan yang kurang:</div>
                            <div className="space-y-1">
                              {missing.map((ing, idx) => (
                                <div key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                                  <span className="text-orange-500">•</span>
                                  <span>{ing.name} - {ing.amount}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedRecipe(recipe);
                                setShowRecipeDetailModal(true);
                              }}
                              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
                            >
                              📖 Lihat Resep Lengkap
                            </button>
                            <button
                              onClick={async () => {
                                await handleAddMissingToShopping(recipe);
                                alert(`${missing.length} bahan ditambahkan ke shopping list!`);
                              }}
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600"
                            >
                              🛒 Tambah ke Shopping List
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedRecipes.perfect.length === 0 && matchedRecipes.partial.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada resep yang cocok dengan bahan di kulkas Anda
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
