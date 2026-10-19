/**
 * SSR entry for scripts/prerender.mjs. Built with `vite build --ssr` and run in Node at build time.
 * Renders a public site route to static HTML (same components as the SPA).
 */
import React from 'react';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { SiteContent, SiteNotFound } from '@/site/SitePage';
import { primeBodies } from '@/site/shared';
import { siteMeta, siteRoutes, notFoundMeta, ATLAS_ONE_LINER, organizationLd, websiteLd, softwareLd, faqLd, graph, breadcrumbLd } from '@/site/seo';
import { POSTS } from '@/site/content/posts';
import { SITE_PAGES } from '@/site/pages';
import { mdToText } from '@/site/lib/md';
import { missingLegalKeys } from '@/config/legal';
import { FAQ } from '@/components/landing/v5/content';
import { PRICING_PLANS, INCLUDED_FEATURES, TRIAL_LINE, CANCEL_LINE } from '@/config/pricing';
import { RootTree } from '@/RootTree';
import LandingPage from '@/pages/Landing';
import PricingPlansPage from '@/pages/PricingPlans';
import { getRouteMeta } from '@/seo/routeMeta';
import { deferCss, DEFER_CLASS } from '@/lib/prerenderDefer';

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

/** /pricing JSON-LD: the product with one Offer per plan (monthly price, ILS), plus breadcrumbs. */
export function pricingLd() {
  const url = 'https://atlas-il.com/pricing';
  const app = softwareLd();
  return graph([
    organizationLd(),
    websiteLd(),
    {
      ...app,
      url,
      offers: PRICING_PLANS.map((p) => ({
        '@type': 'Offer',
        name: `${p.nameHe} (${p.name})`,
        description: `${p.limit}. ${p.desc}`,
        price: String(p.price),
        priceCurrency: 'ILS',
        url,
        priceSpecification: { '@type': 'UnitPriceSpecification', price: String(p.price), priceCurrency: 'ILS', unitText: 'MONTH', billingDuration: 'P1M' },
      })),
    },
    // Product with one Offer per plan: what Google's Rich Results test reads as a "Product snippet" (it does
    // not show SoftwareApplication offers without ratings). Same prices as the page.
    {
      '@type': 'Product',
      '@id': `${url}#product`,
      name: 'atlas',
      description: app.description,
      image: ['https://atlas-il.com/og/og-default.png'],
      brand: { '@type': 'Brand', name: 'atlas' },
      category: 'BusinessApplication',
      url,
      offers: PRICING_PLANS.map((p) => ({
        '@type': 'Offer',
        name: `${p.nameHe} (${p.name})`,
        price: String(p.price),
        priceCurrency: 'ILS',
        availability: 'https://schema.org/InStock',
        url,
        seller: { '@id': 'https://atlas-il.com/#organization' },
      })),
    },
    breadcrumbLd([{ name: 'atlas', path: '/' }, { name: 'תמחור ותוכניות', path: '/pricing' }]),
  ]);
}

/** Visually hidden text for /register and /login before the app boots (React replaces #root on its first render,
 *  so nothing changes on screen): readers without JS get real content instead of "טוען...". */
const SR_ONLY = { position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 };
export function appRouteBody(route) {
  const register = route === '/register';
  return renderToStaticMarkup(
    <main dir="rtl" lang="he" style={SR_ONLY}>
      <h1>{register ? 'הרשמה: 14 יום ניסיון חינם' : 'התחברות לחשבון'}</h1>
      <p>{ATLAS_ONE_LINER}</p>
      {register && <p>{TRIAL_LINE} {CANCEL_LINE}</p>}
      <h2>מה כלול</h2>
      <ul>{INCLUDED_FEATURES.map((f) => <li key={f}>{f}</li>)}</ul>
      <h2>מחירים</h2>
      <ul>{PRICING_PLANS.map((p) => <li key={p.key}>{`${p.nameHe} (${p.name}): ‏₪${p.price} לחודש, ${p.limit}`}</li>)}</ul>
      <nav aria-label="קישורים">
        <a href="/">דף הבית</a> · <a href="/pricing">תמחור</a> · {register ? <a href="/login">כבר יש לי חשבון: התחברות</a> : <a href="/register">הרשמה וניסיון חינם</a>}
      </nav>
    </main>,
  );
}

export { deferCss, DEFER_CLASS, siteMeta, getRouteMeta, siteRoutes, notFoundMeta, POSTS, SITE_PAGES, mdToText, missingLegalKeys, ATLAS_ONE_LINER, FAQ, PRICING_PLANS };
