"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    try {
      const supabase = createClient();

      // Get initial session
      supabase.auth.getUser().then(({ data: { user }, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('Auth error:', error);
          setLoading(false);
          return;
        }
        setUser(user);
        setLoading(false);
      }).catch((error) => {
        if (!mounted) return;
        console.error('Auth error:', error);
        setLoading(false);
      });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

