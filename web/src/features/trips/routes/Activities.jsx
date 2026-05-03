import { useState } from 'react';
import { Badge, Button, EmptyState, Table } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { ActivityForm } from '../ActivityForm';
import { FrozenBanner } from '../../../components/FrozenBanner/FrozenBanner';
import { useActivities } from '../../../lib/hooks/useActivities';
import { useTrips } from '../../../lib/hooks/useTrips';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { isTripFrozen } from '../../../lib/tripFreeze';
import { Fmt } from '../../../lib/format';

const TYPE_VARIANT = {
  included: 'success',
  ticketed: 'info',
  optional: 'neutral',
};

export function TripsActivitiesPage() {
  const { activeTripId } = useActiveTripId();
  const { data: activities } = useActivities(activeTripId);
  const { data: trips } = useTrips();
  const trip = trips.find((t) => t.id === activeTripId);
  const { frozen, reason } = isTripFrozen(trip);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const sorted = activities.slice().sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  const columns = [
    { key: 'day', header: 'Day', width: 60, render: (r) => `Day ${r.day}` },
    {
      key: 'title',
      header: 'Activity',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--navy-darker)' }}>{r.title}</div>
          {r.supplier ? <div style={{ fontSize: 11, color: 'var(--grey-500)', marginTop: 2 }}>{r.supplier}</div> : null}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      width: 110,
      render: (r) => <Badge variant={TYPE_VARIANT[r.type] || 'neutral'}>{r.type}</Badge>,
    },
    {
      key: 'time',
      header: 'Time',
      width: 110,
      render: (r) => `${r.startTime || '—'}${r.duration ? ` · ${r.duration}` : ''}`,
    },
    {
      key: 'cost',
      header: 'Per pupil',
      width: 110,
      align: 'right',
      render: (r) => (r.perPupilCost > 0 ? Fmt.moneyPlain(r.perPupilCost, r.currency) : '—'),
    },
  ];

  function openCreate() {
    setEditId(null);
    setFormOpen(true);
  }
  function openEdit(id) {
    setEditId(id);
    setFormOpen(true);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Activities"
        subtitle={`${activities.length} activit${activities.length === 1 ? 'y' : 'ies'} scheduled`}
        actions={
          frozen ? null : (
            <Button variant="primary" onClick={openCreate}>
              New activity
            </Button>
          )
        }
      />

      {frozen ? (
        <FrozenBanner
          reason={reason}
          allowance="Activities are read-only as a historical record of what ran."
        />
      ) : null}

      <Table
        columns={columns}
        rows={sorted}
        onRowClick={frozen ? undefined : (row) => openEdit(row.id)}
        empty={
          <EmptyState
            title="No activities yet"
            description={
              frozen
                ? 'No activities were recorded for this trip.'
                : "Add the first activity to start building this trip's day-by-day itinerary."
            }
            action={
              frozen ? null : (
                <Button variant="primary" onClick={openCreate}>
                  Add activity
                </Button>
              )
            }
          />
        }
      />

      <ActivityForm open={formOpen} onClose={() => setFormOpen(false)} activityId={editId} />
    </PageContainer>
  );
}
