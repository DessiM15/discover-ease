"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session, AuthError } from "@supabase/supabase-js";

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

      // Optimize: Get session first (fastest), set user immediately, then verify if needed
      supabase.auth.getSession().then(({ data: { session }, error }: { data: { session: Session | null }, error: AuthError | null }) => {
        if (!mounted) return;
        
        // Set user immediately from session if available (instant UI update)
        if (session?.user) {
          setUser(session.user);
          setLoading(false); // Stop loading immediately
        } else {
          // No session - set loading to false quickly, user will be null
          setLoading(false);
        }
        
        // Verify in background if session exists (non-blocking)
        if (session) {
          // Verify session is still valid in background (don't block)
          supabase.auth.getUser().catch(() => {
            // Silently handle - session might have expired
            if (mounted) {
              setUser(null);
            }
          });
        }
      }).catch((error: unknown) => {
        if (!mounted) return;
        console.error('Auth error:', error);
        setLoading(false);
      });

      // Listen for auth changes (non-blocking)
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
    } catch (error: unknown) {
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

