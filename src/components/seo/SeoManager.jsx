import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteMeta } from '@/seo/routeMeta';
import { SITE_ORIGIN } from '@/seo/siteConfig';

const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og/og-default.png`;
const SITE_ROUTE = /^\/(blog(\/[a-z0-9-]+)?|about|contact|privacy|terms|cookies|cancellation|data-processing|data-security|accessibility)\/?$/;

function upsertMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!value) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function upsertLink(selector, attrs) {
  let el = document.querySelector(selector);
  if (!attrs) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('link');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
}

function setRouteJsonLd(data) {
  let el = document.getElementById('ld-route');
  if (!data) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = 'ld-route';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function apply({ title, description, canonical, ogImage, ogType, robots, jsonLd }) {
  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('name', 'robots', robots || 'index,follow');
  upsertLink('link[rel="canonical"]', canonical ? { rel: 'canonical', href: canonical } : null);
  upsertLink('link[rel="alternate"][hreflang="he-IL"]', canonical ? { rel: 'alternate', hreflang: 'he-IL', href: canonical } : null);
  upsertLink('link[rel="alternate"][hreflang="x-default"]', canonical ? { rel: 'alternate', hreflang: 'x-default', href: canonical } : null);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonical || `${SITE_ORIGIN}/`);
  upsertMeta('property', 'og:type', ogType || 'website');
  upsertMeta('property', 'og:image', ogImage || DEFAULT_OG_IMAGE);
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', ogImage || DEFAULT_OG_IMAGE);
  setRouteJsonLd(jsonLd);
}

export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    let alive = true;
    // Landing-only structured data (FAQPage etc.) must not describe other pages.
    const landingLd = document.getElementById('ld-landing');
    if (landingLd && pathname !== '/') landingLd.remove();

    if (SITE_ROUTE.test(pathname)) {
      // Blog / legal / trust pages: the same head the prerendered HTML has (src/site/seo.js).
      import('@/site/seo').then(({ siteMeta, notFoundMeta }) => {
        if (alive) apply(siteMeta(pathname) || notFoundMeta());
      });
      return () => { alive = false; };
    }

    const { title, description, canonicalPath, notFound } = getRouteMeta(pathname);
    const canonicalUrl = canonicalPath === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${canonicalPath}`;
    apply({
      title,
      description,
      canonical: notFound ? null : canonicalUrl,
      robots: notFound ? 'noindex, follow' : undefined,
      jsonLd: null,
    });
    return () => { alive = false; };
  }, [pathname]);

  return null;
}
