import { useMemo } from 'react';
import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';
import { Fmt } from '../format';

function newCommunication() {
  return {
    id: Fmt.uid('msg'),
    tripId: null,
    type: 'email',
    subject: '',
    body: '',
    recipientIds: [],
    recipientCount: 0,
    sentAt: new Date().toISOString(),
    sentBy: 'staff',
  };
}

export function useCommunications(tripId = null) {
  const collection = useStoreCollection(StorageKeys.COMMUNICATIONS, newCommunication);
  const filtered = useMemo(
    () => (tripId ? collection.data.filter((c) => c.tripId === tripId) : collection.data),
    [collection.data, tripId],
  );
  return { ...collection, data: filtered };
}
