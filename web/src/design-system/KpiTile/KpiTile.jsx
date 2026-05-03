import clsx from 'clsx';
import styles from './KpiTile.module.css';

/**
 * Compact stat tile. Used for KPI dashboards.
 * `accent` paints the leading bar.
 */
export function KpiTile({ label, value, hint, accent = 'var(--navy)', icon, className }) {
  return (
    <div className={clsx(styles.tile, className)} style={{ '--accent': accent }}>
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      <div className={styles.body}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>{value}</div>
        {hint ? <div className={styles.hint}>{hint}</div> : null}
      </div>
    </div>
  );
}
