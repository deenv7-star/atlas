/**
 * SEO + structured data for the public site. Used by:
 *  - scripts/prerender.mjs (static HTML <head> for every public route)
 *  - SeoManager (same values in the SPA after client navigation)
 *  - scripts/vite-seo-plugin.mjs (landing JSON-LD in index.html)
 * One source, so the static HTML and the SPA never disagree.
 */
import { SITE_ORIGIN } from '@/seo/siteConfig';
import { LEGAL, legalValue, WHATSAPP_URL } from '@/config/legal';
import { PRICING_PLANS } from '@/config/pricing';
import { POSTS, getPost } from '@/site/content/posts';
import { SITE_PAGES } from '@/site/pages';

export const ORG_ID = `${SITE_ORIGIN}/#organization`;
export const SITE_ID = `${SITE_ORIGIN}/#website`;
export const APP_ID = `${SITE_ORIGIN}/#software`;
export const DEFAULT_OG = `${SITE_ORIGIN}/og/og-default.png`;

export const ATLAS_ONE_LINER =
  'ATLAS היא מערכת ניהול בעברית לצימרים, וילות ומתחמי נופש בישראל: לוח שנה אחד לכל היחידות והערוצים (Booking.com, Airbnb והזמנות ישירות), לידים, מעקב מקדמות ויתרות, הודעות וואטסאפ לאורחים בנוסח מוכן, משימות ניקיון ודוח הכנסות חודשי. עובדת מהדפדפן במחשב ובטלפון, עם 14 ימי ניסיון בחינם.';

export function abs(path) {
  if (!path) return SITE_ORIGIN + '/';
  if (/^https?:/.test(path)) return path;
  return SITE_ORIGIN + (path === '/' ? '/' : path);
}

export function organizationLd() {
  const org = {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'ATLAS',
    url: `${SITE_ORIGIN}/`,
    logo: `${SITE_ORIGIN}/icons/icon-512x512.png`,
    description: ATLAS_ONE_LINER,
    areaServed: { '@type': 'Country', name: 'Israel' },
    knowsLanguage: ['he'],
    founder: { '@type': 'Person', name: LEGAL.FOUNDER_NAME_EN, alternateName: LEGAL.FOUNDER_NAME },
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: `+${LEGAL.WHATSAPP_NUMBER_INTL}`,
      url: WHATSAPP_URL,
      availableLanguage: ['he'],
    }],
  };
  if (legalValue('BUSINESS_NAME')) org.legalName = LEGAL.BUSINESS_NAME;
  if (legalValue('SUPPORT_EMAIL')) org.email = LEGAL.SUPPORT_EMAIL;
  return org;
}

export function websiteLd() {
  return { '@type': 'WebSite', '@id': SITE_ID, url: `${SITE_ORIGIN}/`, name: 'ATLAS', inLanguage: 'he-IL', publisher: { '@id': ORG_ID } };
}

export function softwareLd() {
  const prices = PRICING_PLANS.map((p) => p.price).filter(Boolean);
  return {
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: 'ATLAS',
    alternateName: 'ATLAS מערכת ניהול לצימרים ומתחמי נופש',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: `${SITE_ORIGIN}/`,
    inLanguage: 'he-IL',
    description: ATLAS_ONE_LINER,
    publisher: { '@id': ORG_ID },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'ILS',
      lowPrice: String(Math.min(...prices)),
      highPrice: String(Math.max(...prices)),
      offerCount: String(prices.length),
      url: `${SITE_ORIGIN}/pricing`,
    },
  };
}

export function faqLd(items, url) {
  return {
    '@type': 'FAQPage',
    ...(url ? { '@id': `${url}#faq` } : {}),
    mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function breadcrumbLd(crumbs) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
  };
}

export function graph(nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

/** Crumbs for a site path. */
export function crumbsFor(pathname) {
  const home = { name: 'ATLAS', path: '/' };
  if (pathname === '/blog') return [home, { name: 'בלוג', path: '/blog' }];
  if (pathname.startsWith('/blog/')) {
    const post = getPost(pathname.split('/')[2]);
    return [home, { name: 'בלוג', path: '/blog' }, { name: post ? post.title : 'מאמר', path: pathname }];
  }
  const page = SITE_PAGES[pathname];
  return [home, { name: page ? page.title : 'עמוד', path: pathname }];
}

/**
 * Full head data for a public site route, or null when the path is not a site page.
 * { title, description, canonical, ogImage, ogType, robots, jsonLd, article? }
 */
export function siteMeta(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/blog') {
    const url = abs('/blog');
    return {
      title: 'בלוג ATLAS: מדריכים לבעלי צימרים ומתחמי נופש',
      description: 'מדריכים מעשיים לבעלי צימרים: סנכרון Booking.com ו-Airbnb, תמחור לפי עונות וחגים, הודעות לאורחים, מע"מ וחשבוניות, ניקיון, ביקורות ורישוי.',
      canonical: url,
      ogImage: `${SITE_ORIGIN}/og/og-blog.png`,
      ogType: 'website',
      jsonLd: graph([
        organizationLd(),
        websiteLd(),
        {
          '@type': 'Blog',
          '@id': `${url}#blog`,
          url,
          name: 'בלוג ATLAS',
          inLanguage: 'he-IL',
          publisher: { '@id': ORG_ID },
          blogPost: POSTS.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: abs(`/blog/${p.slug}`), datePublished: p.published, dateModified: p.updated })),
        },
        breadcrumbLd(crumbsFor('/blog')),
      ]),
    };
  }
  if (path.startsWith('/blog/')) {
    const post = getPost(path.split('/')[2]);
    if (!post) return null;
    const url = abs(`/blog/${post.slug}`);
    const image = `${SITE_ORIGIN}/og/blog-${post.slug}.png`;
    return {
      title: post.seoTitle,
      description: post.description,
      canonical: url,
      ogImage: image,
      ogType: 'article',
      article: { published: post.published, modified: post.updated, section: post.category },
      jsonLd: graph([
        organizationLd(),
        websiteLd(),
        {
          '@type': 'Article',
          '@id': `${url}#article`,
          headline: post.title,
          description: post.description,
          image: [image],
          datePublished: post.published,
          dateModified: post.updated,
          inLanguage: 'he-IL',
          articleSection: post.category,
          keywords: post.keywords.join(', '),
          author: { '@id': ORG_ID },
          publisher: { '@id': ORG_ID },
          mainEntityOfPage: { '@type': 'WebPage', '@id': url },
          isPartOf: { '@id': `${abs('/blog')}#blog` },
          citation: post.sources.map((s) => s.url),
        },
        faqLd(post.faq, url),
        breadcrumbLd(crumbsFor(path)),
      ]),
    };
  }
  const page = SITE_PAGES[path];
  if (!page) return null;
  const url = abs(path);
  const typeByKind = { about: 'AboutPage', contact: 'ContactPage' };
  const nodes = [
    organizationLd(),
    websiteLd(),
    {
      '@type': typeByKind[page.kind] || 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: 'he-IL',
      isPartOf: { '@id': SITE_ID },
      about: { '@id': ORG_ID },
      ...(page.updated ? { dateModified: page.updated } : {}),
    },
    breadcrumbLd(crumbsFor(path)),
  ];
  if (page.kind === 'about') nodes.push(softwareLd());
  if (page.faq) nodes.push(faqLd(page.faq, url));
  return {
    title: page.seoTitle,
    description: page.description,
    canonical: url,
    ogImage: `${SITE_ORIGIN}/og/${page.og || 'og-default'}.png`,
    ogType: 'website',
    jsonLd: graph(nodes),
  };
}

export function notFoundMeta() {
  return {
    title: 'הדף לא נמצא | ATLAS',
    description: 'הדף שחיפשתם לא קיים. אפשר לחזור לדף הבית, לבלוג או ליצירת קשר.',
    canonical: null,
    ogImage: DEFAULT_OG,
    ogType: 'website',
    robots: 'noindex, follow',
    jsonLd: null,
  };
}

/** Every public route that gets a prerendered HTML file and a sitemap entry. */
export function siteRoutes() {
  return [
    ...Object.keys(SITE_PAGES),
    '/blog',
    ...POSTS.map((p) => `/blog/${p.slug}`),
  ];
}
