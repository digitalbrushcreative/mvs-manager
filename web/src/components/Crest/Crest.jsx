import clsx from 'clsx';
import styles from './Crest.module.css';

const SIZE_PX = { sm: 28, md: 36, lg: 56 };

export function Crest({ size = 'md', className }) {
  const dim = SIZE_PX[size] ?? SIZE_PX.md;
  return (
    <span className={clsx(styles.crest, className)} style={{ width: dim, height: dim }}>
      <img src="/mvs-logo-icon.svg" alt="Mountain View School crest" style={{ width: dim - 8, height: dim - 8 }} />
    </span>
  );
}
