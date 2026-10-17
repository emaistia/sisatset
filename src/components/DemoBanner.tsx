import { Sparkles } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 bg-gradient-to-r from-pink-500/10 to-orange-400/10 border border-pink-200 rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles size={16} className="text-pink-500 flex-shrink-0" />
        <p className="text-xs sm:text-sm text-gray-700 leading-snug truncate">
          <span className="font-semibold text-pink-600">MODE DEMO</span>
          <span className="hidden sm:inline"> — Kamu sedang mencoba SiSatSet dengan data contoh.</span>
          <span className="sm:hidden"> — data contoh.</span>
        </p>
      </div>
      <span className="flex-shrink-0 text-[10px] font-medium bg-pink-100 text-pink-700 rounded-full px-2 py-0.5">
        Contoh Data
      </span>
    </div>
  );
}
