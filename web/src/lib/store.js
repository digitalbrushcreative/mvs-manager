/**
 * React Query hooks over the kv-store. Each persisted collection is a JSON
 * blob under a single key — we cache the whole blob and provide CRUD helpers
 * that patch it with optimistic updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Api } from './api';
import { Fmt } from './format';

function useCollection(key, fallback = []) {
  return useQuery({
    queryKey: ['kv', key],
    queryFn: async () => {
      try {
        return await Api.get(key);
      } catch (err) {
        if (err.status === 404) return fallback;
        throw err;
      }
    },
  });
}

function useCollectionMutation(key) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updater) => {
      const current = qc.getQueryData(['kv', key]) ?? [];
      const next = typeof updater === 'function' ? updater(current) : updater;
      qc.setQueryData(['kv', key], next);
      return Api.put(key, next);
    },
    onError: (_err, _vars, _ctx) => {
      qc.invalidateQueries({ queryKey: ['kv', key] });
    },
  });
}

/**
 * Composite hook returning data + CRUD mutations for a single kv-store
 * collection. Mutations are optimistic: cache is updated immediately, then
 * persisted to the backend.
 */
export function useStoreCollection(key, factory) {
  const query = useCollection(key);
  const mutate = useCollectionMutation(key);

  const create = async (data) => {
    const item = { ...(factory ? factory() : {}), ...data, id: data.id || Fmt.uid('item') };
    await mutate.mutateAsync((list) => [...(list || []), item]);
    return item;
  };

  const update = async (id, patch) => {
    let updated = null;
    await mutate.mutateAsync((list) =>
      (list || []).map((item) => {
        if (item.id !== id) return item;
        updated = { ...item, ...patch };
        return updated;
      }),
    );
    return updated;
  };

  const remove = async (id) => {
    await mutate.mutateAsync((list) => (list || []).filter((item) => item.id !== id));
  };

  const replace = async (next) => {
    await mutate.mutateAsync(next);
  };

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create,
    update,
    remove,
    replace,
  };
}
