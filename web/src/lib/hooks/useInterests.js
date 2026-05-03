import { useMemo } from 'react';
import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';

export function useInterests(tripId = null) {
  const collection = useStoreCollection(StorageKeys.INTERESTS);
  const filtered = useMemo(
    () => (tripId ? collection.data.filter((i) => i.tripId === tripId) : collection.data),
    [collection.data, tripId],
  );
  return { ...collection, data: filtered };
}
