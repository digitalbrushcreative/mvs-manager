import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';
import { newClub } from '../schema';

export function useClubs() {
  return useStoreCollection(StorageKeys.CLUBS, newClub);
}
