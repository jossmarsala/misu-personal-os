import { useState, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { loadSettings, saveSettings, exportToJSON, importFromJSON } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, Download, Upload, Trash2, Key, LogOut, Check } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({ onClose }) {
  const { tasks, importTasksFromJSON, clearAll } = useTasks();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const settings = loadSettings();
    if (settings.geminiApiKey) setApiKey(settings.geminiApiKey);
  }, []);

  const handleSaveApiKey = () => {
    const settings = loadSettings();
    saveSettings({ ...settings, geminiApiKey: apiKey.trim() });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExport = () => {
    exportToJSON(tasks);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const imported = await importFromJSON(file);
      importTasksFromJSON(imported);
      setImportStatus(`${t('settings.import')} ${t('common.success')}`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err) {
      setImportStatus(`${t('common.error')} ${err.message}`);
      setTimeout(() => setImportStatus(null), 4000);
    }
    
    e.target.value = '';
  };

  const handleClear = () => {
    if (confirmClear) {
      clearAll();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick} id="settings-modal">
      <div className="settings-modal scale-in">
        <div className="settings-modal__header">
          <h2 className="settings-modal__title">{t('common.settings')}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Gemini API Key */}
        <div className="settings-modal__section">
          <h3 className="settings-modal__section-title">
            <Key size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            {t('settings.apiKey')}
          </h3>
          <p className="settings-modal__section-desc">
            {t('settings.apiKeyDesc')}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input"
              type="password"
              placeholder="..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              id="api-key-input"
            />
            <button 
              className={`btn btn-sm ${saveSuccess ? 'btn-success' : 'btn-primary'}`} 
              onClick={handleSaveApiKey}
              style={{ minWidth: '70px', transition: 'all 0.3s ease' }}
            >
              {saveSuccess ? <Check size={18} className="animate-scale-in" /> : t('common.save')}
            </button>
          </div>
        </div>

        <hr className="settings-modal__divider" />

        {/* Export / Import */}
        <div className="settings-modal__section">
          <h3 className="settings-modal__section-title">{t('settings.dataManagement')}</h3>
          <div className="settings-section">
            <h3 className="settings-subtitle">{t('common.account')}</h3>
            <p className="settings-desc">{t('settings.signedInAs')} <strong>{user?.email}</strong></p>
            <button className="btn btn-ghost" onClick={logout} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
              <LogOut size={16} /> {t('common.logout')}
            </button>
          </div>
          
          <div className="settings-modal__actions">
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={16} /> {t('settings.export')}
            </button>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> {t('settings.import')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
          {importStatus && (
            <p style={{
              marginTop: '8px',
              fontSize: '0.8rem',
              color: importStatus.startsWith('Error') ? 'var(--danger)' : 'var(--success)',
            }}>
              {importStatus}
            </p>
          )}
        </div>

        <hr className="settings-modal__divider" />

        {/* Danger Zone */}
        <div className="settings-modal__section">
          <h3 className="settings-modal__section-title">{t('settings.dangerZone')}</h3>
          <button
            className={`btn ${confirmClear ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleClear}
          >
            <Trash2 size={16} />
            {confirmClear ? t('settings.confirmClear') : t('settings.clearAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
