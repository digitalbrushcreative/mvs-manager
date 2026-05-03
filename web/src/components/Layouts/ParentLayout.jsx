import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Crest } from '../Crest/Crest';
import { Avatar, Button } from '../../design-system';
import { useAuth } from '../../lib/auth';
import styles from './Layouts.module.css';

export function ParentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.app}>
      <header className={styles.parentHeader}>
        <div className={styles.parentBrand}>
          <Crest size="md" />
          <div className={styles.parentBrandText}>
            <span className={styles.parentBrandLine1}>Parent Portal</span>
            <span className={styles.parentBrandLine2}>Mountain View School</span>
          </div>
        </div>

        <nav className={styles.parentNav}>
          <NavLink to="/parent" end className={({ isActive }) => clsx(styles.parentNavItem, isActive && styles.parentNavActive)}>
            Trips
          </NavLink>
          <NavLink to="/parent/dashboard" className={({ isActive }) => clsx(styles.parentNavItem, isActive && styles.parentNavActive)}>
            My Children
          </NavLink>
        </nav>

        <div className={styles.parentRight}>
          {user ? (
            <>
              <Avatar name={user.name || user.email} size="sm" />
              <span className={styles.parentUser}>{user.name || user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await logout();
                  navigate('/auth/login');
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => navigate('/auth/login')}>
              Sign in
            </Button>
          )}
        </div>
      </header>

      <Outlet />
    </div>
  );
}
