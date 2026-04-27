#!/usr/bin/env node
/**
 * Smoke tests for Edge Function: atlas-toggle-automation
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_ANON_KEY=eyJ... \
 *   ATLAS_USER_JWT=eyJ... \          # access_token from signIn (owner = ADMIN)
 *   ATLAS_RULE_ID=uuid \            # automation_rules.id in that user's org
 *   ATLAS_STAFF_JWT=eyJ... \        # optional: user with only STAFF for 403 test
 *   node scripts/test-atlas-edge-toggle-automation.mjs
 *
 * Local:
 *   SUPABASE_URL=http://127.0.0.1:54321
 *   (same keys from `supabase status`)
 */

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const userJwt = process.env.ATLAS_USER_JWT;
const ruleId = process.env.ATLAS_RULE_ID;
const staffJwt = process.env.ATLAS_STAFF_JWT;

if (!url || !anon) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

const fnUrl = `${url.replace(/\/$/, "")}/functions/v1/atlas-toggle-automation`;

async function call(name, init) {
  const res = await fetch(fnUrl, init);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { _raw: text };
  }
  console.log(`\n--- ${name} ---`);
  console.log("HTTP", res.status, body);
  return { status: res.status, body };
}

function assert(name, cond) {
  if (!cond) {
    console.error(`FAIL: ${name}`);
    process.exit(1);
  }
  console.log(`OK: ${name}`);
}

async function main() {
  // 1) Missing auth → 401
  {
    const { status, body } = await call("missing auth", {
      method: "POST",
      headers: {
        apikey: anon,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rule_id: crypto.randomUUID(), is_active: true }),
    });
    assert("missing auth → 401", status === 401 && body.success === false);
  }

  // 2) Invalid input → 422 (valid JWT required so we don't short-circuit at 401)
  if (userJwt) {
    const { status, body } = await call("invalid body (bad uuid)", {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${userJwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rule_id: "not-a-uuid", is_active: true }),
    });
    assert("invalid uuid → 422", status === 422 && body.success === false);
  } else {
    console.log("\n(skip) ATLAS_USER_JWT not set — cannot run 422 / 200 / 403 JWT tests");
  }

  // 3) Wrong role → 403
  if (staffJwt) {
    const { status, body } = await call("wrong role (staff)", {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${staffJwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rule_id: ruleId || "00000000-0000-4000-8000-000000000001",
        is_active: false,
      }),
    });
    assert("staff → 403", status === 403 && body.success === false);
  } else {
    console.log("\n(skip) ATLAS_STAFF_JWT not set — cannot assert 403");
  }

  // 4) Valid input → 200
  if (userJwt && ruleId) {
    const { status, body } = await call("valid toggle", {
      method: "POST",
      headers: {
        apikey: anon,
        Authorization: `Bearer ${userJwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rule_id: ruleId, is_active: true }),
    });
    assert("valid → 200", status === 200 && body.success === true && body.data?.id === ruleId);
  } else {
    console.log("\n(skip) ATLAS_USER_JWT or ATLAS_RULE_ID not set — cannot assert 200");
  }

  console.log("\nAll executed checks passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
