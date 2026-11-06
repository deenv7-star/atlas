// fix/ios-safe-area (06.11.2026): the iOS WebView must run edge-to-edge and let CSS env(safe-area-inset-*) do the
// spacing. contentInset "automatic" made WKWebView inset the content by the home-indicator area AND the CSS added
// env(safe-area-inset-bottom) again (tab bar floated ~34pt too high over a grey band); overlaysWebView:false painted a
// navy status-bar band and left a thin strip of the native background under it. Guard the config so it never returns.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cfg = JSON.parse(fs.readFileSync(new URL('../../capacitor.config.json', import.meta.url), 'utf8'));
const plist = fs.readFileSync(new URL('../../ios/App/App/Info.plist', import.meta.url), 'utf8');
const y2 = fs.readFileSync(new URL('../../src/ui-direction/y/y2.css', import.meta.url), 'utf8');

test('WebView is not auto-inset (CSS env() owns the safe areas)', () => {
  assert.equal(cfg.ios.contentInset, 'never');
});

test('status bar overlays the WebView with dark text, no coloured band', () => {
  assert.equal(cfg.plugins.StatusBar.overlaysWebView, true);
  assert.equal(String(cfg.plugins.StatusBar.style).toLowerCase(), 'light'); // LIGHT = dark text for light backgrounds
  assert.match(plist, /<key>UIStatusBarStyle<\/key>\s*<string>UIStatusBarStyleDarkContent<\/string>/);
});

test('tab bar adds the bottom safe area exactly once', () => {
  const rule = y2.match(/\.y2-tab \{[^}]*\}/)[0];
  assert.equal((rule.match(/safe-area-inset-bottom/g) || []).length, 1);
  assert.match(rule, /calc\(10px \+ env\(safe-area-inset-bottom\)\)/);
});
