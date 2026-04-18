import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

// Production URL — used for email verification redirect
const PRODUCTION_URL = 'https://misu-os.vercel.app';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  // True when a user just verified their email by clicking the link
  const [justVerified, setJustVerified] = useState(false);
  // True when a user clicked the reset password link
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Restore any existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setLoading(false);

      // Supabase fires SIGNED_IN when an email-verification link is clicked
      // and the token is exchanged automatically from the URL hash/code.
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        // Only flag as justVerified if confirmed_at is very recent (< 5 min)
        const confirmedAt = new Date(session.user.email_confirmed_at).getTime();
        const isRecent = Date.now() - confirmedAt < 5 * 60 * 1000;
        if (isRecent) setJustVerified(true);
      }

      if (event === 'PASSWORD_RECOVERY') {
        setResetMode(true);
      }
    });

    // Also check URL for ?reset=1 as a fallback/hint if needed
    if (window.location.search.includes('reset=1') || window.location.hash.includes('type=recovery')) {
      setResetMode(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Always redirect to the production URL after email verification
        emailRedirectTo: PRODUCTION_URL,
      },
    });
    if (error) throw error;
    return data;
  };

  const forgotPassword = async (email) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${PRODUCTION_URL}?reset=1`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setResetMode(false);
  };

  const logout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user: session?.user || null,
      session,
      login,
      signup,
      forgotPassword,
      updatePassword,
      logout,
      loading,
      justVerified,
      resetMode,
      setResetMode,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
