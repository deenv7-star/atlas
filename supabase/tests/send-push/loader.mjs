// Node module hooks: map Deno's "npm:@supabase/supabase-js@x" import to the in-memory mock below.
export async function resolve(spec, ctx, next) {
  if (spec.startsWith('npm:@supabase/supabase-js')) return { url: new URL('./mock-supabase.mjs', import.meta.url).href, shortCircuit: true };
  return next(spec, ctx);
}
