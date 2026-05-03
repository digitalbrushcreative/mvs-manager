import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './Modal.module.css';

/**
 * Controlled modal. Pass `open` and `onClose` to drive it.
 * Sizes: sm, md (default), lg, xl
 */
export function Modal({ open, onClose, title, subtitle, size = 'md', footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className={styles.backdrop} onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={clsx(styles.dialog, styles[`dialog_${size}`])} role="dialog" aria-modal="true">
        {(title || subtitle) && (
          <header className={styles.header}>
            <div>
              {title ? <h2 className={styles.title}>{title}</h2> : null}
              {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </div>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              ×
            </button>
          </header>
        )}
        <div className={styles.body}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
