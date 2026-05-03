import { useMemo, useState } from 'react';
import { Badge, Button, Card, Chip, EmptyState, KpiTile, Table } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { BookingForm } from '../BookingForm';
import { FrozenBanner } from '../../../components/FrozenBanner/FrozenBanner';
import { useBookings } from '../../../lib/hooks/useBookings';
import { useTrips } from '../../../lib/hooks/useTrips';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { isTripFrozen } from '../../../lib/tripFreeze';
import { Fmt } from '../../../lib/format';
import styles from './Bookings.module.css';

const STATUS_VARIANT = {
  quoted: 'neutral',
  pending: 'warning',
  confirmed: 'success',
  cancelled: 'danger',
};

const TYPE_LABELS = {
  flight: '✈️ Flight',
  hotel: '🏨 Hotel',
  activity: '🎟 Activity',
  transfer: '🚐 Transfer',
  insurance: '🛡 Insurance',
};

export function TripsBookingsPage() {
  const { activeTripId } = useActiveTripId();
  const { data: bookings } = useBookings(activeTripId);
  const { data: trips } = useTrips();

  const trip = trips.find((t) => t.id === activeTripId);
  const { frozen, reason } = isTripFrozen(trip);

  const [filter, setFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const counts = useMemo(() => {
    const out = { all: bookings.length };
    ['quoted', 'pending', 'confirmed', 'cancelled'].forEach((s) => {
      out[s] = bookings.filter((b) => b.status === s).length;
    });
    return out;
  }, [bookings]);

  const totals = useMemo(
    () => ({
      total: bookings.reduce((s, b) => s + Number(b.totalCost || 0), 0),
      paid: bookings.reduce((s, b) => s + Number(b.paidAmount || 0), 0),
    }),
    [bookings],
  );

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  const columns = [
    { key: 'type', header: 'Type', width: 130, render: (r) => TYPE_LABELS[r.type] || r.type },
    { key: 'title', header: 'Title', render: (r) => (
      <div>
        <div style={{ fontWeight: 600 }}>{r.title}</div>
        {r.supplier ? <div style={{ fontSize: 11, color: 'var(--grey-500)', marginTop: 2 }}>{r.supplier}</div> : null}
      </div>
    ) },
    { key: 'date', header: 'Date', width: 110, render: (r) => Fmt.date(r.date) },
    { key: 'status', header: 'Status', width: 110, render: (r) => <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge> },
    { key: 'pax', header: 'Pax', width: 70, align: 'right' },
    { key: 'cost', header: 'Total', width: 120, align: 'right', render: (r) => Fmt.moneyPlain(r.totalCost, r.currency) },
    { key: 'paid', header: 'Paid', width: 120, align: 'right', render: (r) => Fmt.moneyPlain(r.paidAmount, r.currency) },
  ];

  function openCreate() {
    setEditId(null);
    setFormOpen(true);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Bookings"
        subtitle={`${bookings.length} booking${bookings.length === 1 ? '' : 's'} · ${counts.confirmed} confirmed`}
        actions={
          frozen ? null : (
            <Button variant="primary" onClick={openCreate}>
              New booking
            </Button>
          )
        }
      />

      {frozen ? (
        <FrozenBanner
          reason={reason}
          allowance="Bookings are read-only as a historical record of what was actually booked and paid."
        />
      ) : null}

      <div className={styles.kpis}>
        <KpiTile label="Total cost" value={Fmt.moneyPlain(totals.total, trip?.currency)} accent="var(--navy)" />
        <KpiTile label="Paid out" value={Fmt.moneyPlain(totals.paid, trip?.currency)} accent="var(--success)" />
        <KpiTile label="Outstanding" value={Fmt.moneyPlain(Math.max(0, totals.total - totals.paid), trip?.currency)} accent="var(--crimson)" />
        <KpiTile label="Confirmed" value={counts.confirmed} hint={`of ${bookings.length} total`} accent="var(--info)" />
      </div>

      <Card padded style={{ marginBottom: 14 }}>
        <div className={styles.filters}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all}>
            All
          </Chip>
          {['confirmed', 'pending', 'quoted', 'cancelled'].map((s) =>
            counts[s] ? (
              <Chip key={s} active={filter === s} onClick={() => setFilter(s)} count={counts[s]}>
                {s}
              </Chip>
            ) : null,
          )}
        </div>
      </Card>

      <Table
        columns={columns}
        rows={filtered}
        onRowClick={
          frozen
            ? undefined
            : (row) => {
                setEditId(row.id);
                setFormOpen(true);
              }
        }
        empty={
          <EmptyState
            title="No bookings yet"
            description={
              frozen
                ? 'No bookings were recorded for this trip.'
                : 'Add the first booking to track flights, hotels, transfers, activities, and insurance for this trip.'
            }
            action={
              frozen ? null : (
                <Button variant="primary" onClick={openCreate}>
                  Add booking
                </Button>
              )
            }
          />
        }
      />

      <BookingForm open={formOpen} onClose={() => setFormOpen(false)} bookingId={editId} />
    </PageContainer>
  );
}
