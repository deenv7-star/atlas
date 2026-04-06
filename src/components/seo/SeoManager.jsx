import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getRouteMeta } from '@/seo/routeMeta';
import { SITE_ORIGIN } from '@/seo/siteConfig';

function upsertMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, description, canonicalPath } = getRouteMeta(pathname);
    document.title = title;
    upsertMeta('name', 'description', description);
    const canonicalUrl =
      canonicalPath === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${canonicalPath}`;
    setCanonical(canonicalUrl);

    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);

    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
  }, [pathname]);

  return null;
}
