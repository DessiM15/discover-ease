import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build/SSR, env vars might not be available - return a mock client
  // that will fail gracefully at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Server-side: return a mock that will error if used
      return {
        auth: {
          signInWithPassword: () => Promise.resolve({ error: new Error('Supabase not configured') }),
          signUp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
          resetPasswordForEmail: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        },
      } as any;
    }
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

