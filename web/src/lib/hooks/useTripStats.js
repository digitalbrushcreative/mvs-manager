import { useMemo } from 'react';
import { useTrips } from './useTrips';
import { usePupils } from './usePupils';
import { Fmt } from '../format';

/**
 * Computed stats for a single trip. Mirrors the legacy Store.tripStats() shape.
 */
export function useTripStats(tripId) {
  const { data: trips } = useTrips();
  const { data: allPupils } = usePupils();

  return useMemo(() => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return null;
    const pupils = allPupils.filter((p) => p.tripId === tripId);
    const chaperones = trip.chaperones || 0;
    const parentsJoining = trip.parentsJoining || 0;
    const assignedStaffCount = (trip.assignedStaffIds || []).length;
    const seatsUsed = pupils.length + chaperones + parentsJoining;
    const seatsTotal = trip.seatsTotal || 0;

    return {
      trip,
      enrolled: pupils.length,
      chaperones,
      assignedStaffCount,
      parentsJoining,
      seatsUsed,
      seatsTotal,
      seatsLeft: Math.max(0, seatsTotal - seatsUsed),
      overCapacity: seatsUsed > seatsTotal,
      daysUntil: Fmt.daysUntil(trip.startDate),
      flaggedCount: pupils.filter((p) => p.flagged).length,
    };
  }, [trips, allPupils, tripId]);
}
