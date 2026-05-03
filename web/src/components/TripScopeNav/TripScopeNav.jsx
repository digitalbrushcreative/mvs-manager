import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import styles from './TripScopeNav.module.css';

const TRIPS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8c0 4.5-6 10-6 10S6 12.5 6 8a6 6 0 0 1 12 0Z" />
    <circle cx="12" cy="8" r="2" />
  </svg>
);

const PLUS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/**
 * Trips-module portfolio nav. Three tabs only:
 *   Overview · Active Trips · Past Trips
 *
 * Per-trip navigation lives inside TripDetailLayout.
 */
export function TripScopeNav({ onNewTrip, counts = {} }) {
  const tabs = [
    { to: '/admin/trips', label: 'Overview', end: true },
    { to: '/admin/trips/active', label: 'Active Trips', count: counts.active },
    { to: '/admin/trips/past', label: 'Past Trips', count: counts.past },
  ];

  return (
    <nav className={styles.subnav}>
      <div className={styles.title}>
        <span className={styles.icon}>{TRIPS_ICON}</span>
        <span>Field Trips</span>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) => clsx(styles.tab, isActive && styles.tabActive)}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined ? <span className={styles.count}>{tab.count}</span> : null}
          </NavLink>
        ))}
      </div>

      {onNewTrip ? (
        <button type="button" className={styles.action} onClick={onNewTrip}>
          {PLUS_ICON}
          <span>New trip</span>
        </button>
      ) : null}
    </nav>
  );
}
