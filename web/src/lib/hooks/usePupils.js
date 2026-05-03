import { useMemo } from 'react';
import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';
import { newPupil } from '../schema';

export function usePupils(tripId = null) {
  const collection = useStoreCollection(StorageKeys.PUPILS, newPupil);
  const filtered = useMemo(
    () => (tripId ? collection.data.filter((p) => p.tripId === tripId) : collection.data),
    [collection.data, tripId],
  );
  return { ...collection, data: filtered };
}
