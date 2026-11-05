import { QueryClient } from '@tanstack/react-query';
import { STALE_REFERENCE_MS } from '@/lib/queryStaleTimes';
import { restoreQueryCache, startQueryPersist } from '@/lib/queryPersist';

/**
 * Default staleTime favors reference-style data. Pages that load live booking
 * traffic should pass staleTime: STALE_LIVE_MS (see queryStaleTimes.js).
 */
export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			// A timed-out request is not retried silently; the shell shows a retry state instead.
			retry: (count, err) => !err?.isTimeout && count < 1,
			staleTime: STALE_REFERENCE_MS,
		},
		// Audit 05.11 NET-2: react-query pauses mutations while offline, so a save sat on "שומרים…" forever.
		// Run them anyway: the API layer fails at once offline (src/lib/offline.js) and the form shows why.
		mutations: {
			networkMode: 'always',
		},
	},
});

// Show the signed-in owner's last data at once, then refresh it (stale-while-revalidate across reloads).
restoreQueryCache(queryClientInstance);
startQueryPersist(queryClientInstance);
