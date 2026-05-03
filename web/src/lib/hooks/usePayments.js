import { useMemo } from 'react';
import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';
import { Fmt } from '../format';

function newPayment() {
  return {
    id: Fmt.uid('pay'),
    tripId: null,
    pupilId: null,
    amount: 0,
    currency: 'USD',
    method: 'bank-transfer',
    reference: '',
    notes: '',
    paidAt: new Date().toISOString(),
    recordedBy: 'system',
  };
}

export function usePayments(tripId = null) {
  const collection = useStoreCollection(StorageKeys.PAYMENTS, newPayment);
  const filtered = useMemo(
    () => (tripId ? collection.data.filter((p) => p.tripId === tripId) : collection.data),
    [collection.data, tripId],
  );
  return { ...collection, data: filtered };
}
