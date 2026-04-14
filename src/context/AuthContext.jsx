import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  if (!supabase) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        backgroundColor: '#0a0a0a', 
        color: 'white',
        fontFamily: 'Outfit, sans-serif',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontFamily: 'Instrument Serif', fontSize: '2.5rem', marginBottom: '20px' }}>Configuración Necesaria</h1>
        <p style={{ maxWidth: '500px', lineHeight: '1.6', opacity: 0.8 }}>
          Misu OS está casi listo, pero faltan las <b>Variables de Entorno</b> de Supabase en Vercel.
        </p>
        <div style={{ marginTop: '30px', padding: '15px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333', fontSize: '0.9rem' }}>
          <code>VITE_SUPABASE_URL</code> <br/>
          <code>VITE_SUPABASE_ANON_KEY</code>
        </div>
        <a 
          href="https://vercel.com/dashboard" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ marginTop: '40px', color: '#6d83c4', textDecoration: 'none', borderBottom: '1px solid #6d83c4' }}
        >
          Ir al Panel de Vercel
        </a>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user: session?.user || null, 
      session, 
      login, 
      signup, 
      logout, 
      loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
