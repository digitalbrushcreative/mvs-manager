import { useMemo } from 'react';
import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';
import { newTrip } from '../schema';

export function useTrips() {
  const collection = useStoreCollection(StorageKeys.TRIPS, newTrip);
  return collection;
}

export function useTrip(tripId) {
  const { data, ...rest } = useTrips();
  const trip = useMemo(() => data.find((t) => t.id === tripId) || null, [data, tripId]);
  return { trip, ...rest };
}
