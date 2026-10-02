import { useState, useEffect, useRef, useCallback } from 'react';
import { ClipboardList, Plus, Trash2, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { playPop } from '../utils/audio';
import DraggableWidget from './DraggableWidget';
import './DailyChecklist.css';

const STORAGE_KEY = 'misu-daily-checklist';
const DATE_KEY    = 'misu-daily-checklist-date';

function todayString() {
  // YYYY-MM-DD in local time
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const date  = localStorage.getItem(DATE_KEY);
    // If stored date differs from today, wipe it
    if (date !== todayString()) return [];
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    localStorage.setItem(DATE_KEY, todayString());
  } catch { /* ignore quota errors */ }
}

let _id = Date.now();
const uid = () => String(++_id);

export default function DailyChecklist({ visible, onClose }) {
  const { t } = useLanguage();
  const [items, setItems]   = useState(loadItems);
  const [draft, setDraft]   = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const inputRef  = useRef(null);
  const editRef   = useRef(null);

  // Persist whenever items change
  useEffect(() => {
    saveItems(items);
  }, [items]);

  // Auto-clear at midnight
  useEffect(() => {
    const msUntilMidnight = () => {
      const now  = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 0, 0);
      return next - now;
    };

    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        setItems([]);
        saveItems([]);
        schedule(); // reschedule for next midnight
      }, msUntilMidnight());
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  // Focus add-input when widget opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [visible]);

  // Focus edit input when editing
  useEffect(() => {
    if (editId !== null) {
      setTimeout(() => editRef.current?.focus(), 60);
    }
  }, [editId]);

  const addItem = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setItems(prev => [...prev, { id: uid(), text, done: false }]);
    setDraft('');
    playPop();
    inputRef.current?.focus();
  }, [draft]);

  const toggleDone = useCallback((id) => {
    setItems(prev =>
      prev.map(it => it.id === id ? { ...it, done: !it.done } : it)
    );
    playPop();
  }, []);

  const deleteItem = useCallback((id) => {
    setItems(prev => prev.filter(it => it.id !== id));
  }, []);

  const startEdit = useCallback((item) => {
    setEditId(item.id);
    setEditText(item.text);
  }, []);

  const commitEdit = useCallback((id) => {
    const text = editText.trim();
    if (text) {
      setItems(prev => prev.map(it => it.id === id ? { ...it, text } : it));
    }
    setEditId(null);
    setEditText('');
  }, [editText]);

  const clearDone = useCallback(() => {
    setItems(prev => prev.filter(it => !it.done));
  }, []);

  if (!visible) return null;

  const doneCount  = items.filter(it => it.done).length;
  const totalCount = items.length;
  const progress   = totalCount > 0 ? doneCount / totalCount : 0;

  return (
    <DraggableWidget
      id="daily-checklist"
      title={t('checklist.title')}
      icon={<ClipboardList size={14} />}
      defaultPosition={{ x: Math.max(20, window.innerWidth - 330), y: 200 }}
      customWidth={290}
    >
      <div className="checklist">

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="checklist__progress-wrap">
            <div className="checklist__progress-bar">
              <div
                className="checklist__progress-fill"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="checklist__progress-label">
              {doneCount}/{totalCount}
            </span>
          </div>
        )}

        {/* Item list */}
        <ul className="checklist__list" role="list">
          {items.length === 0 && (
            <li className="checklist__empty">
              <span className="checklist__empty-icon">✨</span>
              <span>{t('checklist.empty')}</span>
            </li>
          )}

          {items.map(item => (
            <li
              key={item.id}
              className={`checklist__item ${item.done ? 'done' : ''}`}
            >
              {/* Check button */}
              <button
                className={`checklist__check ${item.done ? 'checked' : ''}`}
                onClick={() => toggleDone(item.id)}
                aria-label={item.done ? t('checklist.uncheck') : t('checklist.check')}
              >
                {item.done && <Check size={10} strokeWidth={3} />}
              </button>

              {/* Text / edit field */}
              {editId === item.id ? (
                <input
                  ref={editRef}
                  className="checklist__edit-input"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onBlur={() => commitEdit(item.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter')  commitEdit(item.id);
                    if (e.key === 'Escape') { setEditId(null); setEditText(''); }
                  }}
                />
              ) : (
                <span
                  className="checklist__text"
                  onDoubleClick={() => !item.done && startEdit(item)}
                  title={t('checklist.doubleClickEdit')}
                >
                  {item.text}
                </span>
              )}

              {/* Delete */}
              <button
                className="checklist__delete"
                onClick={() => deleteItem(item.id)}
                aria-label={t('checklist.delete')}
              >
                <Trash2 size={11} />
              </button>
            </li>
          ))}
        </ul>

        {/* Add input */}
        <div className="checklist__add-row">
          <input
            ref={inputRef}
            className="checklist__add-input"
            placeholder={t('checklist.placeholder')}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addItem();
            }}
            maxLength={120}
          />
          <button
            className="checklist__add-btn"
            onClick={addItem}
            disabled={!draft.trim()}
            aria-label={t('checklist.add')}
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Footer: clear done */}
        {doneCount > 0 && (
          <button className="checklist__clear-done" onClick={clearDone}>
            {t('checklist.clearDone')} ({doneCount})
          </button>
        )}

        {/* Ephemeral hint */}
        <p className="checklist__hint">{t('checklist.hint')}</p>
      </div>
    </DraggableWidget>
  );
}
