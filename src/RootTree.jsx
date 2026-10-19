import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import SeoManager from '@/components/seo/SeoManager';
import ScrollToTop from '@/lib/ScrollToTop';

/**
 * The route tree under the Router (see src/Root.jsx). Shared by the browser (lazy pages, src/Root.jsx) and the
 * prerender (the same pages imported directly, src/site/entry-server.jsx), so the static HTML of "/" and
 * /pricing hydrates against exactly the tree that produced it. Keep both callers passing the same shape.
 */
export const LEAN_PATHS = ['/', '/pricing'];
const AUTH_IN_URL = /(^|[#&?])(access_token|refresh_token|error|error_code|code|token_hash|type)=/;

/** True when this URL is served by a lean page (and so may hydrate the prerendered HTML). */
export function isLeanUrl(loc) {
  const path = loc.pathname.replace(/\/+$/, '') || '/';
  return LEAN_PATHS.includes(path) && !AUTH_IN_URL.test(`${loc.hash || ''}${loc.search || ''}`);
}

export function PublicFallback() {
  return <div className="min-h-[100dvh]" style={{ background: '#F7F8FB' }} />;
}

/** The full app's GlobalErrorBoundary UI, loaded only if a lean page ever throws while rendering. */
const LazyGlobalErrorBoundary = lazy(() => import('@/components/common/GlobalErrorBoundary'));
function Rethrow({ error }) { throw error; }
class LeanErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Suspense fallback={null}>
        <LazyGlobalErrorBoundary><Rethrow error={this.state.error} /></LazyGlobalErrorBoundary>
      </Suspense>
    );
  }
}

/**
 * The route tree shared by the browser (lazy pages) and the prerender (the same pages, imported directly).
 * Keep the two identical: the prerendered HTML is hydrated against it.
 */
export function RootTree({ lean, pages, full }) {
  const page = (P) => (
    <LeanErrorBoundary>
      <Suspense fallback={<PublicFallback />}><P /></Suspense>
    </LeanErrorBoundary>
  );
  return (
    <>
      <ScrollToTop />
      <SeoManager />
      <Routes>
        {lean && <Route path="/" element={page(pages.Landing)} />}
        {lean && <Route path="/pricing" element={page(pages.Pricing)} />}
        <Route path="*" element={full} />
      </Routes>
    </>
  );
}
