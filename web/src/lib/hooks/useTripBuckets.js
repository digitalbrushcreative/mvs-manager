import { useMemo } from 'react';
import { useTrips } from './useTrips';
import { usePupils } from './usePupils';
import { usePayments } from './usePayments';

/**
 * Split trips into Active vs Past.
 *
 *   Active — status is not 'complete' or 'cancelled', OR collected < expected
 *            (cash reconciliation still outstanding).
 *   Past   — everything else: complete/cancelled trips with all expected
 *            revenue collected.
 *
 * Each row is augmented with derived numbers used by the list pages
 * (pupils, expected, collected, outstanding, frozen).
 */
export function useTripBuckets() {
  const { data: trips } = useTrips();
  const { data: pupils } = usePupils();
  const { data: payments } = usePayments();

  return useMemo(() => {
    const rows = trips.map((t) => {
      const tripPupils = pupils.filter((p) => p.tripId === t.id).length;
      const collected = payments
        .filter((p) => p.tripId === t.id)
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      const expected = tripPupils * (t.costPerPupil || 0);
      const outstanding = Math.max(0, expected - collected);
      const reconciled = expected > 0 ? collected >= expected : true;
      const closedStatus = t.status === 'complete' || t.status === 'cancelled';
      const isPast = closedStatus && reconciled;
      return {
        trip: t,
        pupils: tripPupils,
        expected,
        collected,
        outstanding,
        reconciled,
        isPast,
      };
    });

    return {
      active: rows.filter((r) => !r.isPast),
      past: rows.filter((r) => r.isPast),
      all: rows,
    };
  }, [trips, pupils, payments]);
}
