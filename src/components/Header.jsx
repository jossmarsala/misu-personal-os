import { Settings } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import './Header.css';

export default function Header({ onOpenSettings }) {
  return (
    <header className="header" id="header">
      <div className="container">
        <div className="header__inner">
          <div className="header__brand">
            <span className="header__logo">Misu</span>
          </div>

          <div className="header__right">
            <LanguageSwitcher />
            <ThemeToggle />
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
