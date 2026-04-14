import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import { Headphones, Mail, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import BlurText from './BlurText';
import PrismaticBurst from './PrismaticBurst';
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
  const { currentEnergy } = useEnergy(); 
  const energyDef = getEnergyDef(currentEnergy || 3);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const result = await signup(email, password);
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

  if (signupSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-split-card" style={{ maxWidth: '400px' }}>
          <div className="auth-success" style={{ padding: 'var(--space-8)' }}>
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
      <div className="auth-split-card">
        
        {/* Visual Left Pane */}
        <div className="auth-card__left">
           <PrismaticBurst
            animationType="rotate3d"
            intensity={2}
            speed={0.4}
            distort={0}
            paused={false}
            offset={{ x: 0, y: 0 }}
            hoverDampness={0.25}
            rayCount={0}
            mixBlendMode="lighten"
            colors={['#FF5F6D', '#FFC371', '#00C9FF', '#92FE9D', '#FF9A9E', '#FFFFFF']}
          />
        </div>

        {/* Form Right Pane */}
        <div className="auth-card__right">
          <div className="auth-header">
            <Headphones className="auth-logo" size={32} />
            <h2>
              <BlurText 
                text={isLogin ? t('auth.loginTitle') : t('auth.signupTitle')} 
                animateBy="words" 
                delay={100} 
                direction="bottom" 
                className="auth-title-large"
              />
            </h2>
            <p>{isLogin ? t('auth.welcomeBack') : t('auth.initSpace')}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>{t('auth.email')}</label>
              <div className="input-wrapper">
                <Mail size={16} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-minimal"
                  placeholder="hello.misu@gmail.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{t('auth.password')}</label>
              <div className="input-wrapper">
                <Lock size={16} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-minimal"
                  placeholder="••••••••"
                />
              </div>
              {!isLogin && (
                <span className="auth-hint">{t('auth.passwordHint')}</span>
              )}
            </div>

            {isLogin && (
              <div className="auth-options">
                <label>
                  <input type="checkbox" style={{ accentColor: 'var(--energy-primary)' }} /> {t('auth.rememberMe')}
                </label>
                <a href="#" style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}>{t('auth.forgotPassword')}</a>
              </div>
            )}

            <div style={{ marginTop: 'var(--space-2)', width: '100%' }}>
              <button 
                type="submit" 
                disabled={loading} 
                className="btn btn-primary btn-full"
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}>
                  {loading ? <Loader2 className="spin" size={16} /> : (isLogin ? t('auth.loginBtn') : t('auth.signupBtn'))}
                  {!loading && <ArrowRight size={16} />}
                </div>
              </button>
            </div>
          </form>

          <div className="auth-switch">
             <span>{isLogin ? t('auth.noAccount') : t('auth.alreadyHaveAccount')}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => { setIsLogin(!isLogin); setError(''); }} type="button">
              {isLogin ? t('auth.signupLink') : t('auth.loginLink')}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
