import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TripScopeNav } from '../../components/TripScopeNav/TripScopeNav';
import { useTripBuckets } from '../../lib/hooks/useTripBuckets';
import { TripForm } from './TripForm';

/**
 * Portfolio shell for the Trip Manager. Renders the three-tab portfolio
 * sub-nav (Overview · Active Trips · Past Trips) and owns the trip-form modal
 * for the list-level "+ New trip" action.
 *
 * Per-trip routes (`/admin/trips/:tripId/...`) use TripDetailLayout instead.
 */
export function TripsLayout() {
  const { active, past } = useTripBuckets();

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

  return (
    <>
      <TripScopeNav
        onNewTrip={openNewTrip}
        counts={{ active: active.length, past: past.length }}
      />
      <Outlet context={{ openNewTrip, openEditTrip }} />
      <TripForm open={tripFormOpen} onClose={() => setTripFormOpen(false)} tripId={tripFormId} />
    </>
  );
}
