import { useEffect, useState } from 'react';
import { Outlet, useParams, Navigate, Link } from 'react-router-dom';
import { TripBanner } from './TripBanner';
import { useActiveTripId } from '../../lib/hooks/useSettings';
import { useTrips } from '../../lib/hooks/useTrips';
import { TripForm } from './TripForm';
import styles from './TripDetailLayout.module.css';

const ARROW_LEFT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

/**
 * Per-trip shell. Owns the navy TripBanner (which includes the per-trip tab
 * strip) and renders the active per-trip route below it.
 *
 * URL is canonical: `/admin/trips/:tripId/<tab>` mirrors into
 * settings.activeTripId so legacy hooks keep working.
 */
export function TripDetailLayout() {
  const { tripId } = useParams();
  const { activeTripId, setActiveTripId } = useActiveTripId();
  const { data: trips, isLoading } = useTrips();

  const [tripFormOpen, setTripFormOpen] = useState(false);
  const [tripFormId, setTripFormId] = useState(null);

  const openNewTrip = () => {
    setTripFormId(null);
    setTripFormOpen(true);
  };
  const openEditTrip = (id) => {
    setTripFormId(id);
    setTripFormOpen(true);
  };

  useEffect(() => {
    if (tripId && tripId !== activeTripId) setActiveTripId(tripId);
  }, [tripId, activeTripId, setActiveTripId]);

  if (!isLoading && tripId && !trips.find((t) => t.id === tripId)) {
    return <Navigate to="/admin/trips" replace />;
  }

  const trip = trips.find((t) => t.id === tripId) || null;

  return (
    <>
      <div className={styles.bannerContainer}>
        <div className={styles.crumbs}>
          <Link to="/admin/trips" className={styles.backLink}>
            {ARROW_LEFT}
            <span>Back to all trips</span>
          </Link>
          <nav className={styles.crumbTrail} aria-label="Breadcrumb">
            <Link to="/admin/trips" className={styles.crumbLink}>
              Trips
            </Link>
            <span className={styles.crumbSep} aria-hidden>
              /
            </span>
            <span className={styles.crumbCurrent}>
              {trip ? `${trip.code} · ${trip.name}` : 'Loading…'}
            </span>
          </nav>
        </div>
        <TripBanner onEdit={openEditTrip} />
      </div>
      <Outlet context={{ openNewTrip, openEditTrip }} />
      <TripForm open={tripFormOpen} onClose={() => setTripFormOpen(false)} tripId={tripFormId} />
    </>
  );
}
