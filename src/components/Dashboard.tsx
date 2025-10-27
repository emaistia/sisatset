import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Schedule, Homework, MealPlan, Note, ShoppingItem, Event } from '../lib/supabase';
import { Calendar, BookOpen, UtensilsCrossed, Wallet, StickyNote, ShoppingCart, ArrowRight, Settings, Lightbulb } from 'lucide-react';

type TabType = 'calendar' | 'homework' | 'meal' | 'finance' | 'notes' | 'shopping' | 'settings';

export default function Dashboard({ onNavigate }: { onNavigate?: (tab: TabType) => void }) {
  const { profile, children } = useApp();
  const { user } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState<(Schedule & { child_name: string; child_color: string; child_grade: string })[]>([]);
  const [upcomingHomework, setUpcomingHomework] = useState<Homework[]>([]);
  const [todayMeals, setTodayMeals] = useState<MealPlan[]>([]);
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([]);
  const [pendingShoppingItems, setPendingShoppingItems] = useState<ShoppingItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<(Event & { child_name?: string; child_color?: string })[]>([]);
  const [budgetSummary, setBudgetSummary] = useState({ planned: 0, actual: 0, percentage: 0, unpaid: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string>(getDayName());

  const dayOptions = [
    { value: 'senin', label: 'Senin' },
    { value: 'selasa', label: 'Selasa' },
    { value: 'rabu', label: 'Rabu' },
    { value: 'kamis', label: 'Kamis' },
    { value: 'jumat', label: 'Jumat' },
    { value: 'sabtu', label: 'Sabtu' },
  ];

  function getDayName() {
    const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    return days[new Date().getDay()];
  }


  const getFormattedDate = () => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const date = new Date();
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, children]);

  useEffect(() => {
    if (user) {
      loadScheduleForDay(selectedDay);
    }
  }, [selectedDay, user, children]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadDashboardData();
      }
    };

    const handleScheduleUpdate = () => {
      if (user) {
        loadDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', () => {
      if (user) loadDashboardData();
    });
    window.addEventListener('scheduleUpdated', handleScheduleUpdate);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => {
        if (user) loadDashboardData();
      });
      window.removeEventListener('scheduleUpdated', handleScheduleUpdate);
    };
  }, [user]);

  const loadUpcomingEvents = async () => {
    if (!user) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', today.toISOString().split('T')[0])
      .lt('event_date', endDate)
      .order('event_date', { ascending: true })
      .limit(3);

    if (data) {
      const eventsWithChild = data.map((event) => {
        if (event.child_id) {
          const child = children.find((c) => c.id === event.child_id);
          return {
            ...event,
            child_name: child?.name,
            child_color: child?.color,
          };
        }
        return event;
      });
      setUpcomingEvents(eventsWithChild as any);
    }
  };

  const loadUnpaidBills = async () => {
    if (!user) return 0;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;

    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('paid', false)
      .gte('expense_date', startDate);

    return data?.length || 0;
  };

  const loadDashboardData = async () => {
    setLoading(true);
    const unpaidCount = await loadUnpaidBills();
    setBudgetSummary((prev) => ({ ...prev, unpaid: unpaidCount }));

    await Promise.all([
      loadTodaySchedule(),
      loadUpcomingHomework(),
      loadTodayMeals(),
      loadPinnedNotes(),
      loadShoppingList(),
      loadBudgetSummary(),
      loadUpcomingEvents(),
    ]);
    setLoading(false);
  };

  const loadTodaySchedule = async () => {
    await loadScheduleForDay(selectedDay);
  };

  const loadScheduleForDay = async (day: string) => {
    if (!user) return;

    if (children.length === 0) {
      setTodaySchedule([]);
      return;
    }

    if (day === 'minggu') {
      setTodaySchedule([]);
      return;
    }

    const schedules = await Promise.all(
      children.map(async (child) => {
        const { data } = await supabase
          .from('schedules')
          .select('*')
          .eq('child_id', child.id)
          .eq('day_of_week', day)
          .maybeSingle();

        if (data) {
          return {
            ...data,
            child_name: child.name,
            child_color: child.color,
            child_grade: child.grade,
          };
        }
        return null;
      })
    );

    setTodaySchedule(schedules.filter((s) => s !== null) as any);
  };

  const loadUpcomingHomework = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const oneWeekLater = new Date();
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);

    const { data } = await supabase
      .from('homework')
      .select('*, children!inner(name, color)')
      .gte('deadline', today)
      .lte('deadline', oneWeekLater.toISOString().split('T')[0])
      .eq('completed', false)
      .order('deadline', { ascending: true })
      .limit(3);

    if (data) setUpcomingHomework(data as any);
  };

  const loadTodayMeals = async () => {
    if (!user) return;

    function getMonday(date: Date): string {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return d.toISOString().split('T')[0];
    }

    const today = new Date();
    const currentWeekStart = getMonday(today);
    const dayName = getDayName();

    const { data } = await supabase
      .from('weekly_meal_plans')
      .select('*, recipes(name, icon)')
      .eq('user_id', user.id)
      .eq('week_start_date', currentWeekStart)
      .eq('day_of_week', dayName);

    if (data) {
      const meals = data.map((plan: any) => ({
        ...plan,
        recipe_name: plan.recipes?.name || 'Menu tidak tersedia',
      }));
      setTodayMeals(meals as any);
    }
  };

  const loadPinnedNotes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('pinned', true)
      .eq('done', false)
      .order('created_at', { ascending: false })
      .limit(3);

    if (data) setPinnedNotes(data);
  };

  const loadShoppingList = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', user.id)
      .eq('checked', false);

    if (data) setPendingShoppingItems(data);
  };

  const loadBudgetSummary = async () => {
    if (!user) return;

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data: budgets } = await supabase
      .from('monthly_budgets')
      .select('planned_amount')
      .eq('user_id', user.id)
      .eq('month', month)
      .eq('year', year);

    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('expense_date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lt('expense_date', month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`);

    const planned = budgets?.reduce((sum, b) => sum + Number(b.planned_amount), 0) || 0;
    const actual = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const percentage = planned > 0 ? (actual / planned) * 100 : 0;

    setBudgetSummary({ planned, actual, percentage });
  };

  const getMealTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      sarapan: 'Sarapan',
      bekal: 'Bekal Sekolah',
      makan_siang: 'Makan Siang',
      makan_malam: 'Makan Malam',
    };
    return labels[type] || type;
  };

  const getChildrenNames = () => {
    return children.map(c => c.name).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  const notesCount = pinnedNotes.length;
  const eventsCount = upcomingEvents.length;
  const mealsCount = todayMeals.length;
  const homeworkCount = upcomingHomework.length;
  const budgetPercentage = budgetSummary.percentage;
  const shoppingCount = pendingShoppingItems.length;

  const dailyTips = [
    'Siapkan baju seragam dari malam sebelumnya agar pagi lebih santai!',
    'Libatkan anak dalam menyiapkan bekal mereka sendiri untuk melatih kemandirian.',
    'Buat checklist PR mingguan bersama anak agar mereka belajar time management.',
    'Sediakan snack sehat di rumah untuk camilan anak setelah sekolah.',
    'Luangkan 15 menit setiap hari untuk ngobrol santai dengan anak.',
    'Buat meal plan mingguan agar belanja bulanan lebih efisien.',
    'Ajak anak membuat budget uang jajan mereka sendiri.',
    'Siapkan emergency kit kecil di tas sekolah anak.',
    'Buat jadwal rutin tidur untuk anak agar tidak kesiangan.',
    'Apresiasi usaha anak, bukan hanya hasil akhirnya.',
  ];

  const getTodayTip = () => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return dailyTips[dayOfYear % dailyTips.length];
  };

  const getNextEvent = () => {
    if (upcomingEvents.length === 0) return null;
    const event = upcomingEvents[0];

    const [year, month, day] = event.event_date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return `${event.title} - Hari ini`;
    if (diffDays === 1) return `${event.title} - Besok`;
    if (diffDays < 0) return `${event.title} - ${Math.abs(diffDays)} hari lalu`;
    return `${event.title} - ${diffDays} hari lagi`;
  };

  return (
    <div className="pb-20">
      <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">
              Halo, Mama {profile?.mama_name}!
            </h1>
            {profile?.show_children_in_greeting && children.length > 0 && (
              <p className="text-pink-50 text-sm">Ibu dari {getChildrenNames()}</p>
            )}
          </div>
          <button
            onClick={() => onNavigate?.('settings')}
            className="bg-white bg-opacity-20 p-2 rounded-full hover:bg-opacity-30 transition-colors"
            title="Pengaturan"
          >
            <Settings size={24} />
          </button>
        </div>
        <p className="text-pink-50 mt-2">{getFormattedDate()}</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate?.('notes')}
            className="bg-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <StickyNote className="text-yellow-500" size={24} />
              <ArrowRight className="text-gray-400" size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{notesCount}</div>
            <div className="text-xs text-gray-600 mt-1">Catatan Penting</div>
            {notesCount > 0 && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {pinnedNotes[0]?.content.substring(0, 20)}...
              </div>
            )}
          </button>

          <button
            onClick={() => onNavigate?.('calendar')}
            className="bg-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-blue-500" size={24} />
              <ArrowRight className="text-gray-400" size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{eventsCount}</div>
            <div className="text-xs text-gray-600 mt-1">Event Bulan Ini</div>
            {getNextEvent() ? (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {getNextEvent()}
              </div>
            ) : (
              <div className="text-xs text-gray-400 mt-1 italic">
                Belum ada event
              </div>
            )}
          </button>

          <button
            onClick={() => onNavigate?.('meal')}
            className="bg-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <UtensilsCrossed className="text-green-500" size={24} />
              <ArrowRight className="text-gray-400" size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{mealsCount}</div>
            <div className="text-xs text-gray-600 mt-1">Menu Hari Ini</div>
            {todayMeals.length > 0 && (
              <div className="text-xs text-gray-500 mt-1 truncate">
                {todayMeals[0]?.recipe_name}
              </div>
            )}
          </button>

          <button
            onClick={() => onNavigate?.('homework')}
            className="bg-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="text-orange-500" size={24} />
              <ArrowRight className="text-gray-400" size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{homeworkCount}</div>
            <div className="text-xs text-gray-600 mt-1">PR Pending</div>
            {upcomingHomework.length > 0 && (
              <div className={`text-xs mt-1 truncate ${
                upcomingHomework[0]?.is_urgent ? 'text-red-600 font-semibold' : 'text-gray-500'
              }`}>
                {upcomingHomework[0]?.is_urgent && '! '}{upcomingHomework[0]?.subject}
              </div>
            )}
          </button>

          <button
            onClick={() => onNavigate?.('finance')}
            className="bg-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <Wallet className="text-purple-500" size={24} />
              <ArrowRight className="text-gray-400" size={18} />
            </div>
            {budgetSummary.unpaid > 0 ? (
              <>
                <div className="text-2xl font-bold text-red-600">{budgetSummary.unpaid}</div>
                <div className="text-xs text-red-600 mt-1 font-semibold">Tagihan harus dibayar</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-xs text-green-600 mt-1">Tagihan harus dibayar</div>
              </>
            )}
          </button>

          <button
            onClick={() => onNavigate?.('shopping')}
            className="bg-white rounded-xl shadow-md p-4 text-left hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="text-pink-500" size={24} />
              <ArrowRight className="text-gray-400" size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-800">{shoppingCount}</div>
            <div className="text-xs text-gray-600 mt-1">Barang harus dibeli</div>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-pink-500" size={20} />
              <h2 className="font-bold text-gray-800">Jadwal Sekolah</h2>
            </div>
            {todaySchedule.length > 0 && (
              <button
                onClick={() => onNavigate?.('calendar')}
                className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
              >
                Detail
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          <div className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {dayOptions.map((day) => (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedDay === day.value
                      ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${
                    getDayName() === day.value
                      ? 'ring-2 ring-pink-300 ring-offset-2'
                      : ''
                  }`}
                >
                  {day.label}
                  {getDayName() === day.value && (
                    <span className="ml-1 text-xs">•</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {todaySchedule.length > 0 ? (
            <div className="space-y-4">
              {todaySchedule.map((schedule) => (
                <button
                  key={schedule.id}
                  onClick={() => onNavigate?.('calendar')}
                  className="w-full bg-gradient-to-r from-gray-50 to-white rounded-lg p-4 border-l-4 text-left hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: schedule.child_color }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shadow-md" style={{ backgroundColor: schedule.child_color }}>
                      {schedule.child_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 text-base">{schedule.child_name}</div>
                      <div className="text-xs text-gray-500">{schedule.child_grade}</div>
                    </div>
                  </div>
                  <div className="space-y-2 ml-13">
                    {schedule.school_hours && (
                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                        <span className="text-blue-600 font-semibold text-xs">🕐</span>
                        <span className="text-sm text-gray-700 font-medium">{schedule.school_hours}</span>
                      </div>
                    )}
                    {schedule.uniform && (
                      <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                        <span className="text-purple-600 font-semibold text-xs">👕</span>
                        <span className="text-sm text-gray-700 font-medium">{schedule.uniform}</span>
                      </div>
                    )}
                    {schedule.subjects && Array.isArray(schedule.subjects) && schedule.subjects.length > 0 && (
                      <div className="bg-pink-50 px-3 py-2 rounded-lg">
                        <p className="text-xs font-semibold text-pink-700 mb-2">📚 Mata Pelajaran:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {schedule.subjects.map((subject: string, idx: number) => (
                            <span
                              key={idx}
                              className="bg-white text-pink-700 px-2 py-1 rounded-full text-xs font-medium shadow-sm"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">😴</div>
              <p className="text-gray-600 font-medium">
                Tidak ada jadwal pada hari {dayOptions.find(d => d.value === selectedDay)?.label}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedDay === getDayName() ? 'Waktunya istirahat dan bermain!' : 'Coba pilih hari lain'}
              </p>
              {children.length === 0 && (
                <button
                  onClick={() => onNavigate?.('settings')}
                  className="mt-4 text-sm text-pink-600 hover:text-pink-700 font-medium"
                >
                  + Tambah data anak di Settings
                </button>
              )}
              {children.length > 0 && (
                <button
                  onClick={() => onNavigate?.('settings')}
                  className="mt-4 text-sm text-pink-600 hover:text-pink-700 font-medium"
                >
                  + Atur jadwal di Settings
                </button>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate?.('finance')}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition-shadow text-left w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Wallet className="text-green-600" size={20} />
              Keuangan Bulan Ini
            </h2>
            <ArrowRight className="text-gray-400" size={20} />
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">Budget vs Realisasi</div>
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all"
                  style={{ width: `${Math.min(budgetSummary.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-600">
                  Rp {budgetSummary.actual.toLocaleString('id-ID')} / Rp {budgetSummary.planned.toLocaleString('id-ID')}
                </span>
                <span className="text-xs font-bold text-green-600">{budgetSummary.percentage.toFixed(0)}%</span>
              </div>
            </div>

            {budgetSummary.planned > budgetSummary.actual && (
              <div className="bg-green-100 px-3 py-2 rounded-lg">
                <span className="text-xs text-green-700">✓ Hemat Rp {(budgetSummary.planned - budgetSummary.actual).toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
        </button>

        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl shadow-md p-4 border-l-4 border-orange-400">
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 p-2 rounded-full flex-shrink-0">
              <Lightbulb className="text-orange-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-sm mb-1">Tips Hari Ini</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{getTodayTip()}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
