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

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const { login, signup, forgotPassword, updatePassword, resetMode, setResetMode } = useAuth();
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

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    if (newPassword.length < MIN_PASSWORD_LEN) {
      setResetError(
        language === 'es' ? `La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres.`
        : language === 'it' ? `La password deve avere almeno ${MIN_PASSWORD_LEN} caratteri.`
        : `Password must be at least ${MIN_PASSWORD_LEN} characters.`
      );
      return;
    }
    if (newPassword !== repeatPassword) {
      setResetError(t('auth.passwordMismatch') || "Passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      await updatePassword(newPassword);
      setResetSuccess(true);
      setTimeout(() => {
        setResetMode(false);
        setResetSuccess(false);
        setNewPassword('');
        setRepeatPassword('');
      }, 3500);
    } catch (err) {
      setResetError(friendlyError(err.message, language));
    } finally {
      setResetLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setPassword('');
  };

  // ── Forgot Password Overlay ──────────────────────────────────────────────────
  const renderForgotOverlay = () => {
    if (!showForgot) return null;
    return (
      <AnimatePresence>
        <motion.div
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="auth-success-card"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {forgotSent ? (
              <>
                <div className="auth-success-header">
                  <motion.div
                    className="auth-success-icon-wrap"
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <div className="auth-success-icon-glow" />
                    <div className="auth-success-icon-inner">
                      <Inbox size={26} className="auth-success-icon" />
                    </div>
                  </motion.div>
                  <h2 className="auth-success-title">Check your inbox</h2>
                  <p className="auth-success-desc">
                    We sent a password-reset link to <strong>{forgotEmail}</strong>.<br /><br />
                    Check your spam folder if it doesn't arrive within a few minutes.
                  </p>
                </div>
                
                <button
                  className="auth-success-btn-ghost"
                  onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(''); }}
                >
                  <RotateCcw size={14} />
                  <span>Back to Sign In</span>
                </button>
              </>
            ) : (
              <>
                <div className="auth-success-header" style={{ marginBottom: '24px' }}>
                   <motion.div
                    className="auth-success-icon-wrap"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <div className="auth-success-icon-glow" />
                    <div className="auth-success-icon-inner">
                      <Lock size={26} className="auth-success-icon" />
                    </div>
                  </motion.div>
                  <h2 className="auth-success-title">Reset Password</h2>
                  <p className="auth-success-desc">
                    Enter your email and we'll send a secure reset link.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="auth-field" style={{ textAlign: 'left' }}>
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
                    style={{ marginTop: '8px' }}
                  >
                    {forgotLoading
                      ? <Loader2 className="spin" size={18} />
                      : <>Send Reset Link <ArrowRight size={16} /></>
                    }
                  </motion.button>
                  <button
                    type="button"
                    className="auth-switch-btn"
                    style={{ textAlign: 'center', marginTop: '8px' }}
                    onClick={() => { setShowForgot(false); setForgotError(''); }}
                  >
                    ← Cancel
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ── Reset Password Overlay ───────────────────────────────────────────────────
  const renderResetOverlay = () => {
    if (!resetMode) return null;
    const strength = getPasswordStrength(newPassword);

    return (
      <AnimatePresence>
        <motion.div
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="auth-success-card"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {resetSuccess ? (
              <>
                <div className="auth-success-header">
                  <motion.div
                    className="auth-success-icon-wrap"
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <div className="auth-success-icon-glow" style={{ background: 'radial-gradient(circle at center, #22c55e 0%, transparent 70%)' }} />
                    <div className="auth-success-icon-inner" style={{ color: '#22c55e', borderColor: '#22c55e', background: 'rgba(34, 197, 94, 0.12)', boxShadow: 'none' }}>
                      <CheckCircle2 size={26} />
                    </div>
                  </motion.div>
                  <h2 className="auth-success-title">
                    {language === 'es' ? 'Contraseña Actualizada' : language === 'it' ? 'Password Aggiornata' : 'Password Updated'}
                  </h2>
                  <p className="auth-success-desc">
                    {language === 'es' ? 'Tu contraseña ha sido restablecida. Redirigiendo...' : language === 'it' ? 'La tua password è stata ripristinata. Reindirizzamento...' : 'Your password has been successfully reset. Redirecting...'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="auth-success-header" style={{ marginBottom: '24px' }}>
                   <motion.div
                    className="auth-success-icon-wrap"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <div className="auth-success-icon-glow" />
                    <div className="auth-success-icon-inner">
                      <Lock size={26} className="auth-success-icon" />
                    </div>
                  </motion.div>
                  <h2 className="auth-success-title">{t('auth.resetPasswordTitle') || 'Set New Password'}</h2>
                  <p className="auth-success-desc">
                    {t('auth.resetPasswordDesc') || 'Choose a strong password to secure your account.'}
                  </p>
                </div>

                <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                  {/* New Password */}
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reset-password">
                      <Lock size={13} /> {t('auth.newPassword') || 'New Password'}
                    </label>
                    <div className="auth-input-wrap">
                      <input
                        id="reset-password"
                        type={showNewPassword ? 'text' : 'password'}
                        className="auth-input"
                        value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                        required
                        minLength={MIN_PASSWORD_LEN}
                        placeholder="••••••••"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {newPassword.length > 0 && strength && (
                      <div className="auth-strength">
                        <div className="auth-strength__bar">
                          {[1, 2, 3].map(lvl => (
                            <div
                              key={lvl}
                              className={`auth-strength__seg ${lvl <= strength.level ? `auth-strength__seg--${strength.level}` : ''}`}
                            />
                          ))}
                        </div>
                        <span className={`auth-strength__label auth-strength__label--${strength.level}`}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Repeat Password */}
                  <div className="auth-field">
                    <label className="auth-label" htmlFor="reset-repeat-password">
                      <Lock size={13} /> {t('auth.repeatPassword') || 'Repeat Password'}
                    </label>
                    <div className="auth-input-wrap">
                      <input
                        id="reset-repeat-password"
                        type={showRepeatPassword ? 'text' : 'password'}
                        className="auth-input"
                        value={repeatPassword}
                        onChange={e => { setRepeatPassword(e.target.value); setResetError(''); }}
                        required
                        minLength={MIN_PASSWORD_LEN}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                      >
                        {showRepeatPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {resetError && (
                    <div className="auth-error" style={{ marginBottom: 0 }}>{resetError}</div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={resetLoading}
                    className="btn btn-primary btn-full auth-submit"
                    whileHover={{ scale: resetLoading ? 1 : 1.02 }}
                    whileTap={{ scale: resetLoading ? 1 : 0.98 }}
                    style={{ marginTop: '8px' }}
                  >
                    {resetLoading
                      ? <Loader2 className="spin" size={18} />
                      : <>{t('auth.updatePasswordBtn') || 'Update Password'} <ArrowRight size={16} /></>
                    }
                  </motion.button>
                  <button
                    type="button"
                    className="auth-switch-btn"
                    style={{ textAlign: 'center', marginTop: '8px' }}
                    onClick={() => { setResetMode(false); setResetError(''); setNewPassword(''); setRepeatPassword(''); }}
                  >
                    ← Cancel
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // ── Sign-up success screen (Overlay) ─────────────────────────────────────────
  const renderSuccessOverlay = () => {
    if (!signupSuccess) return null;
    return (
      <AnimatePresence>
        <motion.div
          className="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="auth-success-card"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
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
        </motion.div>
      </AnimatePresence>
    );
  };

  // ── Main Layout ──────────────────────────────────────────────────────────────
  return (
    <div className="auth-page">

      {/* Left visual pane */}
      <div className="auth-visual">
        <MosaicBackground
          colorA={energyDef.vividColorA}
          colorB={energyDef.vividColorB}
          colorC={
            currentEnergy === 1 ? '#5BC9F5' :
            currentEnergy === 2 ? '#DC143C' :
            currentEnergy === 4 ? '#8A2BE2' :
            undefined
          }
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
          {/* Mobile visual banner */}
          <div className="auth-mobile-hero">
            <MosaicBackground
              colorA={energyDef.vividColorA}
              colorB={energyDef.vividColorB}
              colorC={
                currentEnergy === 1 ? '#5BC9F5' :
                currentEnergy === 2 ? '#DC143C' :
                currentEnergy === 4 ? '#8A2BE2' :
                undefined
              }
              tileSize={18}
              speed={0.25}
            />
            <div className="auth-mobile-hero__overlay">
              <span className="auth-mobile-hero__logo">M</span>
              <span className="auth-mobile-hero__brand">misu</span>
            </div>
          </div>

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

      {renderSuccessOverlay()}
      {renderForgotOverlay()}
      {renderResetOverlay()}
    </div>
  );
}
