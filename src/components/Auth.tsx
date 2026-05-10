import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);
  const [checkingServer, setCheckingServer] = useState(false);
  const { signIn, signUp, connectionError } = useAuth();

  const isPaused = connectionError || (error && (
    error.includes('Failed to fetch') ||
    error.includes('NetworkError') ||
    error.includes('Network request failed') ||
    error.includes('dijeda') ||
    error.includes('tidak dapat terhubung')
  ));

  const checkServer = async () => {
    setCheckingServer(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        setServerReachable(true);
      } else {
        const text = await response.text();
        if (text.includes('paused')) {
          setServerReachable(false);
        } else {
          setServerReachable(false);
        }
      }
    } catch {
      setServerReachable(false);
    } finally {
      setCheckingServer(false);
    }
  };

  useEffect(() => {
    checkServer();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="SiSatSet Logo"
            className="h-24 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-pink-600 mb-2">SiSatSet</h1>
          <p className="text-gray-600">Aplikasi Biar Emak-Emak Makin SatSet!</p>
        </div>

        {serverReachable === false && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={22} />
              <div className="space-y-3">
                <h3 className="font-semibold text-amber-800">Server Sedang Tidak Aktif</h3>
                <p className="text-sm text-amber-700">
                  Proyek Supabase sedang dijeda. Data Anda aman, tapi server perlu diaktifkan kembali.
                </p>
                <ol className="text-sm text-amber-700 space-y-1.5 list-decimal list-inside">
                  <li>Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium inline-flex items-center gap-1 hover:text-amber-900">Supabase Dashboard <ExternalLink size={12} /></a></li>
                  <li>Pilih proyek <span className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">fzemlwjgfpasnvafvybk</span></li>
                  <li>Klik tombol <strong>&quot;Restore&quot;</strong> atau <strong>&quot;Unpause&quot;</strong></li>
                  <li>Tunggu beberapa menit hingga proyek aktif kembali</li>
                </ol>
                <button
                  onClick={checkServer}
                  disabled={checkingServer}
                  className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw size={14} className={checkingServer ? 'animate-spin' : ''} />
                  {checkingServer ? 'Memeriksa...' : 'Cek Koneksi Lagi'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isLogin
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                !isLogin
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Daftar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="mama@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Minimal 6 karakter"
              />
            </div>

            {error && !isPaused && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || serverReachable === false}
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
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
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
