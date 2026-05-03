import { useMemo } from 'react';
import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';
import { Fmt } from '../format';

function newActivity() {
  return {
    id: Fmt.uid('act'),
    tripId: null,
    day: 1,
    title: '',
    description: '',
    startTime: '',
    duration: '',
    type: 'included',
    perPupilCost: 0,
    currency: 'USD',
    capacity: null,
    bookedCount: 0,
    supplier: '',
    notes: '',
  };
}

export function useActivities(tripId = null) {
  const collection = useStoreCollection(StorageKeys.ACTIVITIES, newActivity);
  const filtered = useMemo(
    () => (tripId ? collection.data.filter((a) => a.tripId === tripId) : collection.data),
    [collection.data, tripId],
  );
  return { ...collection, data: filtered };
}
