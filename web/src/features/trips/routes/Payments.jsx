import { useMemo, useState } from 'react';
import { Badge, Button, Card, CardHeader, EmptyState, KpiTile, Table } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { PaymentForm } from '../PaymentForm';
import { ChaseParentModal } from '../ChaseParentModal';
import { usePayments } from '../../../lib/hooks/usePayments';
import { usePupils } from '../../../lib/hooks/usePupils';
import { useTrips } from '../../../lib/hooks/useTrips';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { Fmt } from '../../../lib/format';
import styles from './Payments.module.css';

export function TripsPaymentsPage() {
  const { activeTripId } = useActiveTripId();
  const { data: trips } = useTrips();
  const { data: pupils } = usePupils(activeTripId);
  const { data: payments } = usePayments(activeTripId);

  const trip = trips.find((t) => t.id === activeTripId);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [chaseTarget, setChaseTarget] = useState(null);

  const totals = useMemo(() => {
    const expected = pupils.length * (trip?.costPerPupil || 0);
    const collected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { expected, collected, outstanding: Math.max(0, expected - collected) };
  }, [pupils, payments, trip]);

  const balanceByPupil = useMemo(() => {
    const map = new Map();
    pupils.forEach((p) => {
      const paid = payments
        .filter((pm) => pm.pupilId === p.id)
        .reduce((sum, pm) => sum + Number(pm.amount || 0), 0);
      map.set(p.id, { paid, balance: (trip?.costPerPupil || 0) - paid });
    });
    return map;
  }, [pupils, payments, trip]);

  const rows = pupils
    .slice()
    .sort((a, b) => (balanceByPupil.get(b.id)?.balance || 0) - (balanceByPupil.get(a.id)?.balance || 0))
    .map((p) => {
      const bal = balanceByPupil.get(p.id);
      return {
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        grade: p.grade,
        guardian: p.guardianName,
        status: p.paymentStatus,
        paid: bal?.paid || 0,
        balance: bal?.balance || 0,
      };
    });

  const lastPaymentByPupil = useMemo(() => {
    const map = new Map();
    payments.forEach((pm) => {
      const prev = map.get(pm.pupilId);
      const t = pm.paidAt || pm.createdAt;
      if (!prev || (t && t > prev)) map.set(pm.pupilId, t);
    });
    return map;
  }, [payments]);

  const naughtyList = useMemo(() => {
    return pupils
      .map((p) => {
        const bal = balanceByPupil.get(p.id);
        return {
          pupilId: p.id,
          pupilName: `${p.firstName} ${p.lastName}`,
          grade: p.grade,
          guardianName: p.guardianName,
          guardianEmail: p.guardianEmail,
          guardianPhone: p.guardianPhone,
          status: p.paymentStatus,
          balance: bal?.balance || 0,
          paid: bal?.paid || 0,
          tripName: trip?.name || '',
          currency: trip?.currency || 'USD',
          lastPaymentAt: lastPaymentByPupil.get(p.id) || null,
        };
      })
      .filter((r) => r.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [pupils, balanceByPupil, lastPaymentByPupil, trip]);

  const columns = [
    { key: 'name', header: 'Pupil', render: (r) => (
      <div>
        <div style={{ fontWeight: 600 }}>{r.name}</div>
        <div style={{ fontSize: 11, color: 'var(--grey-500)', marginTop: 2 }}>Grade {r.grade}</div>
      </div>
    ) },
    { key: 'guardian', header: 'Guardian' },
    { key: 'status', header: 'Status', width: 110, render: (r) => <Badge variant={STATUS_VARIANT[r.status] || 'neutral'}>{r.status}</Badge> },
    { key: 'paid', header: 'Paid', width: 110, align: 'right', render: (r) => Fmt.moneyPlain(r.paid, trip?.currency) },
    { key: 'balance', header: 'Balance', width: 120, align: 'right', render: (r) => (
      <span style={{ color: r.balance > 0 ? 'var(--crimson)' : 'var(--success)', fontWeight: 600 }}>
        {Fmt.moneyPlain(r.balance, trip?.currency)}
      </span>
    ) },
  ];

  function openCreate() {
    setEditId(null);
    setFormOpen(true);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Payments"
        subtitle={trip ? `${payments.length} payment record${payments.length === 1 ? '' : 's'} · ${pupils.length} pupil${pupils.length === 1 ? '' : 's'}` : 'No active trip'}
        actions={
          <Button variant="primary" onClick={openCreate} disabled={!pupils.length}>
            Record payment
          </Button>
        }
      />

      <div className={styles.kpis}>
        <KpiTile label="Expected" value={Fmt.moneyPlain(totals.expected, trip?.currency)} hint="Total pupils × cost" accent="var(--navy)" />
        <KpiTile label="Collected" value={Fmt.moneyPlain(totals.collected, trip?.currency)} hint={`${Fmt.percent(totals.expected ? totals.collected / totals.expected : 0)} of expected`} accent="var(--success)" />
        <KpiTile label="Outstanding" value={Fmt.moneyPlain(totals.outstanding, trip?.currency)} hint="Still to collect" accent="var(--crimson)" />
        <KpiTile label="Records" value={payments.length} hint="Payment entries" accent="var(--info)" />
      </div>

      {naughtyList.length ? (
        <Card padded style={{ marginBottom: 14 }}>
          <CardHeader
            title="🎯 Top 5 to chase"
            subtitle="Largest outstanding balances on this trip — click Chase to send a reminder."
          />
          <ol className={styles.naughty}>
            {naughtyList.map((r, idx) => (
              <li key={r.pupilId} className={styles.naughtyRow}>
                <span className={styles.naughtyRank}>#{idx + 1}</span>
                <div className={styles.naughtyWho}>
                  <div className={styles.naughtyName}>
                    {r.guardianName || '(no guardian on file)'}
                  </div>
                  <div className={styles.naughtySub}>
                    {r.pupilName} · Grade {r.grade}
                    {r.lastPaymentAt
                      ? ` · last paid ${Fmt.date(r.lastPaymentAt)}`
                      : ' · no payments yet'}
                  </div>
                </div>
                <div className={styles.naughtyAmount}>
                  {Fmt.moneyPlain(r.balance, r.currency)}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setChaseTarget(r)}
                  disabled={!r.guardianEmail && !r.guardianPhone}
                  title={
                    !r.guardianEmail && !r.guardianPhone
                      ? 'No contact details on file'
                      : 'Send a reminder'
                  }
                >
                  Chase
                </Button>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <Card padded={false}>
        <Table
          columns={columns}
          rows={rows}
          empty={<EmptyState title="No pupils enrolled" description="Add pupils to the roster to start tracking their payments." />}
        />
      </Card>

      <PaymentForm open={formOpen} onClose={() => setFormOpen(false)} paymentId={editId} />
      <ChaseParentModal
        open={Boolean(chaseTarget)}
        onClose={() => setChaseTarget(null)}
        target={chaseTarget}
      />
    </PageContainer>
  );
}

const STATUS_VARIANT = {
  paid: 'success',
  deposit: 'info',
  pending: 'warning',
  overdue: 'danger',
  cancelled: 'neutral',
};
