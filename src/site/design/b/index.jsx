/**
 * Site design B, "Brand": a bold electric-indigo band carries every page title (direction v6: indigo as
 * strong blocks, not pale white-on-white), content sits on a white sheet that overlaps the band,
 * the blog is a grid of cover cards. Same content and components as design A.
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, CalendarDays, ListTree } from 'lucide-react';
import { LEGAL } from '@/config/legal';
import { POSTS } from '@/site/content/posts';
import { FOOTER_GROUPS } from '@/site/pages';
import { ATLAS_ONE_LINER, crumbsFor } from '@/site/seo';
import { Markdown, Inline, parseMd, tocFromBlocks, nbHyphen } from '@/site/lib/md';
import {
  SkipLink, Wordmark, Breadcrumbs, Toc, LegalBody, FaqList, Sources, ContactForm, ContactDetails,
  CONTACT_TOPICS, WhatsAppButton, heDate, readingMinutes, articleBlocks, relatedPosts,
} from '@/site/shared';
import '@/site/site-base.css';
import './site-b.css';

export const DESIGN = 'b';

function Header() {
  return (
    <header className="b-hdr">
      <div className="b-wrap b-hdr-in">
        <Link to="/" className="b-logo" aria-label="ATLAS, לדף הבית"><Wordmark /></Link>
        <nav className="b-nav" aria-label="ניווט ראשי">
          <Link to="/blog">בלוג</Link>
          <Link to="/pricing">מחירים</Link>
          <Link to="/about" className="b-hide-sm">אודות</Link>
          <Link to="/login" className="b-hide-sm">כניסה</Link>
        </nav>
        <Link to="/register" className="s-btn s-btn-white b-hdr-cta">14 ימי ניסיון</Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="b-ftr">
      <div className="b-wrap">
        <div className="b-ftr-cta">
          <div>
            <p className="b-ftr-cta-t">שאלה? אדם עונה, בעברית.</p>
            <p className="b-ftr-cta-s">וואטסאפ <span dir="ltr">{LEGAL.WHATSAPP_DISPLAY}</span></p>
          </div>
          <WhatsAppButton className="s-btn s-btn-primary">כתבו לנו</WhatsAppButton>
        </div>
        <div className="b-ftr-top">
          <div className="b-ftr-brand">
            <Wordmark />
            <p>{ATLAS_ONE_LINER}</p>
          </div>
          {FOOTER_GROUPS.map((g) => (
            <nav key={g.title} className="b-ftr-col" aria-label={g.title}>
              <p className="b-ftr-h">{g.title}</p>
              <ul>{g.links.map((l) => <li key={l.to}><Link to={l.to}>{l.label}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
        <p className="b-ftr-copy">© 2026 ATLAS · נבנתה בישראל</p>
      </div>
    </footer>
  );
}

export function Shell({ children }) {
  return (
    <div className="s-root b-root" dir="rtl" lang="he">
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
    </div>
  );
}

function Band({ path, eyebrow, title, lede, children, wide = false }) {
  return (
    <section className={`b-band${wide ? ' is-wide' : ''}`}>
      <div className="b-wrap b-band-in">
        <Breadcrumbs items={crumbsFor(path)} />
        {eyebrow && <p className="b-eyebrow">{eyebrow}</p>}
        <h1>{nbHyphen(title)}</h1>
        {lede && <p className="b-lede">{nbHyphen(lede)}</p>}
        {children}
      </div>
    </section>
  );
}

function Summary({ text }) {
  if (!text) return null;
  return (
    <div className="b-summary">
      <p className="b-summary-t">בקצרה</p>
      <p><Inline text={text.replace(/^\*\*בקצרה:\*\*\s*/, '')} /></p>
    </div>
  );
}

function MobileToc({ items }) {
  if (!items.length) return null;
  return (
    <details className="b-mtoc">
      <summary><ListTree size={18} strokeWidth={1.75} aria-hidden="true" /> <span>בעמוד הזה</span></summary>
      <Toc items={items} title="תוכן העמוד" />
    </details>
  );
}

function splitSummary(md) {
  const blocks = parseMd(md);
  if (blocks[0] && blocks[0].type === 'callout') return { summary: blocks[0].text, rest: md.replace(/^>.*(\n>.*)*\n?/, '') };
  return { summary: null, rest: md };
}

function Sheet({ toc, children }) {
  return (
    <div className="b-wrap b-sheet-wrap">
      <div className="b-sheet">
        <div className="b-sheet-cols">
          <article className="b-main">
            <MobileToc items={toc} />
            {children}
          </article>
          {toc.length > 0 && <aside className="b-side"><Toc items={toc} /></aside>}
        </div>
      </div>
    </div>
  );
}

export function LegalPage({ path, page }) {
  const { summary, rest } = splitSummary(page.md);
  const toc = tocFromBlocks(parseMd(rest));
  return (
    <>
      <Band path={path} title={page.title} lede={page.lede}>
        {page.updated && <p className="b-meta">עודכן לאחרונה: <time dateTime={page.updated}>{heDate(page.updated)}</time></p>}
      </Band>
      <Sheet toc={toc}>
        <Summary text={summary} />
        <div className="s-prose"><LegalBody md={rest} /></div>
      </Sheet>
    </>
  );
}

export function AboutPage({ path, page }) {
  return (
    <>
      <Band path={path} title={page.title} lede={page.lede}>
        <div className="b-band-actions">
          <Link to="/register" className="s-btn s-btn-white">14 ימי ניסיון בחינם</Link>
          <WhatsAppButton className="b-band-link">דברו איתנו</WhatsAppButton>
        </div>
      </Band>
      <Sheet toc={tocFromBlocks(parseMd(page.md))}>
        <div className="s-prose"><LegalBody md={page.md} /></div>
      </Sheet>
    </>
  );
}

export function ContactPage({ path, page }) {
  return (
    <>
      <Band path={path} title={page.title} lede={page.lede}>
        <div className="b-band-actions">
          <WhatsAppButton className="s-btn s-btn-white">פתיחת שיחה בוואטסאפ</WhatsAppButton>
        </div>
      </Band>
      <div className="b-wrap b-sheet-wrap">
        <div className="b-contact">
          <section className="b-card" aria-labelledby="c-form">
            <h2 id="c-form">כתבו לנו</h2>
            <ContactForm />
          </section>
          <section className="b-card" aria-labelledby="c-ways">
            <h2 id="c-ways">כל הדרכים</h2>
            <ContactDetails />
            <h3 className="b-card-sub">פניות בנושאים מיוחדים</h3>
            <ul className="b-topics">
              {CONTACT_TOPICS.map((t) => (
                <li key={t.title}><strong>{t.title}.</strong> {t.text}<Link to={t.link.to}>{t.link.label}</Link>.</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

function Card({ post, featured = false }) {
  return (
    <li className={`b-pc${featured ? ' is-featured' : ''}`}>
      <Link to={`/blog/${post.slug}`} className="b-pc-link">
        <img src={`/blog/covers/${post.slug}.webp`} alt="" width="1200" height="675" className="b-pc-img" loading={featured ? 'eager' : 'lazy'} decoding="async" />
        <span className="b-pc-body">
          <span className="b-pc-cat">{post.category}</span>
          <span className="b-pc-title">{nbHyphen(post.title)}</span>
          <span className="b-pc-desc">{nbHyphen(post.description)}</span>
          <span className="b-pc-more">לקריאה <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /></span>
        </span>
      </Link>
    </li>
  );
}

export function BlogIndex() {
  const cats = ['הכול', ...Array.from(new Set(POSTS.map((p) => p.category)))];
  const [cat, setCat] = useState('הכול');
  const list = cat === 'הכול' ? POSTS : POSTS.filter((p) => p.category === cat);
  return (
    <>
      <Band path="/blog" title="בלוג ATLAS" lede="מדריכים מעשיים לבעלי צימרים ומתחמי נופש. בלי מילים גדולות, עם מקורות." wide>
        <div className="b-chips" role="group" aria-label="סינון לפי נושא">
          {cats.map((c) => (
            <button key={c} type="button" className="b-chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
      </Band>
      <div className="b-wrap b-grid-wrap">
        <ul className="b-grid" aria-live="polite">
          {list.map((p, i) => <Card key={p.slug} post={p} featured={cat === 'הכול' && i === 0} />)}
        </ul>
      </div>
      <EndCta />
    </>
  );
}

function EndCta() {
  return (
    <section className="b-endcta" aria-labelledby="b-cta-t">
      <div className="b-wrap b-endcta-in">
        <div>
          <h2 id="b-cta-t">כל הצימר במסך אחד, בעברית</h2>
          <p>לוח אחד לכל הערוצים, מקדמות ויתרות, וואטסאפ לאורחים בנוסח מוכן ודוח חודשי לרואה החשבון.</p>
        </div>
        <div className="b-endcta-act">
          <Link to="/register" className="s-btn s-btn-white">14 ימי ניסיון בחינם</Link>
          <span>בלי כרטיס אשראי</span>
        </div>
      </div>
    </section>
  );
}

export function Article({ post, body }) {
  const path = `/blog/${post.slug}`;
  const { summary, blocks, toc } = articleBlocks(body);
  const minutes = readingMinutes(body, post.faq);
  const related = relatedPosts(post.slug, 3);
  const fullToc = [...toc, { id: 'faq', text: 'שאלות נפוצות' }];
  return (
    <>
      <Band path={path} eyebrow={post.category} title={nbHyphen(post.title)} lede={nbHyphen(post.description)}>
        <p className="b-meta b-meta-row">
          <span>צוות ATLAS</span>
          <span><CalendarDays size={16} strokeWidth={1.75} aria-hidden="true" /> <time dateTime={post.updated}>{heDate(post.updated)}</time></span>
          <span><Clock size={16} strokeWidth={1.75} aria-hidden="true" /> {minutes} דקות קריאה</span>
        </p>
      </Band>
      <div className="b-wrap b-cover-wrap">
        <img className="b-cover" src={`/blog/covers/${post.slug}.webp`} alt="" width="1200" height="675" fetchpriority="high" decoding="async" />
      </div>
      <Sheet toc={fullToc}>
        <Summary text={summary} />
        <div className="s-prose"><Markdown blocks={blocks} /></div>
        <FaqList items={post.faq} />
        <Sources items={post.sources} />
      </Sheet>
      <section className="b-wrap b-related" aria-labelledby="b-rel">
        <div className="b-related-h">
          <h2 id="b-rel">עוד מהבלוג</h2>
          <Link to="/blog" className="b-all">לכל המאמרים <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" /></Link>
        </div>
        <ul className="b-grid b-grid-3">{related.map((p) => <Card key={p.slug} post={p} />)}</ul>
      </section>
      <EndCta />
    </>
  );
}

export function ArticleSkeleton({ post }) {
  return (
    <>
      <Band path={`/blog/${post.slug}`} eyebrow={post.category} title={nbHyphen(post.title)} lede={nbHyphen(post.description)} />
      <div className="b-wrap b-sheet-wrap"><div className="b-sheet b-skel" role="status" aria-label="טוען את המאמר" /></div>
    </>
  );
}

export function NotFound() {
  return (
    <section className="b-band b-404">
      <div className="b-wrap b-band-in">
        <p className="b-eyebrow">שגיאה 404</p>
        <h1>הדף הזה לא נמצא</h1>
        <p className="b-lede">ייתכן שהקישור ישן או שהייתה טעות בכתובת. אולי אחד מאלה יעזור:</p>
        <div className="b-chips">
          <Link className="b-chip" to="/">דף הבית</Link>
          <Link className="b-chip" to="/blog">הבלוג</Link>
          <Link className="b-chip" to="/pricing">מחירים</Link>
          <Link className="b-chip" to="/contact">יצירת קשר</Link>
        </div>
      </div>
    </section>
  );
}
