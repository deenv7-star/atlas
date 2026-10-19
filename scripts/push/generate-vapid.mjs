// Prints a new VAPID key pair for Web Push. Run once per environment, by hand:
//   npm run push:vapid
// Then (see qa/pwa/setup.md in the project):
//   Vercel env           VITE_VAPID_PUBLIC_KEY = <publicKey>          (public, shipped in the app bundle)
//   Supabase secrets     VAPID_PUBLIC_KEY = <publicKey>, VAPID_PRIVATE_KEY = <privateKey>, VAPID_SUBJECT = mailto:support@atlas-il.com
// The private key is a secret: never commit it, never put it in a VITE_ variable. Rotating it invalidates every
// existing device subscription (owners tap "הפעל התראות" again).
import { generateVapidKeys } from '../../supabase/functions/_shared/webpush.js';

const k = await generateVapidKeys();
console.log(JSON.stringify({ publicKey: k.publicKey, privateKey: k.privateKey, subject: 'mailto:support@atlas-il.com' }, null, 2));
