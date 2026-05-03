import { useMemo } from 'react';
import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';
import { Fmt } from '../format';

function newBooking() {
  return {
    id: Fmt.uid('bk'),
    tripId: null,
    type: 'activity',
    status: 'quoted',
    supplier: '',
    reference: '',
    title: '',
    description: '',
    date: null,
    time: '',
    pax: 0,
    unitPrice: 0,
    totalCost: 0,
    currency: 'USD',
    paidAmount: 0,
    paidAt: null,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
    createdAt: new Date().toISOString(),
  };
}

export function useBookings(tripId = null) {
  const collection = useStoreCollection(StorageKeys.BOOKINGS, newBooking);
  const filtered = useMemo(
    () => (tripId ? collection.data.filter((b) => b.tripId === tripId) : collection.data),
    [collection.data, tripId],
  );
  return { ...collection, data: filtered };
}
