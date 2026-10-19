/* atlas: one-time cleanup that lets every returning browser see the newest deploy on its next load.
 *
 * Loaded into the Workbox service worker (vite.config.js → workbox.importScripts), before Workbox's
 * own listeners, so it runs ahead of the precache cleanup.
 *
 * Why: service workers built before 18.10.2026 (#109) precached index.html and answered EVERY page
 * navigation with that stored copy (navigateFallback). A browser that still has one of them keeps
 * showing the release it first cached until a hard refresh. Pages of that era have no reload logic,
 * so when this newer worker takes over, the tab would stay on the old copy.
 *
 * What this does:
 *   install  - notes whether the worker being replaced is one of those legacy ones (its precache still
 *              holds index.html). Kept in a tiny cache because the worker can be stopped between
 *              install and activate.
 *   activate - deletes caches nothing uses any more (old HTML copies, retired cache names), and only
 *              if a legacy worker was replaced, navigates each open atlas tab once to its own URL, so
 *              it loads the current HTML from the network. Tabs of newer releases are left to
 *              src/lib/swUpdate.js (one guarded reload, never over a half-filled form).
 * No fetch handler here: requests are handled by Workbox (pages network-first, hashed assets precached).
 */
(function () {
  var META = 'atlas-sw-meta';
  var LEGACY_KEY = '/__atlas-legacy-shell';
  // caches this worker owns; everything else from older builds is removed on activate
  var KEEP = [/^workbox-precache-/, /^atlas-pages-v2$/, /^google-fonts-cache$/, /^api-cache$/, new RegExp('^' + META + '$')];

  function precacheHasShell() {
    return caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return /^workbox-precache-/.test(n); }).map(function (n) {
        return caches.open(n).then(function (c) { return c.keys(); }).then(function (reqs) {
          return reqs.some(function (r) {
            var p = new URL(r.url).pathname;
            return p === '/index.html' || p === '/' || /\/index\.html$/.test(p);
          });
        });
      })).then(function (hits) { return hits.some(Boolean); });
    }).catch(function () { return false; });
  }

  self.addEventListener('install', function (event) {
    event.waitUntil(precacheHasShell().then(function (legacy) {
      if (!legacy) return;
      return caches.open(META).then(function (c) { return c.put(LEGACY_KEY, new Response('1')); });
    }).catch(function () {}));
  });

  function reloadTabsOnce() {
    // Not inside activate's waitUntil: a tab's navigation is a fetch this worker can only answer once it
    // has finished activating, so awaiting it there would deadlock until the browser gives up.
    return self.clients.claim().catch(function () {}).then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then(function (tabs) {
      return Promise.all(tabs.map(function (tab) {
        try {
          if (new URL(tab.url).origin !== self.location.origin) return null;
          return tab.navigate(tab.url).catch(function () { return null; });
        } catch (e) { return null; }
      }));
    }).catch(function () {});
  }

  self.addEventListener('activate', function (event) {
    var legacy = false;
    var cleanup = caches.open(META)
      .then(function (c) { return c.match(LEGACY_KEY).then(function (r) { legacy = !!r; return c.delete(LEGACY_KEY); }); })
      .then(function () { return caches.keys(); })
      .then(function (names) {
        return Promise.all(names.filter(function (n) {
          return !KEEP.some(function (re) { return re.test(n); });
        }).map(function (n) { return caches.delete(n); }));
      })
      .catch(function () {});
    event.waitUntil(cleanup);
    // after activation completes (next task), load the legacy-era tabs fresh, once
    cleanup.then(function () { if (legacy) setTimeout(reloadTabsOnce, 50); });
  });
})();
