import { useCallback } from 'react';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';

/**
 * Hook to handle refreshing Convex data by re-fetching queries
 * Since Convex doesn't have built-in query invalidation, we use one-off queries
 * to trigger fresh data fetches
 */
export function useConvexRefresh() {
  const convex = useConvex();

  const refreshData = useCallback(async () => {
    try {
      // Trigger fresh fetches of the main queries used in the app
      // This will cause the reactive queries to update with fresh data
      
      // We'll use Promise.allSettled to ensure all queries are attempted
      // even if some fail
      const refreshPromises = [
        // Refresh active session
        convex.query(api.sessions.getActive),
        // Refresh sessions list
        convex.query(api.sessions.list),
      ];

      // Get active session first to determine if we need to refresh game data
      const activeSession = await convex.query(api.sessions.getActive);
      
      if (activeSession) {
        // If there's an active session, also refresh its games and totals
        refreshPromises.push(
          convex.query(api.games.listBySession, { sessionId: activeSession._id }),
          convex.query(api.games.getTotals, { sessionId: activeSession._id })
        );
      }

      // Execute all refresh queries
      await Promise.allSettled(refreshPromises);
      
      // The reactive useQuery hooks will automatically update with the fresh data
      // since Convex maintains consistency across all query subscriptions
      
    } catch (error) {
      console.error('Failed to refresh data:', error);
      throw error;
    }
  }, [convex]);

  return { refreshData };
}
