import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Expense, MonthlyBudget } from '../lib/supabase';
import { Wallet, Plus, X, CheckCircle, Circle, Trash2 } from 'lucide-react';

const CATEGORIES = [
  'SPP',
  'Belanja Bulanan',
  'Lainnya',
  'Listrik & Air',
  'Transport',
];

const PAYMENT_METHODS = ['Transfer', 'GoPay', 'OVO', 'Dana', 'Cash', 'Kartu Kredit'];

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function Finance() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const [newExpense, setNewExpense] = useState({
    category: 'SPP',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
    payment_method: 'GoPay',
    cashback: '',
    paid: false,
    recurring: false,
  });

  const [budgetAmounts, setBudgetAmounts] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentMonth, currentYear]);

  const loadData = async () => {
    if (!user) return;

    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = currentMonth === 12
      ? `${currentYear + 1}-01-01`
      : `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;

    const [expensesData, budgetsData] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('expense_date', startDate)
        .lt('expense_date', endDate)
        .order('expense_date', { ascending: false }),
      supabase
        .from('monthly_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear),
    ]);

    if (expensesData.data) setExpenses(expensesData.data);
    if (budgetsData.data) {
      setBudgets(budgetsData.data);
      const amounts: { [key: string]: string } = {};
      budgetsData.data.forEach((b) => {
        amounts[b.category] = b.planned_amount.toString();
      });
      setBudgetAmounts(amounts);
    }
  };

  const handleAddExpense = async () => {
    if (!user || !newExpense.amount) return;

    await supabase.from('expenses').insert({
      user_id: user.id,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      expense_date: newExpense.expense_date,
      notes: newExpense.notes,
      payment_method: newExpense.payment_method,
      cashback: parseFloat(newExpense.cashback) || 0,
      paid: newExpense.paid,
      recurring: newExpense.recurring,
    });

    setNewExpense({
      category: 'SPP',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      notes: '',
      payment_method: 'GoPay',
      cashback: '',
      paid: false,
      recurring: false,
    });
    setShowAddExpense(false);
    loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Hapus pengeluaran ini?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    loadData();
  };

  const handleSetBudgets = async () => {
    if (!user) return;

    for (const category of CATEGORIES) {
      const amount = parseFloat(budgetAmounts[category] || '0');
      if (amount > 0) {
        await supabase.from('monthly_budgets').upsert({
          user_id: user.id,
          month: currentMonth,
          year: currentYear,
          category,
          planned_amount: amount,
        });
      }
    }

    setShowSetBudget(false);
    loadData();
  };

  const getCategorySummary = (category: string) => {
    const budget = budgets.find((b) => b.category === category);
    const planned = budget ? Number(budget.planned_amount) : 0;
    const actual = expenses
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const percentage = planned > 0 ? (actual / planned) * 100 : 0;

    return { planned, actual, percentage };
  };

  const getTotalSummary = () => {
    const planned = budgets.reduce((sum, b) => sum + Number(b.planned_amount), 0);
    const actual = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const paid = expenses.filter(e => e.paid).reduce((sum, e) => sum + Number(e.amount), 0);
    const unpaid = expenses.filter(e => !e.paid).reduce((sum, e) => sum + Number(e.amount), 0);
    const cashback = expenses.reduce((sum, e) => sum + Number(e.cashback), 0);
    const percentage = planned > 0 ? (actual / planned) * 100 : 0;

    return { planned, actual, paid, unpaid, cashback, percentage };
  };

  const getPaymentMethodSummary = () => {
    const methods: { [key: string]: { amount: number; count: number } } = {};
    expenses.forEach((e) => {
      if (!methods[e.payment_method]) {
        methods[e.payment_method] = { amount: 0, count: 0 };
      }
      methods[e.payment_method].amount += Number(e.amount);
      methods[e.payment_method].count += 1;
    });
    return methods;
  };

  const getTopExpenseCategory = () => {
    if (expenses.length === 0) return null;

    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
    });

    let maxCategory = '';
    let maxAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount;
        maxCategory = cat;
      }
    });

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const percentage = total > 0 ? (maxAmount / total) * 100 : 0;

    return { category: maxCategory, amount: maxAmount, percentage };
  };

  const getFinancialTip = () => {
    if (!topExpense) return '';

    const isOverBudget = totalSummary.percentage > 100;
    const overAmount = totalSummary.actual - totalSummary.planned;
    const essentialCategories = ['SPP', 'Listrik & Air'];
    const isEssential = essentialCategories.includes(topExpense.category);

    if (isOverBudget) {
      return `Lebih Rp ${overAmount.toLocaleString('id-ID')} dari budget! Kurangi pengeluaran ${topExpense.category} agar anggaran kembali aman.`;
    }

    if (isEssential) {
      return `${topExpense.category} adalah pengeluaran utama (Rp ${topExpense.amount.toLocaleString('id-ID')}, ${topExpense.percentage.toFixed(0)}% dari total). ${
        topExpense.category === 'SPP'
          ? 'Jika memungkinkan, diskusikan opsi pembayaran bertahap ke sekolah.'
          : 'Cek tagihan dan pastikan tidak ada biaya tambahan yang tidak perlu.'
      }`;
    }

    return `${topExpense.category} mendominasi pengeluaran (Rp ${topExpense.amount.toLocaleString('id-ID')}, ${topExpense.percentage.toFixed(0)}% dari total). Cek pengeluaran ini dan optimalkan sesuai prioritas bulanan.`;
  };

  const totalSummary = getTotalSummary();
  const paymentMethods = getPaymentMethodSummary();
  const topExpense = getTopExpenseCategory();
  const financialTip = getFinancialTip();

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center mb-4">
          <Wallet className="text-green-600" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Keuangan</h1>

        <select
          value={`${currentYear}-${currentMonth}`}
          onChange={(e) => {
            const [year, month] = e.target.value.split('-');
            setCurrentYear(parseInt(year));
            setCurrentMonth(parseInt(month));
          }}
          className="w-full max-w-xs mx-auto block px-4 py-2 border border-gray-300 rounded-lg mb-6"
        >
          {Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            return (
              <option key={month} value={`${currentYear}-${month}`}>
                {MONTHS[i]} {currentYear}
              </option>
            );
          })}
        </select>

        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          <div>
            <div className="text-gray-500 mb-1">Total Budget</div>
            <div className="font-bold text-gray-800">Rp {totalSummary.planned.toLocaleString('id-ID')}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Total Pengeluaran</div>
            <div className="font-bold text-gray-800">Rp {totalSummary.actual.toLocaleString('id-ID')}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Sudah Dibayar</div>
            <div className="font-bold text-green-600">Rp {totalSummary.paid.toLocaleString('id-ID')}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Belum Dibayar</div>
            <div className="font-bold text-red-600">Rp {totalSummary.unpaid.toLocaleString('id-ID')}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Total Cashback</div>
            <div className="font-bold text-green-600">Rp {totalSummary.cashback.toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <span>💰</span> Budget Bulanan
            </h2>
            <button
              onClick={() => setShowSetBudget(true)}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              Set Budget {currentYear}-{String(currentMonth).padStart(2, '0')}
            </button>
          </div>

          {budgets.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Belum ada budget</p>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Total Budget</div>
                    <div className="font-bold text-gray-800">Rp {totalSummary.planned.toLocaleString('id-ID')}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Total Realisasi</div>
                    <div className="font-bold text-gray-800">Rp {totalSummary.actual.toLocaleString('id-ID')}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Status</div>
                    <div className={`font-bold ${totalSummary.percentage > 100 ? 'text-red-600' : 'text-green-600'}`}>
                      {totalSummary.percentage > 100 ? '⚠️' : '✅'} {totalSummary.percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {CATEGORIES.map((category) => {
                  const summary = getCategorySummary(category);
                  if (summary.planned === 0) return null;

                  return (
                    <div key={category} className="pb-3 border-b last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{category}</span>
                        <span className={`font-bold ${summary.percentage === 0 ? 'text-green-600' : summary.percentage < 100 ? 'text-blue-600' : 'text-red-600'}`}>
                          {summary.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Rp {summary.actual.toLocaleString('id-ID')} / Rp {summary.planned.toLocaleString('id-ID')}</span>
                        <span className={summary.percentage <= 100 ? 'text-green-600' : 'text-red-600'}>
                          {summary.percentage <= 100 ? '✅ Hemat' : '⚠️ Melebihi'} Rp {Math.abs(summary.planned - summary.actual).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {topExpense && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🧠</span> Analisis Keuangan
            </h2>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">📊</span>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">Analisis Pengeluaran</div>
                    <div className="text-sm text-gray-600 mt-1">{financialTip}</div>
                  </div>
                </div>
              </div>

              {totalSummary.percentage <= 100 ? (
                <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">Hemat Rp {(totalSummary.planned - totalSummary.actual).toLocaleString('id-ID')}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Budget masih aman, pertahankan kontrol pengeluaran dan cek ulang setiap minggu!
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">Pengeluaran Melebihi Budget</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Lebih Rp {(totalSummary.actual - totalSummary.planned).toLocaleString('id-ID')} dari budget yang ditetapkan
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Budget vs Realisasi</h2>
            <button
              onClick={() => setShowSetBudget(true)}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              Edit Budget
            </button>
          </div>

          {budgets.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Belum ada budget</p>
          ) : (
            <div className="space-y-3">
              {CATEGORIES.map((category) => {
                const summary = getCategorySummary(category);
                if (summary.planned === 0) return null;

                return (
                  <div key={category} className="pb-3 border-b last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-800">{category}</span>
                      <span className="text-gray-800">Rp {summary.actual.toLocaleString('id-ID')} / Rp {summary.planned.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-full rounded-full ${summary.percentage < 100 ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(summary.percentage, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${summary.percentage < 100 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className={`text-xs mt-1 text-right ${summary.percentage <= 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.percentage <= 100 ? '✅ Hemat' : '⚠️ Melebihi'} Rp {Math.abs(summary.planned - summary.actual).toLocaleString('id-ID')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {Object.keys(paymentMethods).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>💳</span> Metode Pembayaran
            </h2>
            <div className="space-y-3">
              {Object.entries(paymentMethods)
                .sort(([, a], [, b]) => b.amount - a.amount)
                .map(([method, data]) => (
                  <div key={method} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Wallet size={20} className="text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-800">{method}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">Rp {data.amount.toLocaleString('id-ID')}</div>
                      <div className="text-xs text-gray-500">{data.count}x transaksi</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Daftar Pengeluaran</h2>
            <button
              onClick={() => setShowAddExpense(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
            >
              <Plus size={16} /> Tambah
            </button>
          </div>

          {expenses.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Belum ada transaksi</p>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-start gap-3 py-3 border-b last:border-b-0">
                  <div className="mt-1">
                    {expense.paid ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <Circle size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">{expense.category}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(expense.expense_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {expense.payment_method}
                    </div>
                    {expense.notes && (
                      <div className="text-xs text-gray-500 mt-1">{expense.notes}</div>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="font-bold text-gray-800">Rp {Number(expense.amount).toLocaleString('id-ID')}</div>
                      {expense.cashback > 0 && (
                        <div className="text-xs text-green-600">Cashback: Rp {Number(expense.cashback).toLocaleString('id-ID')}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Daftar Pengeluaran</h2>
              <button onClick={() => setShowAddExpense(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Jumlah"
              />

              <input
                type="date"
                value={newExpense.expense_date}
                onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />

              <select
                value={newExpense.payment_method}
                onChange={(e) => setNewExpense({ ...newExpense, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>

              <input
                type="number"
                value={newExpense.cashback}
                onChange={(e) => setNewExpense({ ...newExpense, cashback: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Cashback (opsional)"
              />

              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700">
                <option>Tidak terkait anak</option>
              </select>

              <textarea
                value={newExpense.notes}
                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Catatan (opsional)"
              />

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExpense.paid}
                    onChange={(e) => setNewExpense({ ...newExpense, paid: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Sudah Dibayar</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExpense.recurring}
                    onChange={(e) => setNewExpense({ ...newExpense, recurring: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Recurring</span>
                </label>
              </div>

              <button
                onClick={handleAddExpense}
                disabled={!newExpense.amount}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 hover:bg-green-700"
              >
                Simpan Pengeluaran
              </button>
            </div>
          </div>
        </div>
      )}

      {showSetBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Set Budget Bulanan</h2>
              <button onClick={() => setShowSetBudget(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {CATEGORIES.map((category) => (
                <div key={category}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{category}</label>
                  <input
                    type="number"
                    value={budgetAmounts[category] || ''}
                    onChange={(e) => setBudgetAmounts({ ...budgetAmounts, [category]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
              ))}

              <button
                onClick={handleSetBudgets}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Simpan Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
