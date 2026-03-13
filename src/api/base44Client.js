// Re-export the standalone client so that all existing imports continue to work.
// This file previously bootstrapped the @base44/sdk — it now delegates to
// the self-contained local client that stores data in localStorage.

import { createClient } from './client';

export const base44 = createClient();
