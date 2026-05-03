import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Crest } from '../Crest/Crest';
import { Avatar } from '../../design-system';
import { useAuth } from '../../lib/auth';
import styles from './TopNav.module.css';

const ICONS = {
  trips: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8c0 4.5-6 10-6 10S6 12.5 6 8a6 6 0 0 1 12 0Z" />
      <circle cx="12" cy="8" r="2" />
    </svg>
  ),
  clubs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  facilities: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
    </svg>
  ),
  transport: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <line x1="3" y1="14" x2="21" y2="14" />
      <circle cx="7.5" cy="17" r="1.5" />
      <circle cx="16.5" cy="17" r="1.5" />
    </svg>
  ),
  attendance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  staff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M22 11h-6M19 8v6" />
    </svg>
  ),
  suppliers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.3 7 12 12 20.7 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { to: '/admin/trips', label: 'Trips', icon: ICONS.trips },
  { to: '/admin/clubs', label: 'Clubs', icon: ICONS.clubs },
  { to: '/admin/facilities', label: 'Facilities', icon: ICONS.facilities, disabled: true },
  { to: '/admin/transport', label: 'Transport', icon: ICONS.transport, disabled: true },
  { to: '/admin/attendance', label: 'Attendance', icon: ICONS.attendance, disabled: true },
  { to: '/admin/staff', label: 'Staff', icon: ICONS.staff },
  { to: '/admin/suppliers', label: 'Suppliers', icon: ICONS.suppliers, disabled: true },
];

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className={styles.topnav}>
      <div className={styles.brand}>
        <Crest size="md" />
      </div>

      <div className={styles.primary}>
        {NAV_ITEMS.map((item) =>
          item.disabled ? (
            <span key={item.label} className={clsx(styles.item, styles.disabled)} title={`${item.label} (coming soon)`}>
              {item.icon}
              <span>{item.label}</span>
            </span>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(styles.item, isActive && styles.active)}
              title={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ),
        )}
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.userChip}
          onClick={async () => {
            await logout();
            navigate('/auth/login');
          }}
          title="Sign out"
        >
          <Avatar name={user?.name || user?.email || '?'} size="sm" />
          <span className={styles.userName}>{user?.name || user?.email || 'User'}</span>
        </button>
      </div>
    </nav>
  );
}
