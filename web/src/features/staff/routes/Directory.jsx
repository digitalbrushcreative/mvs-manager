import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Chip, EmptyState, PageSpinner } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useStaff } from '../../../lib/hooks/useStaff';
import { useTrips } from '../../../lib/hooks/useTrips';
import { Enums, STAFF_ROLE_META } from '../../../lib/schema';
import { StaffCard } from '../StaffCard';
import { StaffForm } from '../StaffForm';
import styles from './Directory.module.css';

export function StaffDirectoryPage({ creating = false }) {
  const navigate = useNavigate();
  const params = useParams();
  const editingId = params.staffId || null;
  const formOpen = creating || Boolean(editingId);

  const { data: staff, isLoading } = useStaff();
  const { data: trips } = useTrips();

  const [activeRole, setActiveRole] = useState('all');
  const [showInactive, setShowInactive] = useState(false);

  const visible = useMemo(() => {
    return staff
      .filter((s) => (showInactive || s.active !== false) && (activeRole === 'all' || s.role === activeRole))
      .slice()
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
  }, [staff, activeRole, showInactive]);

  const counts = useMemo(() => {
    const base = staff.filter((s) => showInactive || s.active !== false);
    const out = { all: base.length };
    Enums.StaffRole.forEach((r) => {
      out[r] = base.filter((s) => s.role === r).length;
    });
    return out;
  }, [staff, showInactive]);

  const tripsByStaff = useMemo(() => {
    const map = new Map();
    trips.forEach((t) => {
      (t.assignedStaffIds || []).forEach((id) => {
        map.set(id, (map.get(id) || 0) + 1);
      });
    });
    return map;
  }, [trips]);

  if (isLoading) return <PageSpinner />;

  function closeForm() {
    navigate('/admin/staff');
  }

  return (
    <PageContainer>
      <PageHeader
        title="Staff Directory"
        subtitle={`${staff.length} member${staff.length === 1 ? '' : 's'} · used to fill chaperone seats on trips and lead clubs`}
        actions={
          <label className={styles.toggle}>
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive
          </label>
        }
      />

      <Card padded style={{ marginBottom: 18 }}>
        <div className={styles.filters}>
          <Chip active={activeRole === 'all'} onClick={() => setActiveRole('all')} count={counts.all}>
            All
          </Chip>
          {Enums.StaffRole.map((r) =>
            counts[r] ? (
              <Chip
                key={r}
                active={activeRole === r}
                accent={STAFF_ROLE_META[r].colour}
                onClick={() => setActiveRole(r)}
                count={counts[r]}
              >
                {STAFF_ROLE_META[r].label}
              </Chip>
            ) : null,
          )}
        </div>
      </Card>

      {!visible.length ? (
        <EmptyState
          title={staff.length ? 'No staff match' : 'No staff yet'}
          description={
            staff.length
              ? 'Try a different role filter, or include inactive staff.'
              : 'Add the first staff member to start linking them to trips and clubs.'
          }
        />
      ) : (
        <div className={styles.grid}>
          {visible.map((s) => (
            <StaffCard
              key={s.id}
              staff={s}
              tripCount={tripsByStaff.get(s.id) || 0}
              onClick={() => navigate(`/admin/staff/${s.id}`)}
            />
          ))}
        </div>
      )}

      <StaffForm open={formOpen} onClose={closeForm} staffId={editingId} />
    </PageContainer>
  );
}
