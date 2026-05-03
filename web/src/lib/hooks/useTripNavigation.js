import { useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useActiveTripId } from './useSettings';

/**
 * Single source of truth for switching the active trip.
 *
 * The URL is canonical for trip-scoped routes (`/admin/trips/:tripId/...`),
 * while `settings.activeTripId` records "last viewed" so navigating from the
 * portfolio dashboard to a per-trip tab lands on the most recent trip.
 *
 * Calling `switchActiveTrip(newId)`:
 *   - persists `newId` to settings, AND
 *   - if currently on a `/admin/trips/:tripId/...` route, swaps the tripId
 *     segment so the same tab opens for the new trip.
 */
export function useTripNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId: paramTripId } = useParams();
  const { setActiveTripId } = useActiveTripId();

  return useCallback(
    (newTripId) => {
      if (!newTripId) return;
      setActiveTripId(newTripId);
      if (paramTripId) {
        if (newTripId !== paramTripId) {
          const newPath = location.pathname.replace(/\/trips\/[^/]+/, `/trips/${newTripId}`);
          navigate(newPath);
        }
      } else {
        navigate(`/admin/trips/${newTripId}/overview`);
      }
    },
    [navigate, location.pathname, paramTripId, setActiveTripId],
  );
}
