import { useState, useEffect } from 'react';
import { Settings, Download, Wrench } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import Clock from './Clock';
import BlurText from './BlurText';
import './Header.css';

export default function Header({ onOpenSettings, onOpenTools }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="header" id="header">
      <div className="container">
        <div className="header__inner">
          <div className="header__brand" style={{ display: 'flex', alignItems: 'center' }}>
            <span className="header__logo"></span>
          </div>

          <div className="header__center" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
            <Clock />
          </div>

          <div className="header__right">
            {deferredPrompt && (
              <button
                className="btn btn-ghost btn-icon"
                onClick={handleInstallClick}
                aria-label="Install App"
                title="Install App"
                style={{ color: 'var(--energy-primary)' }}
              >
                <Download size={18} />
              </button>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
            {/* Tools button — mobile only, controlled via CSS */}
            <button
              className="btn btn-ghost btn-icon header__tools-btn"
              onClick={onOpenTools}
              aria-label="Open tools"
              id="tools-btn"
            >
              <Wrench size={18} />
            </button>
            <button
              className="btn btn-ghost btn-icon"
              onClick={onOpenSettings}
              aria-label="Open settings"
              id="settings-btn"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
