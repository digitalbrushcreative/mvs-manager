import { useStoreCollection } from '../store';
import { StorageKeys } from '../storageKeys';
import { Fmt } from '../format';

function newClubMember() {
  return {
    id: Fmt.uid('cmem'),
    clubId: null,
    pupilId: null,
    role: 'member',
    joinedAt: new Date().toISOString(),
  };
}

export function useClubMembers() {
  return useStoreCollection(StorageKeys.CLUB_MEMBERS, newClubMember);
}
