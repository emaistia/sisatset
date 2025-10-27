import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase, UserProfile, Child } from '../lib/supabase';

type AppContextType = {
  profile: UserProfile | null;
  children: Child[];
  selectedChild: Child | null;
  setSelectedChild: (child: Child | null) => void;
  refreshProfile: () => Promise<void>;
  refreshChildren: () => Promise<void>;
  loading: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children: childrenProp }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
  };

  const refreshChildren = async () => {
    if (!user) {
      setChildren([]);
      setSelectedChild(null);
      return;
    }

    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setChildren(data);
      if (data.length > 0 && !selectedChild) {
        setSelectedChild(data[0]);
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshProfile();
      await refreshChildren();
      setLoading(false);
    };

    loadData();
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        profile,
        children,
        selectedChild,
        setSelectedChild,
        refreshProfile,
        refreshChildren,
        loading,
      }}
    >
      {childrenProp}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
