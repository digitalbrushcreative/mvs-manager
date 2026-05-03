import { Card } from '../Card/Card';
import styles from './EmptyState.module.css';

export function EmptyState({ icon, title, description, action }) {
  return (
    <Card className={styles.wrap} padded>
      {icon ? <div className={styles.icon}>{icon}</div> : null}
      {title ? <h3 className={styles.title}>{title}</h3> : null}
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </Card>
  );
}
