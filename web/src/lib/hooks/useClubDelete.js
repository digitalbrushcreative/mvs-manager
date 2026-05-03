import { useClubs } from './useClubs';
import { useClubMembers } from './useClubMembers';
import { useTrips } from './useTrips';

export function useClubDelete() {
  const { remove: removeClub } = useClubs();
  const members = useClubMembers();
  const trips = useTrips();

  return async function deleteClub(clubId) {
    await Promise.all([
      members.replace(members.data.filter((m) => m.clubId !== clubId)),
      trips.replace(
        trips.data.map((t) =>
          (t.clubIds || []).includes(clubId) ? { ...t, clubIds: t.clubIds.filter((id) => id !== clubId) } : t,
        ),
      ),
    ]);
    await removeClub(clubId);
  };
}
