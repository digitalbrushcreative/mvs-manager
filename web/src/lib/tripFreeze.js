/**
 * A trip is "frozen" once it has ended or been marked complete/cancelled.
 *
 * Frozen trips:
 *  - Can NOT enrol or edit pupils, attendance, itinerary, bookings — these
 *    are historical records. Mutations are blocked at the form layer.
 *  - CAN still receive payments — late collections are explicitly allowed
 *    so balances can be settled after the trip wraps up.
 *
 * Returns `{ frozen, reason }` so UIs can communicate the state.
 */
export function isTripFrozen(trip) {
  if (!trip) return { frozen: false, reason: null };
  if (trip.status === 'complete' || trip.status === 'cancelled') {
    return { frozen: true, reason: `Trip is ${trip.status}` };
  }
  if (trip.endDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(trip.endDate);
    end.setHours(0, 0, 0, 0);
    if (end < today && (trip.status === 'closed' || trip.status === 'in-progress')) {
      return { frozen: true, reason: 'Trip has ended' };
    }
  }
  return { frozen: false, reason: null };
}
