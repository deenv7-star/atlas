/** The install / notifications offer on /today, in the version this build ships (src/lib/pwa/variant.js). */
import React from 'react';
import { PWA_OFFER_VARIANT } from '@/lib/pwa/variant';
import InstallCardA from './InstallCardA';
import InstallSheetB from './InstallSheetB';

export default function PwaOffer({ user }) {
  return PWA_OFFER_VARIANT === 'b' ? <InstallSheetB user={user} /> : <InstallCardA user={user} />;
}
