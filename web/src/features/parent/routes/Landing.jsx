import { Link } from 'react-router-dom';
import { Badge, Card, EmptyState } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useTrips } from '../../../lib/hooks/useTrips';
import { Fmt } from '../../../lib/format';
import styles from './Landing.module.css';

const STATUS_VARIANT = {
  draft: 'neutral',
  open: 'info',
  closed: 'warning',
  'in-progress': 'success',
  complete: 'neutral',
  cancelled: 'danger',
};

export function ParentLandingPage() {
  const { data: trips } = useTrips();
  const upcoming = trips
    .filter((t) => t.status === 'open' || t.status === 'draft' || t.status === 'in-progress')
    .sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0));

  return (
    <PageContainer>
      <PageHeader
        title="Upcoming trips"
        subtitle="Browse trips your child can join. Sign in to view your children, balances, and documents."
      />

      {!upcoming.length ? (
        <EmptyState title="No trips open right now" description="Check back later — new trips are added each term." />
      ) : (
        <div className={styles.list}>
          {upcoming.map((trip) => (
            <Card key={trip.id} className={styles.row} padded>
              <div className={styles.rowMain}>
                <div className={styles.head}>
                  <Badge variant={STATUS_VARIANT[trip.status]}>{trip.status}</Badge>
                  <span className={styles.code}>{trip.code}</span>
                </div>
                <h3 className={styles.title}>{trip.name}</h3>
                <div className={styles.dest}>{trip.destination}</div>
                {trip.description ? <p className={styles.desc}>{trip.description}</p> : null}
              </div>

              <dl className={styles.meta}>
                <div>
                  <dt>Dates</dt>
                  <dd>
                    {Fmt.date(trip.startDate)} → {Fmt.date(trip.endDate)}
                  </dd>
                </div>
                <div>
                  <dt>Cost per pupil</dt>
                  <dd>{Fmt.moneyPlain(trip.costPerPupil, trip.currency)}</dd>
                </div>
                <div>
                  <dt>Grades</dt>
                  <dd>{trip.gradesAllowed?.join(', ') || '—'}</dd>
                </div>
              </dl>

              <Link to={`/parent/trip/${trip.id}`} className={styles.cta}>
                Express interest →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
