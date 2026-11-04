/**
 * ייבוא מתחם: saving the confirmed draft. No new columns; every write is one atlas already makes elsewhere:
 *   name                       → organizations.name (same as onboarding commitProfile)
 *   units                      → properties rows (name, type, max_guests, bedrooms, bathrooms, description, amenities,
 *                                 images, base_price, address); never deletes, only adds what's missing
 *   times / WhatsApp / photos  → orgSettings check_in_time / check_out_time / host_phone / cover_photo / photos
 *   everything else            → orgSettings.property_profile (what "שאלו את atlas" reads via get_property_info)
 *   setup journey              → orgSettings.setup.done.units (+ whatsapp)
 * Photos are copied to atlas storage first (property-import save_photos), so nothing points at Booking / Airbnb.
 * Steps run in order; each one is shown while it runs (a check appears because the write finished).
 */
import { base44 } from '@/api/base44Client';
import { isSupabaseConfigured } from '@/api/supabaseClient';
import { readOrgSettings, writeOrgSettings, setActiveOrg } from '@/lib/onboarding/orgSettings';
import { finishOnboarding } from '@/lib/onboarding/store';
import { phoneValid } from '@/lib/onboarding/v2/model';
import { keepPhotos } from './api';
import { toProfile, unitRows, unitsLabelHe, stillMissing } from './model';

async function listProperties() {
  try { const r = await base44.entities.Property.list({}, { limit: 200 }); return Array.isArray(r) ? r : []; } catch { return []; }
}

/** The save plan for a draft: [{ id, title, detail, run }]. `ctx` carries results between steps (stored photo URLs). */
export function savePlan(user, draft, { keep = null, skipped = [] } = {}) {
  const orgId = user?.organization_id;
  const ctx = { photos: [] };
  const wa = String(draft?.contact?.whatsapp || draft?.contact?.phone || '').trim();
  const photos = (keep || draft?.photos || []).slice(0, 30);
  const n = Number(draft?.unit_count) || 1;
  return [
    {
      id: 'profile', title: 'שומרים את פרטי המתחם', detail: draft?.business_name || '',
      run: async () => {
        setActiveOrg(orgId);
        const name = String(draft?.business_name || '').trim().slice(0, 50);
        if (orgId && name) {
          try { await base44.entities.Organization.update(orgId, { name }); } catch (e) {
            if (isSupabaseConfigured) throw e;
            await base44.entities.Organization.create({ id: orgId, name });
          }
        }
        if (!isSupabaseConfigured && name) await base44.auth.updateMe({ organization_name: name });
      },
    },
    ...(photos.length ? [{
      id: 'photos', title: 'מעתיקים את התמונות', detail: `${photos.length} תמונות`,
      run: async () => { ctx.photos = await keepPhotos(photos); },
    }] : []),
    {
      id: 'units', title: 'פותחים יומן לכל יחידה', detail: unitsLabelHe(draft?.property_type, n),
      run: async () => {
        const existing = await listProperties();
        const rows = unitRows(draft);
        for (let i = existing.length; i < rows.length; i += 1) {
          const row = { ...rows[i], images: rows.length === 1 ? ctx.photos.slice(0, 20) : [] };
          if (row.base_price == null) delete row.base_price;
          await base44.entities.Property.create(row);
        }
      },
    },
    {
      id: 'brain', title: 'מלמדים את atlas על המתחם', detail: 'כדי לענות לאורחים בשבילכם',
      run: async () => {
        const cur = readOrgSettings(orgId);
        const missing = stillMissing(draft, skipped);
        const patch = {
          property_profile: toProfile(draft, { photos: ctx.photos, missing }),
          complex_type: draft?.property_type || cur.complex_type || '',
          setup: {
            started_at: cur.setup?.started_at || new Date().toISOString(),
            done: { ...(cur.setup?.done || {}), units: true, ...(wa && phoneValid(wa) ? { whatsapp: true } : {}), import: true },
            skipped: { ...(cur.setup?.skipped || {}) },
          },
        };
        if (draft?.check_in_time) patch.check_in_time = draft.check_in_time;
        if (draft?.check_out_time) patch.check_out_time = draft.check_out_time;
        if (wa && phoneValid(wa)) patch.host_phone = wa.slice(0, 20);
        if (ctx.photos.length) { patch.photos = ctx.photos.slice(0, 30); if (!cur.cover_photo) patch.cover_photo = ctx.photos[0]; }
        if (draft?.location?.locality && !cur.settlement) patch.settlement = draft.location.locality;
        await writeOrgSettings(orgId, patch);
        if (user && user.onboarding_completed === false) await finishOnboarding(user);
      },
    },
  ];
}
