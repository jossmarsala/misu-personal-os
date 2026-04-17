import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useEnergy } from '../context/EnergyContext';
import { getEnergyDef } from '../utils/energy';
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import MosaicBackground from './MosaicBackground';
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
    if (message?.includes(key)) return translations[lang] || translations.en;
  }
  return message;
}

const formVariants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, x: -24, transition: { duration: 0.22, ease: 'easeIn' } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] } }),
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        if (result?.user && !result?.session) setSignupSuccess(true);
      }
    } catch (err) {
      setError(friendlyError(err.message, language));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setIsLogin(!isLogin); setError(''); };

  // ─── Success Screen ───
  if (signupSuccess) {
    return (
      <div className="auth-page">
        <motion.div
          className="auth-success-card"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <CheckCircle2 size={52} className="auth-success-icon" />
          </motion.div>
          <h2>{t('auth.successTitle')}</h2>
          <p>{t('auth.successMsg')}</p>
          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 'var(--space-6)' }}
            onClick={() => { setSignupSuccess(false); setIsLogin(true); }}
          >
            {t('auth.loginBtn')} <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── Main Layout ───
  return (
    <div className="auth-page">

      {/* Left visual pane — full mosaic */}
      <div className="auth-visual">
        <MosaicBackground
          colorA={energyDef.vividColorA}
          colorB={energyDef.vividColorB}
          tileSize={22}
          speed={0.28}
        />

        {/* Overlaid branding */}
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

          {/* Energy level dots */}
          <div className="auth-visual__energy-dots">
            {[1,2,3,4].map(i => (
              <div
                key={i}
                className={`auth-dot ${i <= (currentEnergy || 3) ? 'active' : ''}`}
              />
            ))}
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
              onClick={() => { setIsLogin(true); setError(''); }}
              type="button"
            >
              {t('auth.loginBtn') || 'Sign In'}
            </button>
            <button
              className={`auth-mode-btn ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
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
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
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
                {!isLogin && (
                  <span className="auth-hint">{t('auth.passwordHint')}</span>
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
                  <a href="#" className="auth-forgot">{t('auth.forgotPassword')}</a>
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
