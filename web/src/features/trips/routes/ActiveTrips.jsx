import { useOutletContext } from 'react-router-dom';
import { Badge, Button, Card, CardHeader, EmptyState, Table } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { useTripBuckets } from '../../../lib/hooks/useTripBuckets';
import { useTripNavigation } from '../../../lib/hooks/useTripNavigation';
import { isTripFrozen } from '../../../lib/tripFreeze';
import { Fmt } from '../../../lib/format';
import styles from './Dashboard.module.css';

/**
 * Active Trips — anything still requiring attention. A trip is "active" if:
 *   - status is not complete/cancelled, OR
 *   - cash is not yet reconciled (collected < expected)
 */
export function ActiveTripsPage() {
  const { openNewTrip } = useOutletContext() || {};
  const { active } = useTripBuckets();
  const switchTrip = useTripNavigation();

  if (!active.length) {
    return (
      <PageContainer>
        <EmptyState
          title="No active trips"
          description="Every trip is closed and reconciled. Create a new trip to get started."
          action={
            <Button variant="primary" onClick={openNewTrip}>
              + New trip
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
          <span className={styles.eyebrow}>In progress</span>
          <h2 className={styles.sectionTitle}>Active Trips</h2>
          <p className={styles.sectionSub}>
            Trips that are upcoming, in-progress, or closed with outstanding cash to collect.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={openNewTrip}>
          + New trip
        </Button>
      </header>

      <Card padded={false}>
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
          rows={active}
          onRowClick={(row) => switchTrip(row.trip.id)}
        />
      </Card>
    </PageContainer>
  );
}
