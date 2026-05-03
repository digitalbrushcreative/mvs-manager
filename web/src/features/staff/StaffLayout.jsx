import { Outlet, useNavigate } from 'react-router-dom';
import { SubNav } from '../../components/SubNav/SubNav';
import { useStaff } from '../../lib/hooks/useStaff';

const STAFF_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <path d="M22 11h-6M19 8v6" />
  </svg>
);

const PLUS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export function StaffLayout() {
  const { data: staff } = useStaff();
  const navigate = useNavigate();

  return (
    <>
      <SubNav
        title="Staff Directory"
        icon={STAFF_ICON}
        items={[{ to: '/admin/staff', label: 'All staff', count: staff.length, end: true }]}
        action={{
          label: 'Add staff',
          icon: PLUS_ICON,
          onClick: () => navigate('/admin/staff/new'),
        }}
      />
      <Outlet />
    </>
  );
}
