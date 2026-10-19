/* atlas push handler, loaded into the site's service worker with importScripts('/push-sw.js')
 * (vite.config.js → workbox.importScripts). It only adds three listeners: push, notificationclick and
 * pushsubscriptionchange. No fetch handler and no caching, so pages (landing included) load exactly as before.
 *
 * Payload (supabase/functions/_shared/pushMessages.js → toPayload):
 *   { v: 1, title, body, url: '/booking/<id>', tag, kind: 'booking' | 'ical' | 'lead' | 'test' }
 */
/* eslint-disable no-restricted-globals */
(function () {
  var ICON = '/icons/icon-192x192.png';
  var BADGE = '/icons/badge-96.png';
  var FALLBACK = { title: 'atlas', body: 'יש עדכון חדש באפליקציה', url: '/today', tag: 'atlas' };

  function safeUrl(u) {
    try {
      var url = new URL(u || '/today', self.location.origin);
      // only this site; anything else opens the home screen of the app
      return url.origin === self.location.origin ? url.pathname + url.search + url.hash : '/today';
    } catch (e) { return '/today'; }
  }

  function readPayload(event) {
    if (!event.data) return FALLBACK;
    try {
      var d = event.data.json();
      if (!d || typeof d !== 'object') return FALLBACK;
      return {
        title: String(d.title || FALLBACK.title).slice(0, 80),
        body: String(d.body || '').slice(0, 200),
        url: safeUrl(d.url),
        tag: String(d.tag || d.url || 'atlas').slice(0, 64),
        kind: d.kind || 'update',
      };
    } catch (e) {
      var text = '';
      try { text = event.data.text(); } catch (e2) { /* ignore */ }
      return { title: FALLBACK.title, body: String(text || FALLBACK.body).slice(0, 200), url: '/today', tag: 'atlas' };
    }
  }

  self.addEventListener('push', function (event) {
    var p = readPayload(event);
    event.waitUntil(self.registration.showNotification(p.title, {
      body: p.body,
      icon: ICON,
      badge: BADGE,
      dir: 'rtl',
      lang: 'he',
      tag: p.tag,
      renotify: true,
      timestamp: Date.now(),
      data: { url: p.url, kind: p.kind },
    }));
  });

  self.addEventListener('notificationclick', function (event) {
    var url = safeUrl(event.notification && event.notification.data && event.notification.data.url);
    if (event.notification) event.notification.close();
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      // prefer a window that is already in the app (not the landing), then any window of the site
      var app = null; var any = null;
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        var path = '';
        try { path = new URL(c.url).pathname; } catch (e) { /* ignore */ }
        if (!any) any = c;
        if (!app && path && path !== '/' && path.indexOf('/login') !== 0) app = c;
      }
      var target = app || any;
      if (target && 'focus' in target) {
        return target.focus().then(function (w) {
          var win = w || target;
          if ('navigate' in win) return win.navigate(url).catch(function () { return self.clients.openWindow(url); });
          return null;
        });
      }
      return self.clients.openWindow(url);
    }));
  });

  // The push service rotated the subscription (rare). Re-subscribe with the same key and tell open pages,
  // which save it on the account (src/lib/pwa/push.js listens for this message and syncs on every app start).
  self.addEventListener('pushsubscriptionchange', function (event) {
    var opts = event.oldSubscription && event.oldSubscription.options;
    if (!opts || !opts.applicationServerKey) return;
    event.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: opts.applicationServerKey })
      .then(function (sub) {
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
          list.forEach(function (c) { c.postMessage({ type: 'atlas:push-subscription-changed', subscription: sub.toJSON() }); });
        });
      })
      .catch(function () { /* the next app start re-syncs */ }));
  });
})();
