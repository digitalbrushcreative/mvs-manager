import { Outlet } from 'react-router-dom';
import { TopNav } from '../TopNav/TopNav';
import styles from './Layouts.module.css';

export function AdminLayout() {
  return (
    <div className={styles.app}>
      <TopNav />
      <Outlet />
    </div>
  );
}
