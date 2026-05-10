import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  CalendarDays, BookOpen, UtensilsCrossed, Wallet, StickyNote, ShoppingCart,
  ChevronRight, Star, Users, Sparkles, ArrowRight, Mail, Lock, Eye, EyeOff,
  LogIn, UserPlus, Heart, Clock, Shield, Smartphone, MessageCircle
} from 'lucide-react';

type View = 'landing' | 'login' | 'register';

export default function LandingPage() {
  const [view, setView] = useState<View>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn('demo@email.com', 'demo123');
    } catch (err: any) {
      setError(err.message || 'Gagal masuk akun demo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (view === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: CalendarDays,
      title: 'Jadwal Sekolah',
      desc: 'Atur jadwal pelajaran per anak per hari. Tidak perlu lagi ingat hari pakai seragam apa.',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: BookOpen,
      title: 'Tracking PR',
      desc: 'Catat PR anak-anak, deadline, dan status selesai. Tidak ada PR yang terlewat lagi.',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: UtensilsCrossed,
      title: 'Meal Planner',
      desc: 'Rencanakan menu sarapan, bekal, dan makan malam seminggu. Lengkapi dengan resep dan daftar belanja otomatis.',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      icon: Wallet,
      title: 'Keuangan Bulanan',
      desc: 'Catat pengeluaran, atur budget per kategori, pantau cashback. Keuangan rumah tangga lebih terkontrol.',
      color: 'bg-rose-50 text-rose-600',
    },
    {
      icon: StickyNote,
      title: 'Catatan & Pengingat',
      desc: 'Catat pengumuman sekolah, pin catatan penting, dan tandai yang sudah selesai.',
      color: 'bg-amber-50 text-amber-600',
    },
    {
      icon: ShoppingCart,
      title: 'Daftar Belanja',
      desc: 'Buat daftar belanja, track harga, dan langsung tambah bahan dari resep meal planner.',
      color: 'bg-teal-50 text-teal-600',
    },
  ];

  const benefits = [
    { icon: Clock, text: 'Hemat waktu - semua data anak di satu tempat' },
    { icon: Shield, text: 'Aman & privat - data hanya bisa diakses Anda' },
    { icon: Smartphone, text: 'Akses dari HP - responsif di semua ukuran layar' },
    { icon: Heart, text: 'Gratis - tanpa biaya langganan' },
  ];

  const steps = [
    { num: '1', title: 'Daftar Gratis', desc: 'Buat akun pakai email, langsung bisa pakai' },
    { num: '2', title: 'Isi Profil Anak', desc: 'Tambah nama dan kelas anak-anak Anda' },
    { num: '3', title: 'Mulai Atur', desc: 'Isi jadwal, resep, budget - semua tersinkronisasi' },
  ];

  if (view === 'login' || view === 'register') {
    const isLogin = view === 'login';
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={() => setView('landing')}
            className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
          >
            <ArrowRight size={14} className="rotate-180" /> Kembali
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isLogin ? 'Masuk ke SiSatSet' : 'Buat Akun Baru'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {isLogin ? 'Selamat datang kembali!' : 'Gratis, tanpa kartu kredit'}
              </p>
            </div>

            {isLogin && (
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full mb-4 py-3 px-4 rounded-xl border-2 border-dashed border-pink-300 bg-pink-50 text-pink-700 font-medium hover:bg-pink-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={18} />
                Coba Akun Demo
              </button>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">atau</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="mama@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Loading...</span>
                ) : (
                  <>
                    {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                    {isLogin ? 'Masuk' : 'Daftar'}
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
              <button
                onClick={() => { setView(isLogin ? 'register' : 'login'); setError(''); }}
                className="text-pink-600 font-medium hover:text-pink-700"
              >
                {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-200 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-200 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 pt-12 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-pink-600 font-medium mb-6 shadow-sm">
              <Sparkles size={14} />
              Gratis untuk semua emak-emak
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Biar Emak-Emak <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">
                Makin SatSet!
              </span>
            </h1>

            <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
              Satu aplikasi untuk atur jadwal sekolah anak, rencana menu harian, budget keuangan, dan semua catatan penting keluarga.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => setView('register')}
                className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-orange-400 text-white px-8 py-3.5 rounded-xl font-semibold hover:from-pink-600 hover:to-orange-500 transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
              >
                Mulai Gratis <ArrowRight size={18} />
              </button>
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full sm:w-auto bg-white text-pink-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-pink-50 transition-all shadow-md border border-pink-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={18} /> Coba Demo
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Demo: demo@email.com / demo123
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Semua yang Emak Butuhin
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Fitur lengkap yang dirancang khusus untuk membantu ibu-ibu mengatur rumah tangga dengan lebih mudah.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div
                key={title}
                className="group bg-gray-50 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-100"
              >
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-gradient-to-br from-pink-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Kenapa Harus SiSatSet?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={16} />
                </div>
                <p className="text-sm text-gray-700 font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Cara Pakai
            </h2>
            <p className="text-gray-500">Tiga langkah simpel, langsung bisa pakai</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-white text-xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-200">
                  {num}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="py-16 bg-gradient-to-br from-pink-50 to-orange-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Siapa yang Bisa Pakai?
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto mb-8">
            SiSatSet dirancang untuk siapa saja yang mengatur kebutuhan keluarga sehari-hari.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Users, label: 'Ibu rumah tangga' },
              { icon: Star, label: 'Ibu bekerja' },
              { icon: Heart, label: 'Ibu dengan anak sekolah' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-white rounded-xl p-5 shadow-sm flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-pink-500 to-orange-400 rounded-3xl p-10 text-white shadow-xl">
            <h2 className="text-3xl font-bold mb-3">Siap Makin SatSet?</h2>
            <p className="text-pink-100 mb-8 max-w-md mx-auto">
              Daftar sekarang, gratis selamanya. Atau coba dulu pakai akun demo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setView('register')}
                className="bg-white text-pink-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-pink-50 transition-all shadow-md flex items-center justify-center gap-2"
              >
                Daftar Gratis <ChevronRight size={18} />
              </button>
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="bg-white/20 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles size={18} /> Coba Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
            <MessageCircle size={18} />
            <span className="font-medium text-gray-700">Kritik, Saran, atau Masalah?</span>
          </div>
          <a
            href="mailto:sisatset.app@gmail.com"
            className="text-pink-600 font-semibold hover:text-pink-700 transition-colors"
          >
            sisatset.app@gmail.com
          </a>
          <p className="text-xs text-gray-400 mt-2">
            Kami senang mendengar masukan dari Anda untuk membuat SiSatSet lebih baik.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-gray-400 text-center text-xs">
        SiSatSet &copy; {new Date().getFullYear()} - Aplikasi Biar Emak-Emak Makin SatSet
      </footer>
    </div>
  );
}
