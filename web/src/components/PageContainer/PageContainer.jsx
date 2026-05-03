import clsx from 'clsx';
import styles from './PageContainer.module.css';

export function PageContainer({ children, narrow = false, className }) {
  return <main className={clsx(styles.page, narrow && styles.narrow, className)}>{children}</main>;
}
