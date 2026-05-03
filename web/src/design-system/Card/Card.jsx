import clsx from 'clsx';
import styles from './Card.module.css';

export function Card({ as: Tag = 'div', padded = true, className, children, ...rest }) {
  return (
    <Tag className={clsx(styles.card, padded && styles.padded, className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, actions, className }) {
  return (
    <div className={clsx(styles.header, className)}>
      <div>
        {title ? <h3 className={styles.title}>{title}</h3> : null}
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
