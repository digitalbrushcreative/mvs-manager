import styles from './PageHeader.module.css';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className={styles.header}>
      <div>
        {title ? <h1 className={styles.title}>{title}</h1> : null}
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}
