import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  KpiTile,
  PageSpinner,
  Table,
} from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { useTrips } from '../../../lib/hooks/useTrips';
import { usePortfolioFinancials } from '../../../lib/hooks/useTripFinancials';
import { useTripBuckets } from '../../../lib/hooks/useTripBuckets';
import { useTripNavigation } from '../../../lib/hooks/useTripNavigation';
import { isTripFrozen } from '../../../lib/tripFreeze';
import { Fmt } from '../../../lib/format';
import styles from './Dashboard.module.css';

function SeatBar({ row }) {
  const enrolled = row.pupils;
  const chap = row.trip.chaperones || 0;
  const par = row.trip.parentsJoining || 0;
  const total = row.trip.seatsTotal || 0;
  const used = enrolled + chap + par;
  const denom = total || used || 1;
  const pct = (v) => `${Math.min(100, (v / denom) * 100)}%`;
  const over = used > total;
  const almost = !over && total > 0 && used / total >= 0.9;
  return (
    <div className={styles.seatBar}>
      <div className={styles.seatBarTrack}>
        <span style={{ width: pct(enrolled), background: 'var(--navy)' }} />
        <span style={{ width: pct(chap), background: 'var(--gold)' }} />
        <span style={{ width: pct(par), background: 'var(--info)' }} />
      </div>
      <div className={styles.seatBarMeta}>
        <strong style={{ color: over ? 'var(--crimson)' : almost ? 'var(--warning)' : 'var(--navy-darker)' }}>
          {used}/{total}
        </strong>
        <span> · {enrolled}p · {chap}c · {par}f</span>
      </div>
    </div>
  );
}

/**
 * Trips → Overview tab. Portfolio-level KPIs and seat utilisation across
 * every trip. Per-trip focus content lives on /admin/trips/:tripId/overview.
 */
export function TripsDashboardPage() {
  const { openNewTrip } = useOutletContext() || {};
  const { data: trips, isLoading: loadingTrips } = useTrips();
  const portfolio = usePortfolioFinancials();
  const buckets = useTripBuckets();
  const switchTrip = useTripNavigation();

  const frozenCount = useMemo(
    () => trips.filter((t) => isTripFrozen(t).frozen).length,
    [trips],
  );

  if (loadingTrips) return <PageSpinner />;

  if (!trips.length) {
    return (
      <PageContainer>
        <EmptyState
          title="No trips yet"
          description="Create your first trip to start enrolling pupils, scheduling activities, and tracking payments."
          action={
            <Button variant="primary" onClick={openNewTrip}>
              Create first trip
            </Button>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <header className={styles.sectionHead}>
        <div>
          <span className={styles.eyebrow}>Across all trips</span>
          <h2 className={styles.sectionTitle}>Portfolio overview</h2>
          <p className={styles.sectionSub}>
            Aggregate stats and seat utilisation. Open Active Trips or Past Trips to drill into a specific trip.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={openNewTrip}>
          + New trip
        </Button>
      </header>

      <div className={styles.kpis}>
        <KpiTile
          label="Trips in system"
          value={trips.length}
          hint={`${buckets.active.length} active · ${buckets.past.length} past · ${frozenCount} frozen`}
          accent="var(--navy)"
        />
        <KpiTile
          label="Expected revenue"
          value={Fmt.moneyPlain(portfolio.expected, 'USD')}
          hint="Pupils × cost across all trips"
          accent="var(--info)"
        />
        <KpiTile
          label="Collected"
          value={Fmt.moneyPlain(portfolio.collected, 'USD')}
          hint={`${Fmt.percent(portfolio.revenuePct)} of expected · ${Fmt.moneyPlain(portfolio.outstandingRevenue, 'USD')} outstanding`}
          accent="var(--success)"
        />
        <KpiTile
          label="Net margin"
          value={Fmt.moneyPlain(portfolio.margin, 'USD')}
          hint={`Collected − expenses · ${Fmt.moneyPlain(portfolio.expenses, 'USD')} paid out`}
          accent={portfolio.margin >= 0 ? 'var(--success)' : 'var(--crimson)'}
        />
      </div>

      <Card padded={false} style={{ marginTop: 14 }}>
        <div style={{ padding: '16px 20px 0' }}>
          <CardHeader
            title="Active Trips"
            subtitle="Trips that are upcoming, in-progress, or still have outstanding cash. Click a row to open."
          />
        </div>
        <Table
          columns={[
            {
              key: 'trip',
              header: 'Trip',
              sortable: true,
              sortAccessor: (r) => r.trip.code,
              render: (r) => (
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--navy-darker)' }}>{r.trip.name}</span>
                    {isTripFrozen(r.trip).frozen ? <Badge variant="warning">Frozen</Badge> : null}
                    <Badge variant={r.trip.status === 'in-progress' ? 'success' : 'info'}>
                      {r.trip.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--grey-500)', marginTop: 2 }}>
                    {r.trip.code} · {Fmt.date(r.trip.startDate)} · {r.pupils} pupils
                  </div>
                </div>
              ),
            },
            {
              key: 'seats',
              header: 'Seats',
              width: 200,
              sortable: true,
              sortAccessor: (r) => (r.trip.seatsTotal || 0) - (r.pupils + (r.trip.chaperones || 0) + (r.trip.parentsJoining || 0)),
              render: (r) => <SeatBar row={r} />,
            },
            {
              key: 'expected',
              header: 'Expected',
              width: 120,
              align: 'right',
              sortable: true,
              sortAccessor: (r) => r.expected,
              render: (r) => Fmt.moneyPlain(r.expected, r.trip.currency || 'USD'),
            },
            {
              key: 'collected',
              header: 'Collected',
              width: 120,
              align: 'right',
              sortable: true,
              sortAccessor: (r) => r.collected,
              render: (r) => Fmt.moneyPlain(r.collected, r.trip.currency || 'USD'),
            },
            {
              key: 'outstanding',
              header: 'Outstanding',
              width: 130,
              align: 'right',
              sortable: true,
              sortAccessor: (r) => r.outstanding,
              render: (r) => (
                <strong style={{ color: r.outstanding > 0 ? 'var(--crimson)' : 'var(--success)' }}>
                  {Fmt.moneyPlain(r.outstanding, r.trip.currency || 'USD')}
                </strong>
              ),
            },
          ]}
          rows={buckets.active}
          onRowClick={(row) => switchTrip(row.trip.id)}
        />
      </Card>
    </PageContainer>
  );
}
