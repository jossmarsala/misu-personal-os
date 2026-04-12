import { useState, useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { loadSettings, saveSettings, exportToJSON, importFromJSON } from '../services/storage';
import { X, Download, Upload, Trash2, Key } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({ onClose }) {
  const { tasks, importTasksFromJSON, clearAll } = useTasks();
  const [apiKey, setApiKey] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const settings = loadSettings();
    if (settings.geminiApiKey) setApiKey(settings.geminiApiKey);
  }, []);

  const handleSaveApiKey = () => {
    const settings = loadSettings();
    saveSettings({ ...settings, geminiApiKey: apiKey.trim() });
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
      setImportStatus(`Imported ${imported.length} tasks successfully!`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch (err) {
      setImportStatus(`Error: ${err.message}`);
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
      <div className="settings-modal">
        <div className="settings-modal__header">
          <h2 className="settings-modal__title">Settings</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Gemini API Key */}
        <div className="settings-modal__section">
          <h3 className="settings-modal__section-title">
            <Key size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Gemini API Key
          </h3>
          <p className="settings-modal__section-desc">
            Required for AI-powered weekly planning.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input"
              type="password"
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              id="api-key-input"
            />
            <button className="btn btn-primary btn-sm" onClick={handleSaveApiKey}>
              Save
            </button>
          </div>
        </div>

        <hr className="settings-modal__divider" />

        {/* Export / Import */}
        <div className="settings-modal__section">
          <h3 className="settings-modal__section-title">Data Management</h3>
          <div className="settings-modal__actions">
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download size={16} /> Export Tasks
            </button>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Import Tasks
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
          <h3 className="settings-modal__section-title">Danger Zone</h3>
          <button
            className={`btn ${confirmClear ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleClear}
          >
            <Trash2 size={16} />
            {confirmClear ? 'Click again to confirm' : 'Clear All Tasks'}
          </button>
        </div>
      </div>
    </div>
  );
}
