import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import {
  Mail, Lock, ArrowRight, Loader2, CheckCircle2,
  Eye, EyeOff, RotateCcw, ShieldCheck, Inbox,
} from 'lucide-react';
import MosaicBackground from './MosaicBackground';
import './AuthPage.css';

// ─── Constants ───────────────────────────────────────────────────────────────

const MIN_PASSWORD_LEN = 8; // 8+ avoids browser "compromised password" heuristics

const ERROR_MAP = {
  'Invalid login credentials': {
    en: 'Incorrect email or password. Try again.',
    es: 'Email o contraseña incorrectos. Intentá de nuevo.',
    it: 'Email o password errati. Riprova.',
  },
  'Email not confirmed': {
    en: 'Please check your inbox and click the confirmation link first.',
    es: 'Revisá tu correo y hacé clic en el enlace de confirmación primero.',
    it: 'Controlla la tua casella e clicca il link di conferma prima.',
  },
  'User already registered': {
    en: 'This email is already registered. Try signing in.',
    es: 'Este email ya está registrado. Intentá iniciar sesión.',
    it: 'Questa email è già registrata. Prova ad accedere.',
  },
  'Password should be at least 6 characters': {
    en: 'Password must be at least 8 characters.',
    es: 'La contraseña debe tener al menos 8 caracteres.',
    it: 'La password deve avere almeno 8 caratteri.',
  },
  'over_email_send_rate_limit': {
    en: 'Too many requests. Please wait a minute and try again.',
    es: 'Demasiados intentos. Esperá un minuto e intentá de nuevo.',
    it: 'Troppi tentativi. Aspetta un minuto e riprova.',
  },
  'rate limit': {
    en: 'Too many requests. Please wait a minute and try again.',
    es: 'Demasiados intentos. Esperá un minuto e intentá de nuevo.',
    it: 'Troppi tentativi. Aspetta un minuto e riprova.',
  },
};

function friendlyError(message, lang) {
  if (!message) return 'An unexpected error occurred.';
  for (const [key, translations] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return translations[lang] || translations.en;
    }
  }
  return message;
}

// ─── Password strength helper ─────────────────────────────────────────────────

function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= MIN_PASSWORD_LEN) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', level: 1 };
  if (score <= 3) return { label: 'Fair', level: 2 };
  return { label: 'Strong', level: 3 };
}

// ─── Motion variants ──────────────────────────────────────────────────────────

const formVariants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, x: -24, transition: { duration: 0.22, ease: 'easeIn' } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const { login, signup, forgotPassword } = useAuth();
  const { t, language } = useLanguage();
  const { currentEnergy } = useEnergy();
  const energyDef = getEnergyDef(currentEnergy || 3);

  const passwordStrength = !isLogin ? getPasswordStrength(password) : null;

  // ── Form validation ──────────────────────────────────────────────────────────
  const validateSignup = () => {
    if (password.length < MIN_PASSWORD_LEN) {
      setError(
        language === 'es' ? `La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres.`
        : language === 'it' ? `La password deve avere almeno ${MIN_PASSWORD_LEN} caratteri.`
        : `Password must be at least ${MIN_PASSWORD_LEN} characters.`
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isLogin && !validateSignup()) return;
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const result = await signup(email, password);
        // session is null if email confirmation is required
        if (result?.user && !result?.session) {
          setSignupSuccess(true);
        }
        // If session exists (email confirmation disabled in Supabase),
        // onAuthStateChange handles the redirect automatically.
      }
    } catch (err) {
      setError(friendlyError(err.message, language));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);
    try {
      await forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setForgotError(friendlyError(err.message, language));
    } finally {
      setForgotLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
  };

  // ── Forgot Password modal ────────────────────────────────────────────────────
  if (showForgot) {
    return (
      <div className="auth-page auth-page--center">
        <motion.div
          className="auth-success-card"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {forgotSent ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <Inbox size={48} className="auth-success-icon" />
              </motion.div>
              <h2>Check your inbox</h2>
              <p style={{ marginBottom: 'var(--space-3)' }}>
                We sent a password-reset link to <strong>{forgotEmail}</strong>.
                Check your spam folder if it doesn't arrive within a few minutes.
              </p>
              <button
                className="btn btn-primary btn-full"
                style={{ marginTop: 'var(--space-5)' }}
                onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
              >
                Back to Sign In <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <h2 style={{ marginBottom: 'var(--space-2)' }}>Reset Password</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 'var(--space-5)' }}>
                Enter your email and we'll send a secure reset link.
              </p>
              <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="auth-field">
                  <label className="auth-label" htmlFor="forgot-email">
                    <Mail size={13} /> Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="auth-input"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    placeholder="hello@misu.app"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {forgotError && (
                  <div className="auth-error">{forgotError}</div>
                )}
                <motion.button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn btn-primary btn-full auth-submit"
                  whileHover={{ scale: forgotLoading ? 1 : 1.02 }}
                  whileTap={{ scale: forgotLoading ? 1 : 0.98 }}
                >
                  {forgotLoading
                    ? <Loader2 className="spin" size={18} />
                    : <>Send Reset Link <ArrowRight size={16} /></>
                  }
                </motion.button>
                <button
                  type="button"
                  className="auth-switch-btn"
                  style={{ textAlign: 'center' }}
                  onClick={() => { setShowForgot(false); setForgotError(''); }}
                >
                  ← Cancel
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Sign-up success screen ───────────────────────────────────────────────────
  if (signupSuccess) {
    return (
      <div className="auth-page auth-page--center">
        <motion.div
          className="auth-success-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="auth-success-header">
            <motion.div
              className="auth-success-icon-wrap"
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="auth-success-icon-glow" />
              <div className="auth-success-icon-inner">
                <Inbox size={26} className="auth-success-icon" />
              </div>
            </motion.div>

            <h2 className="auth-success-title">{t('auth.successTitle')}</h2>
            <p className="auth-success-desc">{t('auth.successMsg')}</p>
          </div>
          {/* Step-by-step premium guide */}
          <div className="auth-success-steps">
            <div className="auth-success-step">
              <div className="auth-success-step__ring">1</div>
              <div className="auth-success-step__text">
                {language === 'es' ? <>Abre el correo que enviamos a <strong>{email}</strong></> 
                 : language === 'it' ? <>Apri l'email che abbiamo inviato a <strong>{email}</strong></>
                 : <>Open the email we sent to <strong>{email}</strong></>}
              </div>
            </div>
            
            <div className="auth-success-step-connector" />

            <div className="auth-success-step">
              <div className="auth-success-step__ring">2</div>
              <div className="auth-success-step__text">
                {language === 'es' ? <>Haz clic en <strong>"Confirm your email"</strong></> 
                 : language === 'it' ? <>Clicca sul link <strong>"Confirm your email"</strong></>
                 : <>Click the <strong>"Confirm your email"</strong> link</>}
              </div>
            </div>

            <div className="auth-success-step-connector" />

            <div className="auth-success-step">
              <div className="auth-success-step__ring">
                <CheckCircle2 size={12} strokeWidth={3} />
              </div>
              <div className="auth-success-step__text">
                {language === 'es' ? 'Se te redirigirá aquí y entrarás automáticamente'
                 : language === 'it' ? 'Tornerai qui e accederai automaticamente'
                 : 'You\'ll be redirected here and signed in securely'}
              </div>
            </div>
          </div>

          <p className="auth-success-spam">
            {language === 'es' ? 'Revisa tu carpeta de spam si no llega en unos minutos.'
             : language === 'it' ? 'Controlla lo spam se non arriva entro pochi minuti.'
             : 'Check your spam folder if it doesn\'t arrive in a few minutes.'}
          </p>

          <button
            className="auth-success-btn-ghost"
            onClick={() => { setSignupSuccess(false); setIsLogin(true); setPassword(''); }}
          >
            <RotateCcw size={14} />
            <span>
              {language === 'es' ? 'Ya lo verifiqué, iniciar sesión' 
               : language === 'it' ? 'Ho già verificato, accedi' 
               : 'I already verified — Sign In'}
            </span>
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Main Layout ──────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">

      {/* Left visual pane */}
      <div className="auth-visual">
        <MosaicBackground
          colorA={energyDef.vividColorA}
          colorB={energyDef.vividColorB}
          tileSize={22}
          speed={0.28}
        />
        <motion.div
          className="auth-visual__content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="auth-visual__wordmark">
            <span className="auth-visual__logo">M</span>
            <span className="auth-visual__brand">misu</span>
          </div>
          <h1 className="auth-visual__headline">
            Your mind,<br />
            <em>organised.</em>
          </h1>
          <p className="auth-visual__tagline">
            Energy-aware tasks,<br />focus, and planning — all in one place.
          </p>
          <div className="auth-visual__energy-dots">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`auth-dot ${i <= (currentEnergy || 3) ? 'active' : ''}`}
              />
            ))}
          </div>
          {/* Security badge */}
          <div className="auth-visual__trust">
            <ShieldCheck size={13} />
            <span>Secure · Encrypted · Private</span>
          </div>
        </motion.div>
      </div>

      {/* Right form pane */}
      <div className="auth-form-pane">
        <motion.div
          className="auth-form-wrapper"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mode toggle pill */}
          <div className="auth-mode-toggle">
            <button
              className={`auth-mode-btn ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); setPassword(''); }}
              type="button"
            >
              {t('auth.loginBtn') || 'Sign In'}
            </button>
            <button
              className={`auth-mode-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); setPassword(''); }}
              type="button"
            >
              {t('auth.signupLink') || 'Create Account'}
            </button>
          </div>

          {/* Form header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login-header' : 'signup-header'}
              className="auth-form-header"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h2 className="auth-form-title">
                {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
              </h2>
              <p className="auth-form-subtitle">
                {isLogin ? t('auth.welcomeBack') : t('auth.initSpace')}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="auth-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login-form' : 'signup-form'}
              onSubmit={handleSubmit}
              className="auth-form"
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Email */}
              <motion.div className="auth-field" custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                <label className="auth-label" htmlFor="auth-email">
                  <Mail size={13} /> {t('auth.email')}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="hello@misu.app"
                  autoComplete="email"
                />
              </motion.div>

              {/* Password */}
              <motion.div className="auth-field" custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                <label className="auth-label" htmlFor="auth-password">
                  <Lock size={13} /> {t('auth.password')}
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    required
                    minLength={isLogin ? 1 : MIN_PASSWORD_LEN}
                    placeholder="••••••••"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Password strength bar (signup only) */}
                {!isLogin && password.length > 0 && passwordStrength && (
                  <div className="auth-strength">
                    <div className="auth-strength__bar">
                      {[1, 2, 3].map(lvl => (
                        <div
                          key={lvl}
                          className={`auth-strength__seg ${lvl <= passwordStrength.level ? `auth-strength__seg--${passwordStrength.level}` : ''}`}
                        />
                      ))}
                    </div>
                    <span className={`auth-strength__label auth-strength__label--${passwordStrength.level}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}

                {!isLogin && (
                  <span className="auth-hint">
                    {language === 'es' ? `Mínimo ${MIN_PASSWORD_LEN} caracteres. Usa mayúsculas y símbolos para mayor seguridad.`
                    : language === 'it' ? `Minimo ${MIN_PASSWORD_LEN} caratteri. Usa maiuscole e simboli per maggiore sicurezza.`
                    : `At least ${MIN_PASSWORD_LEN} characters. Mix uppercase and symbols for a stronger password.`}
                  </span>
                )}
              </motion.div>

              {/* Remember / Forgot */}
              {isLogin && (
                <motion.div
                  className="auth-options"
                  custom={2}
                  variants={fieldVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <label className="auth-remember">
                    <input type="checkbox" style={{ accentColor: 'var(--energy-primary)' }} />
                    {t('auth.rememberMe')}
                  </label>
                  <button
                    type="button"
                    className="auth-forgot"
                    onClick={() => {
                      setForgotEmail(email); // pre-fill with whatever is in the email field
                      setShowForgot(true);
                    }}
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-full auth-submit"
                custom={3}
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading
                  ? <Loader2 className="spin" size={18} />
                  : <>{isLogin ? t('auth.loginBtn') : t('auth.signupBtn')} <ArrowRight size={16} /></>
                }
              </motion.button>
            </motion.form>
          </AnimatePresence>

          {/* Switch mode footer */}
          <p className="auth-switch">
            {isLogin ? t('auth.noAccount') : t('auth.alreadyHaveAccount')}
            <button className="auth-switch-btn" onClick={switchMode} type="button">
              {isLogin ? t('auth.signupLink') : t('auth.loginLink')}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
