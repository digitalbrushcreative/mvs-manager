import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import styles from './SubNav.module.css';

/**
 * Module-level sub-navigation. Pass:
 *  - title: module name
 *  - icon:  inline SVG
 *  - items: [{ to, label, count? }]
 *  - action: { label, onClick, icon? } | null
 */
export function SubNav({ title, icon, items, action }) {
  return (
    <nav className={styles.subnav}>
      <div className={styles.title}>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
        <span>{title}</span>
      </div>

      <div className={styles.items}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => clsx(styles.item, isActive && styles.active)}
          >
            <span>{item.label}</span>
            {item.count !== undefined ? <span className={styles.count}>{item.count}</span> : null}
          </NavLink>
        ))}
      </div>

      {action ? (
        <button type="button" className={styles.action} onClick={action.onClick}>
          {action.icon}
          <span>{action.label}</span>
        </button>
      ) : null}
    </nav>
  );
}
