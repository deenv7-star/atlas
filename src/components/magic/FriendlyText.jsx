/** Text with links shown the friendly way ("ניווט בוויז" instead of waze.com/ul?…). Real links stay tappable. */
import React from 'react';
import { URL_RE, TRAIL, friendlyLink } from './links';

export function FriendlyText({ text, linkClassName = 'mg-link', asLinks = false }) {
  return String(text || '').split(URL_RE).flatMap((part, i) => {
    if (!part || i % 2 === 0) return part ? [part] : [];
    const trail = (part.match(TRAIL) || [''])[0];
    const url = trail ? part.slice(0, -trail.length) : part;
    const { label, rtl } = friendlyLink(url);
    const props = { key: i, className: linkClassName, dir: rtl ? undefined : 'ltr' };
    if (asLinks) {
      const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      return [<a {...props} href={href} target="_blank" rel="noreferrer">{label}</a>, trail];
    }
    return [<span {...props}>{label}</span>, trail];
  });
}

export default FriendlyText;
