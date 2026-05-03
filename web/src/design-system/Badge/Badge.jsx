import clsx from 'clsx';
import styles from './Badge.module.css';

/**
 * Variants: neutral (default), info, success, warning, danger, gold
 * Or pass a `colour` prop to render with a specific colour.
 */
export function Badge({ variant = 'neutral', colour, children, className, ...rest }) {
  const style = colour ? { background: colour, color: '#fff' } : undefined;
  return (
    <span className={clsx(styles.badge, styles[`badge_${variant}`], className)} style={style} {...rest}>
      {children}
    </span>
  );
}
