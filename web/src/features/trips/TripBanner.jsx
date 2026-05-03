import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Badge } from '../../design-system';
import { Fmt } from '../../lib/format';
import { useTrips } from '../../lib/hooks/useTrips';
import { useTripStats } from '../../lib/hooks/useTripStats';
import { usePupils } from '../../lib/hooks/usePupils';
import { useActiveTripId } from '../../lib/hooks/useSettings';
import { isTripFrozen } from '../../lib/tripFreeze';
import styles from './TripBanner.module.css';

const STATUS_VARIANT = {
  draft: 'neutral',
  open: 'info',
  closed: 'warning',
  'in-progress': 'success',
  complete: 'neutral',
  cancelled: 'danger',
};

const EDIT_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export function TripBanner({ onEdit }) {
  const { data: trips } = useTrips();
  const { data: pupils } = usePupils();
  const { activeTripId } = useActiveTripId();
  const stats = useTripStats(activeTripId);

  if (!trips.length) return null;
  if (!activeTripId) return null;
  if (!stats) return null;

  const { trip } = stats;
  const countdown =
    stats.daysUntil != null
      ? stats.daysUntil > 0
        ? `T-${stats.daysUntil} days`
        : stats.daysUntil === 0
        ? 'Departing today'
        : `${Math.abs(stats.daysUntil)} days ago`
      : '';

  const rosterCount = pupils.filter((p) => p.tripId === activeTripId).length;
  const tripPath = (path) => `/admin/trips/${activeTripId}/${path}`;

  const tabs = [
    { to: tripPath('overview'), label: 'Overview' },
    { to: tripPath('roster'), label: 'Roster', count: rosterCount },
    { to: tripPath('itinerary'), label: 'Itinerary' },
    { to: tripPath('payments'), label: 'Payments' },
    { to: tripPath('documents'), label: 'Documents' },
    { to: tripPath('bookings'), label: 'Bookings' },
    { to: tripPath('activities'), label: 'Activities' },
    { to: tripPath('communications'), label: 'Messages' },
    { to: tripPath('interest'), label: 'Interest' },
    { to: tripPath('reports'), label: 'Reports' },
  ];

  return (
    <section className={styles.banner}>
      <div className={styles.body}>
        {onEdit && !isTripFrozen(trip).frozen ? (
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => onEdit(activeTripId)}
            title="Edit trip details"
          >
            {EDIT_ICON}
            <span>Edit trip</span>
          </button>
        ) : null}
        <div className={styles.heading}>
          <div className={styles.eyebrow}>
            <Badge variant={STATUS_VARIANT[trip.status] || 'neutral'}>{trip.status}</Badge>
            <Badge variant="neutral">{trip.tripType}</Badge>
            {isTripFrozen(trip).frozen ? <Badge variant="warning">🔒 Frozen</Badge> : null}
            <span className={styles.code}>{trip.code}</span>
            <span className={styles.sep}>·</span>
            <span>{countdown}</span>
          </div>

          <h1 className={styles.title}>{trip.name}</h1>

          <div className={styles.meta}>
            <span>
              <strong>{Fmt.date(trip.startDate)}</strong> → {Fmt.date(trip.endDate)}
            </span>
            <span>
              <strong>{trip.destination?.split('·')[0]?.trim() || '—'}</strong>
              {trip.destination?.includes('·')
                ? ` +${trip.destination.split('·').length - 1} stops`
                : ''}
            </span>
            <span>
              <strong>{stats.seatsUsed}</strong>/{stats.seatsTotal} seats · {stats.enrolled} pupils ·{' '}
              {stats.assignedStaffCount}/{stats.chaperones} chap · {stats.parentsJoining} parent
              {stats.parentsJoining === 1 ? '' : 's'}
              {stats.overCapacity ? ' · over!' : ''}
            </span>
            <span>
              <strong>{Fmt.moneyPlain(trip.costPerPupil, trip.currency)}</strong> / pupil
            </span>
          </div>
        </div>
      </div>

      <nav className={styles.tabs} aria-label="Trip sections">
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            className={({ isActive }) => clsx(styles.tab, isActive && styles.tabActive)}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined ? <span className={styles.count}>{tab.count}</span> : null}
          </NavLink>
        ))}
      </nav>
    </section>
  );
}
