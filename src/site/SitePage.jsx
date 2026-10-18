/**
 * Public site router: blog, legal and trust pages. The same component renders on the server
 * (scripts/prerender.mjs → static HTML) and in the SPA, so both outputs are identical.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_PAGES } from '@/site/pages';
import { getPost } from '@/site/content/posts';
import { useArticleBody, useSiteReady } from '@/site/shared';
import * as D from '@/site/design';

function ArticleRoute({ slug }) {
  const post = getPost(slug);
  const body = useArticleBody(slug);
  useSiteReady(!!(post && body));
  if (!post) return <D.NotFound />;
  if (!body) return <D.ArticleSkeleton post={post} />;
  return <D.Article post={post} body={body} />;
}

function StaticRoute({ path }) {
  useSiteReady(true);
  const page = SITE_PAGES[path];
  if (path === '/blog') return <D.BlogIndex />;
  if (!page) return <D.NotFound />;
  if (page.kind === 'contact') return <D.ContactPage path={path} page={page} />;
  if (page.kind === 'about') return <D.AboutPage path={path} page={page} />;
  return <D.LegalPage path={path} page={page} />;
}

export function SiteContent({ pathname }) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const m = path.match(/^\/blog\/([a-z0-9-]+)$/);
  return (
    <D.Shell>
      {m ? <ArticleRoute key={m[1]} slug={m[1]} /> : <StaticRoute path={path} />}
    </D.Shell>
  );
}

export default function SitePage() {
  const { pathname } = useLocation();
  return <SiteContent pathname={pathname} />;
}

export function SiteNotFound() {
  useSiteReady(true);
  return <D.Shell><D.NotFound /></D.Shell>;
}
