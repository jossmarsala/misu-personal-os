import { motion } from 'framer-motion';
import { Home, CheckCircle2, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { playPop } from '../utils/audio';
import './MobileBottomNav.css';

const TABS = [
  { id: 'home',    icon: Home,          labelKey: 'nav.home'    },
  { id: 'tasks',   icon: CheckCircle2,  labelKey: 'nav.tasks'   },
  { id: 'planner', icon: Calendar,      labelKey: 'nav.planner' },
];

export default function MobileBottomNav({ activeTab, onTabChange }) {
  const { t } = useLanguage();

  const handleTap = (id) => {
    if (id !== activeTab) {
      playPop();
      onTabChange(id);
    }
  };

  return (
    <nav className="mobile-bottom-nav" role="tablist" aria-label="Main navigation">
      {TABS.map(({ id, icon: Icon, labelKey }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            aria-label={t(labelKey) || id}
            className={`mobile-bottom-nav__tab${active ? ' mobile-bottom-nav__tab--active' : ''}`}
            onClick={() => handleTap(id)}
          >
            {active && (
              <motion.span
                layoutId="mobile-nav-pill"
                className="mobile-bottom-nav__pill"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="mobile-bottom-nav__icon">
              <Icon size={22} strokeWidth={active ? 2.2 : 1.7} />
            </span>
            <span className="mobile-bottom-nav__label">
              {t(labelKey) || id}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
