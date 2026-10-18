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

/** Landing JSON-LD. FAQPage mirrors the 5 questions the landing actually shows (<Faq limit={5} />). */
export function landingLd() {
  return graph([organizationLd(), websiteLd(), softwareLd(), faqLd(FAQ.slice(0, 5), 'https://atlas-il.com/')]);
}

export { siteMeta, siteRoutes, notFoundMeta, POSTS, SITE_PAGES, mdToText, missingLegalKeys, ATLAS_ONE_LINER, FAQ, PRICING_PLANS };
