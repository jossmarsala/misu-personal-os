import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Headphones, Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import './AuthPage.css';

const ERROR_MAP = {
  'Invalid login credentials': {
    en: 'Incorrect email or password. Try again.',
    es: 'Email o contraseña incorrectos. Intentá de nuevo.',
    it: 'Email o password errati. Riprova.',
  },
  'Email not confirmed': {
    en: 'Check your inbox for the confirmation email first.',
    es: 'Primero revisá tu correo y confirmá tu cuenta.',
    it: 'Controlla la tua casella e conferma il tuo account.',
  },
  'User already registered': {
    en: 'This email is already registered. Try signing in.',
    es: 'Este email ya está registrado. Intentá iniciar sesión.',
    it: 'Questa email è già registrata. Prova ad accedere.',
  },
  'Password should be at least 6 characters': {
    en: 'Password must be at least 6 characters.',
    es: 'La contraseña debe tener al menos 6 caracteres.',
    it: 'La password deve avere almeno 6 caratteri.',
  },
};

function friendlyError(message, lang) {
  for (const [key, translations] of Object.entries(ERROR_MAP)) {
    if (message?.includes(key)) {
      return translations[lang] || translations.en;
    }
  }
  return message;
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { login, signup } = useAuth();
  const { t, language } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const result = await signup(email, password);
        // If Supabase returns a user but no session, email confirmation is needed
        if (result?.user && !result?.session) {
          setSignupSuccess(true);
        }
      }
    } catch (err) {
      setError(friendlyError(err.message, language));
    } finally {
      setLoading(false);
    }
  };

  // Success state after signup
  if (signupSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card bento-card bento-card--accent">
          <div className="auth-success">
            <CheckCircle2 size={48} className="auth-success-icon" />
            <h2>{t('auth.successTitle')}</h2>
            <p>{t('auth.successMsg')}</p>
            <button 
              className="btn btn-primary btn-full" 
              onClick={() => { setSignupSuccess(false); setIsLogin(true); }}
              style={{ marginTop: 'var(--space-6)' }}
            >
              {t('auth.loginBtn')}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card bento-card bento-card--accent">
        <div className="auth-header">
          <Headphones className="auth-logo" size={32} />
          <h2>misu</h2>
          <p>{isLogin ? t('auth.welcomeBack') : t('auth.initSpace')}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail size={16} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={16} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input"
                placeholder="••••••••"
              />
            </div>
            {!isLogin && (
              <span className="auth-hint">{t('auth.passwordHint')}</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 'var(--space-4)' }}>
            {loading ? <Loader2 className="spin" size={16} /> : (isLogin ? t('auth.loginBtn') : t('auth.signupBtn'))}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-switch">
          <button className="btn btn-ghost btn-sm" onClick={() => { setIsLogin(!isLogin); setError(''); }} type="button">
            {isLogin ? t('auth.switchToSignup') : t('auth.switchToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}
