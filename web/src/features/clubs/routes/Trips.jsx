import { useNavigate } from 'react-router-dom';
import { Badge, Card, EmptyState } from '../../../design-system';
import { PageContainer } from '../../../components/PageContainer/PageContainer';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useClubs } from '../../../lib/hooks/useClubs';
import { usePupils } from '../../../lib/hooks/usePupils';
import { useTrips } from '../../../lib/hooks/useTrips';
import { useActiveTripId } from '../../../lib/hooks/useSettings';
import { Fmt } from '../../../lib/format';
import styles from './Trips.module.css';

const STATUS_VARIANT = {
  draft: 'neutral',
  open: 'info',
  closed: 'warning',
  'in-progress': 'success',
  complete: 'neutral',
  cancelled: 'danger',
};

export function ClubsTripsPage() {
  const { data: clubs } = useClubs();
  const { data: trips } = useTrips();
  const { data: pupils } = usePupils();
  const { setActiveTripId } = useActiveTripId();
  const navigate = useNavigate();

  const withClubs = trips.filter((t) => (t.clubIds || []).length > 0);
  const withoutClubs = trips.filter((t) => !(t.clubIds || []).length);

  function openTrip(tripId) {
    setActiveTripId(tripId);
    navigate('/admin/trips');
  }

  return (
    <PageContainer>
      <PageHeader
        title="Linked trips"
        subtitle="Trips associated with one or more clubs. Click any to switch the active trip in Trip Manager."
      />

      <Section title="Linked" count={withClubs.length}>
        {!withClubs.length ? (
          <EmptyState
            title="No trips linked yet"
            description="In Trip Manager, use the Clubs field on the trip form to tag a trip with one or more clubs."
          />
        ) : (
          <div className={styles.grid}>
            {withClubs.map((t) => (
              <TripRow key={t.id} trip={t} clubs={clubs} pupils={pupils} onClick={() => openTrip(t.id)} />
            ))}
          </div>
        )}
      </Section>

      {withoutClubs.length ? (
        <Section title="Not linked" count={withoutClubs.length} muted>
          <div className={styles.grid}>
            {withoutClubs.map((t) => (
              <TripRow key={t.id} trip={t} clubs={clubs} pupils={pupils} onClick={() => openTrip(t.id)} />
            ))}
          </div>
        </Section>
      ) : null}
    </PageContainer>
  );
}

function Section({ title, count, muted, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 className={styles.sectionTitle}>
        {title}
        <span className={styles.tag}>{count}</span>
      </h3>
      {children}
    </div>
  );
}

function TripRow({ trip, clubs, pupils, onClick }) {
  const linkedClubs = (trip.clubIds || []).map((id) => clubs.find((c) => c.id === id)).filter(Boolean);
  const enrolled = pupils.filter((p) => p.tripId === trip.id).length;

  return (
    <Card padded onClick={onClick} className={styles.row}>
      <div className={styles.rowHead}>
        <Badge variant={STATUS_VARIANT[trip.status] || 'neutral'}>{trip.status}</Badge>
        <span className={styles.code}>{trip.code}</span>
      </div>
      <div className={styles.rowName}>{trip.name}</div>
      <div className={styles.clubs}>
        {linkedClubs.length ? (
          linkedClubs.map((c) => (
            <Badge key={c.id} colour={c.colour}>
              {c.emoji} {c.name}
            </Badge>
          ))
        ) : (
          <span className={styles.empty}>No clubs tagged</span>
        )}
      </div>
      <div className={styles.rowMeta}>
        {enrolled} pupils · {Fmt.date(trip.startDate)}
      </div>
    </Card>
  );
}
