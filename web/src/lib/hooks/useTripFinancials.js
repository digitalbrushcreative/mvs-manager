import { useMemo } from 'react';
import { useTrips } from './useTrips';
import { usePupils } from './usePupils';
import { usePayments } from './usePayments';
import { useBookings } from './useBookings';

/**
 * Per-trip financial roll-up. Returns null when the trip can't be found.
 *
 *   expected  — pupils × costPerPupil (revenue we expect to collect)
 *   collected — sum of pupil payments
 *   cost      — sum of bookings.totalCost (what we owe suppliers)
 *   expenses  — sum of bookings.paidAmount (what we've paid suppliers)
 *   margin    — collected - expenses (cash left after paying suppliers)
 *   committed — expected - cost (projected margin if everything is collected & paid)
 */
export function useTripFinancials(tripId) {
  const { data: trips } = useTrips();
  const { data: pupils } = usePupils();
  const { data: payments } = usePayments();
  const { data: bookings } = useBookings();

  return useMemo(() => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return null;
    const tripPupils = pupils.filter((p) => p.tripId === tripId);
    const tripPayments = payments.filter((p) => p.tripId === tripId);
    const tripBookings = bookings.filter((b) => b.tripId === tripId);

    const expected = tripPupils.length * (trip.costPerPupil || 0);
    const collected = tripPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const cost = tripBookings.reduce((s, b) => s + Number(b.totalCost || 0), 0);
    const expenses = tripBookings.reduce((s, b) => s + Number(b.paidAmount || 0), 0);

    return {
      trip,
      currency: trip.currency || 'USD',
      expected,
      collected,
      outstandingRevenue: Math.max(0, expected - collected),
      revenuePct: expected ? collected / expected : 0,
      cost,
      expenses,
      payableToSuppliers: Math.max(0, cost - expenses),
      expensePct: cost ? expenses / cost : 0,
      margin: collected - expenses,
      committedMargin: expected - cost,
    };
  }, [trips, pupils, payments, bookings, tripId]);
}

/**
 * Aggregate financials across every trip. Same shape as `useTripFinancials`
 * but summed across the portfolio.
 */
export function usePortfolioFinancials() {
  const { data: trips } = useTrips();
  const { data: pupils } = usePupils();
  const { data: payments } = usePayments();
  const { data: bookings } = useBookings();

  return useMemo(() => {
    const expected = trips.reduce((s, t) => {
      const tripPupils = pupils.filter((p) => p.tripId === t.id).length;
      return s + tripPupils * (t.costPerPupil || 0);
    }, 0);
    const collected = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const cost = bookings.reduce((s, b) => s + Number(b.totalCost || 0), 0);
    const expenses = bookings.reduce((s, b) => s + Number(b.paidAmount || 0), 0);
    return {
      expected,
      collected,
      cost,
      expenses,
      outstandingRevenue: Math.max(0, expected - collected),
      payableToSuppliers: Math.max(0, cost - expenses),
      revenuePct: expected ? collected / expected : 0,
      margin: collected - expenses,
      committedMargin: expected - cost,
    };
  }, [trips, pupils, payments, bookings]);
}
