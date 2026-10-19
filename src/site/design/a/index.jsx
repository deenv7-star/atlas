/**
 * Site design A, "Editorial": white page, a calm reading column, a sticky table of contents,
 * hairline rules, indigo only for links and the one primary action. Benchmarks: Stripe / Linear docs.
 */
import { isoDateTime } from '../../isoDate';
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, CalendarDays } from 'lucide-react';
import { LEGAL, BUSINESS_LINE } from '@/config/legal';
import { POSTS } from '@/site/content/posts';
import { FOOTER_GROUPS } from '@/site/pages';
import { ATLAS_ONE_LINER, crumbsFor } from '@/site/seo';
import { Markdown, Inline, parseMd, tocFromBlocks, nbHyphen } from '@/site/lib/md';
import {
  SkipLink, Wordmark, Breadcrumbs, Toc, LegalBody, FaqList, Sources, ContactForm, ContactDetails,
  CONTACT_TOPICS, WhatsAppButton, heDate, readingMinutes, articleBlocks, relatedPosts,
} from '@/site/shared';
import '@/site/site-base.css';
import './site-a.css';

export const DESIGN = 'a';

function Header() {
  return (
    <header className="a-hdr">
      <div className="a-wrap a-hdr-in">
        <Link to="/" className="a-logo" aria-label="atlas, לדף הבית"><Wordmark /></Link>
        <nav className="a-nav" aria-label="ניווט ראשי">
          <Link to="/blog" className="a-hide-xs">בלוג</Link>
          <Link to="/pricing">מחירים</Link>
          <Link to="/about" className="a-hide-sm">אודות</Link>
          <Link to="/login" className="a-hide-sm">כניסה</Link>
        </nav>
        <Link to="/register" className="s-btn s-btn-primary a-hdr-cta">14 ימי ניסיון</Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="a-ftr">
      <div className="a-wrap">
        <div className="a-ftr-top">
          <div className="a-ftr-brand">
            <Wordmark />
            <p>{ATLAS_ONE_LINER}</p>
            <WhatsAppButton className="a-ftr-wa">וואטסאפ <span dir="ltr">{LEGAL.WHATSAPP_DISPLAY}</span></WhatsAppButton>
          </div>
          {FOOTER_GROUPS.map((g) => (
            <nav key={g.title} className="a-ftr-col" aria-label={g.title}>
              <p className="a-ftr-h">{g.title}</p>
              <ul>{g.links.map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
        <p className="a-ftr-copy">© 2026 atlas · נבנה בישראל{BUSINESS_LINE ? ` · מופעל על ידי ${BUSINESS_LINE}` : ''}</p>
      </div>
    </footer>
  );
}

export function Shell({ children }) {
  return (
    <div className="s-root a-root" dir="rtl" lang="he">
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  );
}

function PageHead({ path, title, lede, updated }) {
  return (
    <div className="a-head">
      <Breadcrumbs items={crumbsFor(path)} />
      <h1>{nbHyphen(title)}</h1>
      {lede && <p className="a-lede">{nbHyphen(lede)}</p>}
      {updated && <p className="a-meta">עודכן לאחרונה: <time dateTime={isoDateTime(updated)}>{heDate(updated)}</time></p>}
    </div>
  );
}

function Summary({ text }) {
  if (!text) return null;
  return <div className="a-summary"><p><Inline text={text} /></p></div>;
}

function splitSummary(md) {
  const blocks = parseMd(md);
  if (blocks[0] && blocks[0].type === 'callout') return { summary: blocks[0].text, rest: md.replace(/^>.*(\n>.*)*\n?/, '') };
  return { summary: null, rest: md };
}

export function LegalPage({ path, page }) {
  const { summary, rest } = splitSummary(page.md);
  const toc = tocFromBlocks(parseMd(rest));
  return (
    <div className="a-wrap a-doc">
      <PageHead path={path} title={page.title} lede={page.lede} updated={page.updated} />
      <div className="a-cols">
        <article className="a-main">
          <Summary text={summary} />
          <div className="s-prose"><LegalBody md={rest} /></div>
        </article>
        <aside className="a-side"><Toc items={toc} /></aside>
      </div>
    </div>
  );
}

export function AboutPage({ path, page }) {
  return (
    <div className="a-wrap a-doc">
      <PageHead path={path} title={page.title} lede={page.lede} />
      <div className="a-cols">
        <article className="a-main"><div className="s-prose"><LegalBody md={page.md} /></div></article>
        <aside className="a-side"><Toc items={tocFromBlocks(parseMd(page.md))} /></aside>
      </div>
    </div>
  );
}

export function ContactPage({ path, page }) {
  return (
    <div className="a-wrap a-doc">
      <PageHead path={path} title={page.title} lede={page.lede} />
      <div className="a-contact">
        <section className="a-card" aria-labelledby="c-wa">
          <h2 id="c-wa">וואטסאפ</h2>
          <p>הדרך הכי מהירה: שאלות לפני הרשמה, עזרה בשימוש, ביטול או כל דבר אחר.</p>
          <WhatsAppButton className="s-btn s-btn-primary">פתיחת שיחה בוואטסאפ</WhatsAppButton>
          <h3 className="a-card-sub">כל הדרכים</h3>
          <ContactDetails />
        </section>
        <section className="a-card" aria-labelledby="c-form">
          <h2 id="c-form">כתבו לנו</h2>
          <ContactForm />
        </section>
      </div>
      <section className="a-topics" aria-labelledby="c-topics">
        <h2 id="c-topics">פניות בנושאים מיוחדים</h2>
        <ul>
          {CONTACT_TOPICS.map((t) => (
            <li key={t.title}><strong>{t.title}.</strong> {t.text}<Link to={t.link.to}>{t.link.label}</Link>.</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PostRow({ post, featured = false }) {
  return (
    <li className={`a-row${featured ? ' is-featured' : ''}`}>
      <Link to={`/blog/${post.slug}`} className="a-row-link">
        {featured && <img src={`/blog/covers/${post.slug}.webp`} alt="" width="1200" height="675" className="a-row-img" loading="eager" decoding="async" />}
        <span className="a-row-cat">{post.category}</span>
        <span className="a-row-title">{nbHyphen(post.title)}</span>
        <span className="a-row-desc">{nbHyphen(post.description)}</span>
        <span className="a-row-meta"><time dateTime={isoDateTime(post.published)}>{heDate(post.published)}</time></span>
      </Link>
    </li>
  );
}

export function BlogIndex() {
  const [first, ...rest] = POSTS;
  return (
    <div className="a-wrap a-doc">
      <div className="a-head">
        <Breadcrumbs items={crumbsFor('/blog')} />
        <h1>בלוג atlas</h1>
        <p className="a-lede">מדריכים מעשיים לבעלי צימרים ומתחמי נופש. בלי מילים גדולות, עם מקורות.</p>
      </div>
      <ul className="a-list">
        <PostRow post={first} featured />
        {rest.map((p) => <PostRow key={p.slug} post={p} />)}
      </ul>
      <EndCta />
    </div>
  );
}

function EndCta() {
  return (
    <aside className="a-cta" aria-labelledby="a-cta-t">
      <h2 id="a-cta-t">כל הצימר על מסך אחד</h2>
      <p>לוח אחד לכל הערוצים, מקדמות ויתרות, וואטסאפ לאורחים בנוסח מוכן ודוח חודשי לרואה החשבון.</p>
      <div className="a-cta-row">
        <Link to="/register" className="s-btn s-btn-white">14 ימי ניסיון בחינם</Link>
        <span>בלי כרטיס אשראי</span>
      </div>
    </aside>
  );
}

export function Article({ post, body }) {
  const path = `/blog/${post.slug}`;
  const { summary, blocks, toc } = articleBlocks(body);
  const minutes = readingMinutes(body, post.faq);
  const related = relatedPosts(post.slug);
  return (
    <div className="a-wrap a-doc">
      <div className="a-head a-head-article">
        <Breadcrumbs items={crumbsFor(path)} />
        <p className="a-cat">{post.category}</p>
        <h1>{nbHyphen(post.title)}</h1>
        <p className="a-lede">{nbHyphen(post.description)}</p>
        <p className="a-meta a-meta-row">
          <span>צוות atlas</span>
          <span><CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" /> <time dateTime={isoDateTime(post.updated)}>{heDate(post.updated)}</time></span>
          <span><Clock size={16} strokeWidth={1.75} aria-hidden="true" /> {minutes} דקות קריאה</span>
        </p>
      </div>
      <img className="a-cover" src={`/blog/covers/${post.slug}.webp`} alt="" width="1200" height="675" fetchpriority="high" decoding="async" />
      <div className="a-cols">
        <article className="a-main">
          <Summary text={summary} />
          <div className="s-prose"><Markdown blocks={blocks} /></div>
          <FaqList items={post.faq} />
          <Sources items={post.sources} />
        </article>
        <aside className="a-side"><Toc items={[...toc, { id: 'faq', text: 'שאלות נפוצות' }]} /></aside>
      </div>
      <EndCta />
      <section className="a-related" aria-labelledby="a-rel">
        <h2 id="a-rel">עוד מהבלוג</h2>
        <ul className="a-list">{related.map((p) => <PostRow key={p.slug} post={p} />)}</ul>
        <Link to="/blog" className="a-all">לכל המאמרים <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /></Link>
      </section>
    </div>
  );
}

export function ArticleSkeleton({ post }) {
  return (
    <div className="a-wrap a-doc">
      <div className="a-head a-head-article">
        <Breadcrumbs items={crumbsFor(`/blog/${post.slug}`)} />
        <p className="a-cat">{post.category}</p>
        <h1>{nbHyphen(post.title)}</h1>
        <p className="a-lede">{nbHyphen(post.description)}</p>
      </div>
      <div className="a-skel" role="status" aria-label="טוען את המאמר" />
    </div>
  );
}

export function NotFound() {
  return (
    <div className="a-wrap a-doc a-404">
      <p className="a-cat">שגיאה 404</p>
      <h1>הדף הזה לא נמצא</h1>
      <p className="a-lede">אולי הקישור ישן, או שיש טעות בכתובת. נסו אחד מאלה:</p>
      <ul className="a-404-links">
        <li><Link to="/">דף הבית</Link></li>
        <li><Link to="/blog">הבלוג</Link></li>
        <li><Link to="/pricing">מחירים</Link></li>
        <li><Link to="/contact">יצירת קשר</Link></li>
      </ul>
    </div>
  );
}
