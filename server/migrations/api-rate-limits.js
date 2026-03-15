export async function up(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.api_rate_limits (
      key_hash TEXT PRIMARY KEY,
      window_start TIMESTAMPTZ NOT NULL,
      count INTEGER NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function down(client) {
  await client.query('DROP TABLE IF EXISTS public.api_rate_limits');
}
