import { Badge, Card, EmptyState, Table } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { useTripBuckets } from '../../../lib/hooks/useTripBuckets';
import { useTripNavigation } from '../../../lib/hooks/useTripNavigation';
import { Fmt } from '../../../lib/format';
import styles from './Dashboard.module.css';

/**
 * Past Trips — read-only history. A trip lands here once it is complete or
 * cancelled AND all expected revenue has been collected.
 */
export function PastTripsPage() {
  const { past } = useTripBuckets();
  const switchTrip = useTripNavigation();

  if (!past.length) {
    return (
      <PageContainer>
        <EmptyState
          title="No past trips yet"
          description="Closed trips with all expected payments collected will appear here."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <header className={styles.sectionHead}>
        <div>
          <span className={styles.eyebrow}>History</span>
          <h2 className={styles.sectionTitle}>Past Trips</h2>
          <p className={styles.sectionSub}>
            Closed and reconciled trips. Read-only — open a trip to review its records.
          </p>
        </div>
      </header>

      <Card padded={false}>
        <Table
          columns={[
            {
              key: 'trip',
              header: 'Trip',
              sortable: true,
              sortAccessor: (r) => r.trip.startDate,
              render: (r) => (
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: 'var(--navy-darker)' }}>{r.trip.name}</span>
                    <Badge variant="neutral">{r.trip.status}</Badge>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--grey-500)', marginTop: 2 }}>
                    {r.trip.code} · {Fmt.date(r.trip.startDate)} → {Fmt.date(r.trip.endDate)} · {r.pupils} pupils
                  </div>
                </div>
              ),
            },
            {
              key: 'collected',
              header: 'Collected',
              width: 140,
              align: 'right',
              sortable: true,
              sortAccessor: (r) => r.collected,
              render: (r) => Fmt.moneyPlain(r.collected, r.trip.currency || 'USD'),
            },
          ]}
          rows={past}
          onRowClick={(row) => switchTrip(row.trip.id)}
        />
      </Card>
    </PageContainer>
  );
}
