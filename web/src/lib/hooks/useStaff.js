import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';
import { newStaff } from '../schema';

export function useStaff() {
  return useStoreCollection(StorageKeys.STAFF, newStaff);
}
