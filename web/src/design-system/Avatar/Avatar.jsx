import clsx from 'clsx';
import { Fmt } from '../../lib/format';
import styles from './Avatar.module.css';

const SIZE_PX = { sm: 28, md: 40, lg: 56 };

export function Avatar({ name, colour = 'var(--navy)', size = 'md', className }) {
  const dim = SIZE_PX[size] ?? SIZE_PX.md;
  return (
    <span
      className={clsx(styles.avatar, className)}
      style={{ width: dim, height: dim, background: colour, fontSize: dim * 0.36 }}
    >
      {Fmt.initials(name)}
    </span>
  );
}
