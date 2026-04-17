import { useState, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { loadSettings, saveSettings, exportToJSON, importFromJSON } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, Download, Upload, Trash2, Key, LogOut, Check, User, Database, AlertTriangle } from 'lucide-react';
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

  const handleExport = () => exportToJSON(tasks);

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

        {/* Header */}
        <div className="settings-modal__header">
          <div className="settings-modal__header-left">
            <div className="settings-modal__header-icon">
              <Key size={16} />
            </div>
            <div>
              <h2 className="settings-modal__title">{t('common.settings')}</h2>
              <p className="settings-modal__subtitle">Manage your preferences</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="settings-modal__body">

          {/* ─── Account Section ─── */}
          <section className="settings-section">
            <div className="settings-section__label">
              <User size={12} />
              {t('common.account')}
            </div>
            <div className="settings-section__card">
              <div className="settings-account">
                <div className="settings-account__avatar">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="settings-account__info">
                  <span className="settings-account__title">{t('settings.signedInAs')}</span>
                  <span className="settings-account__email">{user?.email}</span>
                </div>
                <button className="btn btn-ghost btn-sm settings-logout" onClick={logout}>
                  <LogOut size={14} />
                  {t('common.logout')}
                </button>
              </div>
            </div>
          </section>

          {/* ─── API Key Section ─── */}
          <section className="settings-section">
            <div className="settings-section__label">
              <Key size={12} />
              {t('settings.apiKey')}
            </div>
            <div className="settings-section__card">
              <p className="settings-section__desc">{t('settings.apiKeyDesc')}</p>
              <div className="settings-api-row">
                <input
                  className="input"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  id="api-key-input"
                />
                <button
                  className={`btn btn-sm ${saveSuccess ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleSaveApiKey}
                  style={{ minWidth: '70px', flexShrink: 0 }}
                >
                  {saveSuccess ? <Check size={16} /> : t('common.save')}
                </button>
              </div>
            </div>
          </section>

          {/* ─── Data Management Section ─── */}
          <section className="settings-section">
            <div className="settings-section__label">
              <Database size={12} />
              {t('settings.dataManagement')}
            </div>
            <div className="settings-section__card">
              <div className="settings-data-actions">
                <button className="settings-data-btn" onClick={handleExport}>
                  <div className="settings-data-btn__icon">
                    <Download size={16} />
                  </div>
                  <div>
                    <span className="settings-data-btn__title">{t('settings.export')}</span>
                    <span className="settings-data-btn__hint">Download tasks as JSON</span>
                  </div>
                </button>
                <button className="settings-data-btn" onClick={() => fileInputRef.current?.click()}>
                  <div className="settings-data-btn__icon">
                    <Upload size={16} />
                  </div>
                  <div>
                    <span className="settings-data-btn__title">{t('settings.import')}</span>
                    <span className="settings-data-btn__hint">Restore from JSON file</span>
                  </div>
                </button>
                <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              </div>
              {importStatus && (
                <p className={`settings-import-status ${importStatus.startsWith('Error') ? 'error' : 'success'}`}>
                  {importStatus}
                </p>
              )}
            </div>
          </section>

          {/* ─── Danger Zone ─── */}
          <section className="settings-section settings-section--danger">
            <div className="settings-section__label settings-section__label--danger">
              <AlertTriangle size={12} />
              {t('settings.dangerZone')}
            </div>
            <div className="settings-section__card settings-section__card--danger">
              <div className="settings-danger-row">
                <div>
                  <span className="settings-danger-row__title">{t('settings.clearAll')}</span>
                  <span className="settings-danger-row__desc">This action cannot be undone</span>
                </div>
                <button
                  className={`btn btn-sm ${confirmClear ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={handleClear}
                >
                  <Trash2 size={14} />
                  {confirmClear ? t('settings.confirmClear') : t('common.delete')}
                </button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
