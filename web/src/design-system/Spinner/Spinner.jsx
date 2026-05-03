import styles from './Spinner.module.css';

export function Spinner({ size = 20, label }) {
  return (
    <div className={styles.wrap} role="status" aria-label={label || 'Loading'}>
      <span className={styles.dot} style={{ width: size, height: size }} />
      {label ? <span className={styles.label}>{label}</span> : null}
    </div>
  );
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className={styles.fullPage}>
      <Spinner size={28} label={label} />
    </div>
  );
}
