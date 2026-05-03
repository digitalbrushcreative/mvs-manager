import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Input,
  Table,
} from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { PupilForm } from '../PupilForm';
import { PupilDetail } from '../PupilDetail';
import { FrozenBanner } from '../../../components/FrozenBanner/FrozenBanner';
import { usePupils } from '../../../lib/hooks/usePupils';
import { useTrips } from '../../../lib/hooks/useTrips';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { isTripFrozen } from '../../../lib/tripFreeze';
import { Fmt } from '../../../lib/format';

const PAYMENT_VARIANT = {
  paid: 'success',
  deposit: 'info',
  pending: 'warning',
  overdue: 'danger',
  cancelled: 'neutral',
};

export function TripsRosterPage() {
  const { data: trips } = useTrips();
  const { activeTripId, setActiveTripId } = useActiveTripId();
  const { data: pupils } = usePupils(activeTripId);

  const trip = trips.find((t) => t.id === activeTripId);
  const { frozen, reason } = isTripFrozen(trip);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [formMode, setFormMode] = useState(null); // 'create' | 'edit' | null
  const [activePupilId, setActivePupilId] = useState(null);
  const [detailId, setDetailId] = useState(null);

  function openCreate() {
    setActivePupilId(null);
    setFormMode('create');
  }
  function openEdit(id) {
    setActivePupilId(id);
    setFormMode('edit');
  }
  function closeForm() {
    setFormMode(null);
    setActivePupilId(null);
  }

  // Auto-pick a trip when none is active
  useEffect(() => {
    if (!activeTripId && trips.length) setActiveTripId(trips[0].id);
  }, [activeTripId, trips, setActiveTripId]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pupils.filter((p) => {
      if (filter !== 'all' && p.paymentStatus !== filter) return false;
      if (!term) return true;
      const haystack = `${p.firstName} ${p.lastName} ${p.guardianName} ${p.admissionNo}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [pupils, filter, search]);

  const counts = useMemo(() => {
    const out = { all: pupils.length };
    for (const status of ['paid', 'deposit', 'pending', 'overdue']) {
      out[status] = pupils.filter((p) => p.paymentStatus === status).length;
    }
    return out;
  }, [pupils]);

  const columns = [
    {
      key: 'name',
      header: 'Pupil',
      sortable: true,
      sortAccessor: (row) => `${row.lastName} ${row.firstName}`,
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--navy-darker)' }}>
            {row.firstName} {row.lastName}
            {row.flagged ? ' 🚩' : ''}
          </div>
          <div style={{ fontSize: 11, color: 'var(--grey-500)', marginTop: 2 }}>
            {row.admissionNo || '—'} · Grade {row.grade}
          </div>
        </div>
      ),
    },
    {
      key: 'guardian',
      header: 'Guardian',
      sortable: true,
      sortAccessor: (row) => row.guardianName || '',
      render: (row) => (
        <div>
          <div>{row.guardianName || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--grey-500)' }}>{row.guardianEmail || row.guardianPhone || ''}</div>
        </div>
      ),
    },
    {
      key: 'grade',
      header: 'Grade',
      width: 80,
      sortable: true,
      sortAccessor: (row) => row.grade,
      render: (row) => `Grade ${row.grade}`,
    },
    {
      key: 'enrolled',
      header: 'Enrolled',
      width: 130,
      sortable: true,
      sortAccessor: (row) => row.enrolledAt,
      render: (row) => Fmt.date(row.enrolledAt),
    },
    {
      key: 'status',
      header: 'Payment',
      width: 110,
      sortable: true,
      sortAccessor: (row) => row.paymentStatus,
      render: (row) => (
        <Badge variant={PAYMENT_VARIANT[row.paymentStatus] || 'neutral'}>{row.paymentStatus}</Badge>
      ),
    },
  ];

  const filterChips = [
    { key: 'all', label: 'All' },
    { key: 'paid', label: 'Paid' },
    { key: 'deposit', label: 'Deposit' },
    { key: 'pending', label: 'Pending' },
    { key: 'overdue', label: 'Overdue' },
  ];

  return (
    <PageContainer>

      <PageHeader
        title="Roster"
        subtitle={`${pupils.length} ${pupils.length === 1 ? 'pupil' : 'pupils'} enrolled in this trip`}
        actions={
          frozen ? null : (
            <Button variant="primary" onClick={openCreate}>
              Add pupil
            </Button>
          )
        }
      />

      {frozen ? (
        <FrozenBanner
          reason={reason}
          allowance="The roster is read-only as a historical record. Click any pupil to view their details. Late payments can still be recorded on the Payments tab."
        />
      ) : null}

      <Card padded style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {filterChips.map((c) => (
              <Chip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)} count={counts[c.key]}>
                {c.label}
              </Chip>
            ))}
          </div>
          <Input
            placeholder="Search name, admission, guardian…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
        </div>
      </Card>

      <Table
        columns={columns}
        rows={visible}
        onRowClick={(row) => setDetailId(row.id)}
        pageSize={20}
        defaultSort={{ key: 'name', dir: 'asc' }}
        empty={
          <EmptyState
            title="No pupils match"
            description={
              pupils.length
                ? 'Adjust the filter or search above.'
                : frozen
                ? 'This trip ended without any pupils enrolled.'
                : "Add the first pupil to start building this trip's roster."
            }
            action={
              frozen ? null : (
                <Button variant="primary" onClick={openCreate}>
                  Add pupil
                </Button>
              )
            }
          />
        }
      />

      <PupilForm
        open={formMode !== null}
        onClose={closeForm}
        pupilId={formMode === 'edit' ? activePupilId : null}
      />
      <PupilDetail
        readOnly={frozen}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        pupilId={detailId}
        onEdit={(id) => {
          setDetailId(null);
          openEdit(id);
        }}
      />
    </PageContainer>
  );
}
