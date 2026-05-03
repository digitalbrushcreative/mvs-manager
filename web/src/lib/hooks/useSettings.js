import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Api } from '../api';
import { StorageKeys } from '../storageKeys';

export function useSettings() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['kv', StorageKeys.SETTINGS],
    queryFn: async () => {
      try {
        return (await Api.get(StorageKeys.SETTINGS)) || {};
      } catch (err) {
        if (err.status === 404) return {};
        throw err;
      }
    },
  });

  const mutation = useMutation({
    mutationFn: (patch) => {
      const next = { ...(qc.getQueryData(['kv', StorageKeys.SETTINGS]) || {}), ...patch };
      qc.setQueryData(['kv', StorageKeys.SETTINGS], next);
      return Api.put(StorageKeys.SETTINGS, next);
    },
  });

  return {
    settings: query.data || {},
    isLoading: query.isLoading,
    update: mutation.mutateAsync,
  };
}

export function useActiveTripId() {
  const { settings, update } = useSettings();
  // The URL param is canonical when on a trip-scoped route. This avoids a
  // first-paint flash where settings hasn't yet been rewritten by TripsLayout.
  const { tripId: paramTripId } = useParams();
  return {
    activeTripId: paramTripId || settings.activeTripId || null,
    setActiveTripId: (id) => update({ activeTripId: id }),
  };
}
