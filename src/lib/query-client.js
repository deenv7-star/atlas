import { QueryClient } from '@tanstack/react-query';
import { STALE_REFERENCE_MS } from '@/lib/queryStaleTimes';

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
	},
});