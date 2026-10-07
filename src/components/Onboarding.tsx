import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { UserCircle, Users, CheckCircle, Mail, Bell } from 'lucide-react';

type Step = 'welcome' | 'name' | 'children' | 'consent';

type ChildInput = {
  name: string;
  grade: string;
  color: string;
};

const COLORS = ['#FF6B9D', '#FF8C42', '#FFD93D', '#6BCF7F', '#4ECDC4', '#A78BFA'];

export default function Onboarding() {
  const { user } = useAuth();
  const { refreshProfile, refreshChildren } = useApp();
  const [step, setStep] = useState<Step>('welcome');
  const [mamaName, setMamaName] = useState('');
  const [childrenCount, setChildrenCount] = useState(1);
  const [children, setChildren] = useState<ChildInput[]>([
    { name: '', grade: '', color: COLORS[0] },
  ]);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNameSubmit = () => {
    if (mamaName.trim()) {
      setStep('children');
    }
  };

  const handleChildrenCountChange = (count: number) => {
    setChildrenCount(count);
    const newChildren: ChildInput[] = [];
    for (let i = 0; i < count; i++) {
      newChildren.push(
        children[i] || { name: '', grade: '', color: COLORS[i % COLORS.length] }
      );
    }
    setChildren(newChildren);
  };

  const updateChild = (index: number, field: keyof ChildInput, value: string) => {
    const newChildren = [...children];
    newChildren[index] = { ...newChildren[index], [field]: value };
    setChildren(newChildren);
  };

  const handleChildrenSubmit = () => {
    setStep('consent');
  };

  const handleComplete = async () => {
    if (!user) return;

    const validChildren = children.filter((c) => c.name.trim() && c.grade.trim());
    if (validChildren.length === 0) return;

    setLoading(true);
    try {
      await supabase.from('user_profiles').upsert({
        id: user.id,
        mama_name: mamaName,
        email: user.email ?? null,
        marketing_consent: marketingConsent,
        marketing_consent_at: marketingConsent ? new Date().toISOString() : null,
        show_children_in_greeting: true,
        onboarding_completed: true,
      });

      for (const child of validChildren) {
        await supabase.from('children').insert({
          user_id: user.id,
          name: child.name,
          grade: child.grade,
          color: child.color,
        });
      }

      if (marketingConsent && user.email) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscribe-marketing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: user.email,
            name: mamaName,
          }),
        });
      }

      await refreshProfile();
      await refreshChildren();
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <img
            src="https://i.imgur.com/ocr7428.png"
            alt="SiSatSet Logo"
            className="h-20 mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-pink-600 mb-4">
            Selamat Datang di SiSatSet!
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Aplikasi yang bikin hidup emak-emak makin SatSet! Kelola jadwal anak, menu
            masakan, keuangan, dan catatan penting dalam satu aplikasi.
          </p>
          <button
            onClick={() => setStep('name')}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-orange-500 transition-all"
          >
            Mulai Sekarang
          </button>
        </div>
      </div>
    );
  }

  if (step === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-100 p-3 rounded-full">
              <UserCircle className="text-pink-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Perkenalkan Diri</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Siapa nama mama yang akan menggunakan aplikasi ini?
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Mama
            </label>
            <input
              type="text"
              value={mamaName}
              onChange={(e) => setMamaName(e.target.value)}
              placeholder="Contoh: Siti"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleNameSubmit}
            disabled={!mamaName.trim()}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Lanjut
          </button>
        </div>
      </div>
    );
  }

  if (step === 'children') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-100 p-3 rounded-full">
              <Users className="text-pink-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Data Anak</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Berapa anak yang sekolah dan perlu dijadwalkan?
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Anak
            </label>
            <select
              value={childrenCount}
              onChange={(e) => handleChildrenCountChange(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} Anak
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 mb-6">
            {children.map((child, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: child.color }}
                  />
                  <h3 className="font-semibold text-gray-800">Anak {index + 1}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama
                    </label>
                    <input
                      type="text"
                      value={child.name}
                      onChange={(e) => updateChild(index, 'name', e.target.value)}
                      placeholder="Nama anak"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelas
                    </label>
                    <input
                      type="text"
                      value={child.grade}
                      onChange={(e) => updateChild(index, 'grade', e.target.value)}
                      placeholder="Contoh: TK A, SD 1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warna
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateChild(index, 'color', color)}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          child.color === color ? 'ring-2 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleChildrenSubmit}
            disabled={children.every((c) => !c.name.trim())}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Lanjut
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-pink-100 p-3 rounded-full">
            <Bell className="text-pink-600" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Hampir Selesai!</h2>
        </div>

        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="text-pink-600 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-800 mb-1">
                Email mama: {user?.email}
              </p>
              <p className="text-xs text-gray-500">
                Email ini akan digunakan untuk mengirim tips, info, dan promo dari
                SiSatSet (hanya jika mama setuju).
              </p>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            Saya setuju menerima tips, informasi, dan promo dari SiSatSet melalui
            email. Saya tahu bahwa saya bisa berhenti berlangganan kapan saja.
          </span>
        </label>

        <button
          onClick={handleComplete}
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Loading...</span>
          ) : (
            <>
              <CheckCircle size={20} />
              Selesai
            </>
          )}
        </button>

        {!marketingConsent && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full text-gray-500 text-sm py-2 mt-2 hover:text-gray-700 transition-colors"
          >
            Lewati tanpa berlangganan
          </button>
        )}
      </div>
    </div>
  );
}
