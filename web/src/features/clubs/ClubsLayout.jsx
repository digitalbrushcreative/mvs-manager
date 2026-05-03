import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SubNav } from '../../components/SubNav/SubNav';
import { useClubs } from '../../lib/hooks/useClubs';
import { ClubForm } from './ClubForm';

const CLUBS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const PLUS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export function ClubsLayout() {
  const { data: clubs } = useClubs();
  const [formOpen, setFormOpen] = useState(false);
  const [formId, setFormId] = useState(null);

  const openNew = () => {
    setFormId(null);
    setFormOpen(true);
  };
  const openEdit = (id) => {
    setFormId(id);
    setFormOpen(true);
  };

  return (
    <>
      <SubNav
        title="Club Manager"
        icon={CLUBS_ICON}
        items={[
          { to: '/admin/clubs', label: 'Dashboard', end: true },
          { to: '/admin/clubs/list', label: 'Clubs', count: clubs.length },
          { to: '/admin/clubs/members', label: 'Members' },
          { to: '/admin/clubs/trips', label: 'Linked trips' },
        ]}
        action={{
          label: 'New club',
          icon: PLUS_ICON,
          onClick: openNew,
        }}
      />
      <Outlet context={{ openNew, openEdit }} />
      <ClubForm open={formOpen} onClose={() => setFormOpen(false)} clubId={formId} />
    </>
  );
}
