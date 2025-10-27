import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import Homework from './components/Homework';
import MealPlanner from './components/MealPlanner';
import Finance from './components/Finance';
import Notes from './components/Notes';
import Shopping from './components/Shopping';
import Settings from './components/Settings';
import { Home, CalendarDays, BookOpen, UtensilsCrossed, Wallet, StickyNote, ShoppingCart } from 'lucide-react';

type Tab = 'dashboard' | 'calendar' | 'homework' | 'meal' | 'finance' | 'notes' | 'shopping' | 'settings';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: appLoading } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (authLoading || appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!profile?.onboarding_completed) {
    return <Onboarding />;
  }

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: Home },
    { id: 'calendar' as Tab, label: 'Kalender', icon: CalendarDays },
    { id: 'homework' as Tab, label: 'PR', icon: BookOpen },
    { id: 'meal' as Tab, label: 'Bekal', icon: UtensilsCrossed },
    { id: 'notes' as Tab, label: 'Catatan', icon: StickyNote },
    { id: 'finance' as Tab, label: 'Keuangan', icon: Wallet },
    { id: 'shopping' as Tab, label: 'Belanja', icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
      <div className="max-w-2xl mx-auto">
        {activeTab === 'dashboard' && <Dashboard onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'homework' && <Homework />}
        {activeTab === 'meal' && <MealPlanner />}
        {activeTab === 'finance' && <Finance />}
        {activeTab === 'notes' && <Notes />}
        {activeTab === 'shopping' && <Shopping />}
        {activeTab === 'settings' && <Settings />}

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-2xl mx-auto relative">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex items-center px-2" style={{ minWidth: 'fit-content' }}>
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`py-3 px-4 flex flex-col items-center gap-1 transition-colors flex-shrink-0 ${
                      activeTab === id
                        ? 'text-pink-600'
                        : 'text-gray-500 hover:text-pink-500'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-xs font-medium whitespace-nowrap">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
