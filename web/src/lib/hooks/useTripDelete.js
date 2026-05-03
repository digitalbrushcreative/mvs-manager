import { useTrips } from './useTrips';
import { usePupils } from './usePupils';
import { usePayments } from './usePayments';
import { useDocuments } from './useDocuments';
import { useBookings } from './useBookings';
import { useActivities } from './useActivities';
import { useCommunications } from './useCommunications';

/**
 * Cascading trip delete. Removes the trip plus everything scoped to it.
 * Mirrors legacy Store.deleteTrip().
 */
export function useTripDelete() {
  const { remove: removeTrip } = useTrips();
  const pupils = usePupils();
  const payments = usePayments();
  const documents = useDocuments();
  const bookings = useBookings();
  const activities = useActivities();
  const communications = useCommunications();

  return async function deleteTrip(tripId) {
    await Promise.all([
      pupils.replace(pupils.data.filter((p) => p.tripId !== tripId)),
      payments.replace(payments.data.filter((p) => p.tripId !== tripId)),
      documents.replace(documents.data.filter((d) => d.tripId !== tripId)),
      bookings.replace(bookings.data.filter((b) => b.tripId !== tripId)),
      activities.replace(activities.data.filter((a) => a.tripId !== tripId)),
      communications.replace(communications.data.filter((c) => c.tripId !== tripId)),
    ]);
    await removeTrip(tripId);
  };
}
