/**
 * App Store 5.1.2(i) (rule clarified 13.11.2025): before personal data goes to a third-party AI, the app says which
 * provider gets it and asks for explicit permission. atlas sends the owner's question plus the business data the
 * answer needs (bookings, guest names, payments) to OpenAI (text assistant + help bot) and, in a voice
 * conversation, the owner's voice to ElevenLabs. Asked once per account on this device, inside the iOS app.
 * The web keeps its current flow; its privacy policy lists both providers.
 */
import { isNativeApp } from './native.js';

export const AI_CONSENT_VERSION = 1;
export const AI_PROVIDERS = ['OpenAI', 'ElevenLabs'];

const storageOf = (s) => (s !== undefined ? s : (typeof window !== 'undefined' ? window.localStorage : null));
export const aiConsentKey = (userId) => `atlas.aiConsent.v${AI_CONSENT_VERSION}:${userId || 'anon'}`;

export function hasAiConsent(userId, storage) {
  const st = storageOf(storage);
  if (!st) return false;
  try { return Boolean(st.getItem(aiConsentKey(userId))); } catch { return false; }
}

export function setAiConsent(userId, storage, now = new Date()) {
  const st = storageOf(storage);
  if (!st) return;
  try { st.setItem(aiConsentKey(userId), now.toISOString()); } catch { /* private mode: asked again next time */ }
}

export function clearAiConsent(userId, storage) {
  const st = storageOf(storage);
  try { st?.removeItem(aiConsentKey(userId)); } catch { /* ignore */ }
}

/** True when the consent sheet must show before anything is sent to OpenAI / ElevenLabs. */
export function needsAiConsent(userId, { native = isNativeApp(), storage } = {}) {
  return Boolean(native) && !hasAiConsent(userId, storage);
}
