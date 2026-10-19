/**
 * SSR entry for scripts/prerender.mjs. Built with `vite build --ssr` and run in Node at build time.
 * Renders a public site route to static HTML (same components as the SPA).
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { SiteContent, SiteNotFound } from '@/site/SitePage';
import { primeBodies } from '@/site/shared';
import { siteMeta, siteRoutes, notFoundMeta, ATLAS_ONE_LINER, organizationLd, websiteLd, softwareLd, faqLd, graph } from '@/site/seo';
import { POSTS } from '@/site/content/posts';
import { SITE_PAGES } from '@/site/pages';
import { mdToText } from '@/site/lib/md';
import { missingLegalKeys } from '@/config/legal';
import { FAQ } from '@/components/landing/v5/content';
import { PRICING_PLANS } from '@/config/pricing';
import { RootTree } from '@/RootTree';
import LandingPage from '@/pages/Landing';
import PricingPlansPage from '@/pages/PricingPlans';
import { getRouteMeta } from '@/seo/routeMeta';

const eager = import.meta.glob('./content/blog/*.md', { query: '?raw', import: 'default', eager: true });
export const BODIES = Object.fromEntries(Object.entries(eager).map(([k, v]) => [k.replace('./content/blog/', '').replace('.md', ''), v]));
primeBodies(BODIES);

export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <SiteContent pathname={url} />
    </StaticRouter>,
  );
}

export function render404() {
  return renderToString(
    <StaticRouter location="/404">
      <SiteNotFound />
    </StaticRouter>,
  );
}

/**
 * "/" and /pricing (the lean pages, src/RootTree.jsx): the exact tree the browser hydrates (main.jsx), with
 * the pages imported directly instead of lazily. The Suspense boundaries render their content, not fallbacks.
 */
export function renderLean(url) {
  return renderToString(
    <StaticRouter location={url}>
      <RootTree lean pages={{ Landing: LandingPage, Pricing: PricingPlansPage }} full={null} />
    </StaticRouter>,
  );
}

/** Head fields of an app route (the same ones SeoManager sets in the browser). */
export function appRouteMeta(pathname) {
  return getRouteMeta(pathname);
}

/** Landing JSON-LD. FAQPage mirrors every question the landing actually shows (<Faq /> renders all of FAQ). */
export function landingLd() {
  return graph([organizationLd(), websiteLd(), softwareLd(), faqLd(FAQ, 'https://atlas-il.com/')]);
}

export { siteMeta, getRouteMeta, siteRoutes, notFoundMeta, POSTS, SITE_PAGES, mdToText, missingLegalKeys, ATLAS_ONE_LINER, FAQ, PRICING_PLANS };
