import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import './AuthPage.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card bento-card bento-card--accent">
        <div className="auth-header">
          <Sparkles className="auth-logo" size={32} />
          <h2>Misu OS</h2>
          <p>{isLogin ? 'Sign in to sync your mind.' : 'Initialize your cognitive space.'}</p>
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
                placeholder="zeus@olympus.com"
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
                className="input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 'var(--space-4)' }}>
            {loading ? <Loader2 className="spin" size={16} /> : (isLogin ? 'Access System' : 'Create Account')}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="auth-switch">
          <button className="btn btn-ghost btn-sm" onClick={() => setIsLogin(!isLogin)} type="button">
            {isLogin ? 'New to Misu? Initialize here.' : 'Already have an instance? Sign in.'}
          </button>
        </div>
      </div>
    </div>
  );
}
