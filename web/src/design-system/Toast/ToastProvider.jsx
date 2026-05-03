import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, kind = 'info', timeoutMs = 3500) => {
      nextId += 1;
      const id = nextId;
      setToasts((list) => [...list, { id, kind, message }]);
      if (timeoutMs > 0) {
        const timer = setTimeout(() => dismiss(id), timeoutMs);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      info: (msg) => push(msg, 'info'),
      success: (msg) => push(msg, 'success'),
      error: (msg) => push(msg, 'error', 5000),
      warning: (msg) => push(msg, 'warning'),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.stack} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.kind}`]}`}>
            <span>{t.message}</span>
            <button type="button" className={styles.close} onClick={() => dismiss(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
