import { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Form.module.css';

export function FormField({ label, hint, required, error, children, className, fullWidth }) {
  return (
    <div className={clsx(styles.field, fullWidth && styles.fullWidth, className)}>
      {label ? (
        <label className={styles.label}>
          {label}
          {required ? <span className={styles.required}>*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <div className={styles.error}>{error}</div> : hint ? <div className={styles.hint}>{hint}</div> : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={clsx(styles.input, className)} {...rest} />;
});

export const Textarea = forwardRef(function Textarea({ className, rows = 3, ...rest }, ref) {
  return <textarea ref={ref} rows={rows} className={clsx(styles.input, styles.textarea, className)} {...rest} />;
});

export const Select = forwardRef(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={clsx(styles.input, styles.select, className)} {...rest}>
      {children}
    </select>
  );
});

export function FormGrid({ columns = 2, children, className }) {
  return (
    <div className={clsx(styles.grid, className)} style={{ '--cols': columns }}>
      {children}
    </div>
  );
}
