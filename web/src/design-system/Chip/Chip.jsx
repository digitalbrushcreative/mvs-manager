import clsx from 'clsx';
import styles from './Chip.module.css';

/**
 * Filter chip with active/inactive states. Use for role/status filters,
 * multi-select pickers, and tag lists. Optional `accent` paints the active state.
 */
export function Chip({ active = false, accent, onClick, count, children, className, ...rest }) {
  const style = active && accent ? { background: accent, borderColor: accent, color: '#fff' } : undefined;
  return (
    <button
      type="button"
      className={clsx(styles.chip, active && styles.active, className)}
      style={style}
      onClick={onClick}
      {...rest}
    >
      <span>{children}</span>
      {count !== undefined ? <span className={styles.count}>{count}</span> : null}
    </button>
  );
}
