# iOS Face ID lock + notifications: Playwright native-mode simulation on the LOCAL DEMO build.
# usage: python qa.py <dist> <port> <width>
# Native plugins are faked through Capacitor's own bridge contract (PluginHeaders + nativePromise / nativeCallback),
# so the real plugin JS wrappers in the bundle run unchanged.
import sys, json, time
sys.path.insert(0, '/workspace/projects/17af0f9e-27e7-4a93-aa64-41b6596c50d0/work/a1104')
from common import *
from playwright.sync_api import sync_playwright

DIST, PORT, W = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
ROOTQ = '/workspace/projects/17af0f9e-27e7-4a93-aa64-41b6596c50d0/qa/ios-faceid-push'
SHOTS = ensure(f'{ROOTQ}/shots'); DATA = ensure(f'{ROOTQ}/data')
BASE = serve(DIST, PORT)
res = []

FAKE = r"""
(function(){
  const F = window.__fake = Object.assign({ bio:{available:true,type:2,mode:'ok'}, perm:'prompt', pending:[], calls:[], cbs:{}, next:1, offset:0 },
    JSON.parse(sessionStorage.getItem('__fakecfg')||'{}'));
  try { F.pending = JSON.parse(sessionStorage.getItem('__fakepending')||'[]'); } catch(e) {}
  const save = () => { try { const c = JSON.parse(sessionStorage.getItem('__fakecfg')||'{}'); c.perm = F.perm; sessionStorage.setItem('__fakecfg', JSON.stringify(c)); sessionStorage.setItem('__fakepending', JSON.stringify(F.pending)); } catch(e) {} };
  F.save = save;
  new MutationObserver(() => { if (!F.sheetAt && document.querySelector('[data-testid=notify-preprompt]')) F.sheetAt = performance.now(); }).observe(document, { childList: true, subtree: true });
  const _now = Date.now.bind(Date); Date.now = () => _now() + (window.__fake.offset||0);
  const P = (name, promises) => ({ name, methods: [...promises.map(m=>({name:m, rtype:'promise'})), {name:'addListener'}, {name:'removeListener', rtype:'promise'}, {name:'removeAllListeners', rtype:'promise'}] });
  const C = window.Capacitor;
  C.PluginHeaders = [
    P('NativeBiometric', ['isAvailable','verifyIdentity','setData','getSecureData','deleteData','isDataSaved','setCredentials','getCredentials','deleteCredentials']),
    P('App', ['getInfo','getState','exitApp','getLaunchUrl','minimizeApp']),
    P('LocalNotifications', ['schedule','getPending','cancel','checkPermissions','requestPermissions','areEnabled','registerActionTypes','removeAllDeliveredNotifications','getDeliveredNotifications']),
    P('PushNotifications', ['register','unregister','checkPermissions','requestPermissions','getDeliveredNotifications','removeAllDeliveredNotifications','removeDeliveredNotifications','createChannel','listChannels','deleteChannel']),
  ];
  const err = (code, message) => { const e = new Error(message); e.code = code; return e; };
  window.__fire = (plugin, ev, data) => { (F.cbs[plugin+':'+ev]||[]).forEach(cb => cb(data)); };
  C.nativeCallback = (plugin, method, opts, cb) => { if (method==='addListener') { const k = plugin+':'+opts.eventName; (F.cbs[k] = F.cbs[k]||[]).push(cb); } return String(F.next++); };
  C.nativePromise = (plugin, method, opts) => {
    F.calls.push(plugin+'.'+method);
    const ok = (v) => Promise.resolve(v===undefined?{}:v);
    if (plugin==='NativeBiometric') {
      if (method==='isAvailable') return ok({ isAvailable: F.bio.available, biometryType: F.bio.type, strongBiometryIsAvailable: true });
      if (method==='verifyIdentity') {
        if (F.bio.mode==='hold') return new Promise((res, rej) => { F.release = (m) => m==='ok' ? res({}) : rej(m==='fail' ? err('10','Authentication failed') : err('16','User canceled')); });
        if (F.bio.mode==='ok') return ok();
        if (F.bio.mode==='fail') return Promise.reject(err('10','Authentication failed'));
        return Promise.reject(err('16','User canceled'));
      }
      if (method==='isDataSaved') return ok({ isSaved: false });
      return ok();
    }
    if (plugin==='App') return ok({ isActive: true });
    if (plugin==='LocalNotifications') {
      if (method==='checkPermissions') return ok({ display: F.perm });
      if (method==='requestPermissions') { F.perm = 'granted'; save(); return ok({ display: F.perm }); }
      if (method==='getPending') return ok({ notifications: F.pending.slice() });
      if (method==='schedule') { (opts.notifications||[]).forEach(n => { F.pending = F.pending.filter(p => p.id !== n.id); F.pending.push({ id:n.id, title:n.title, body:n.body, schedule:{ at: new Date(n.schedule.at).toISOString() }, extra:n.extra }); }); save(); return ok({ notifications: (opts.notifications||[]).map(n=>({id:String(n.id)})) }); }
      if (method==='cancel') { const ids = (opts.notifications||[]).map(n=>Number(n.id)); F.pending = F.pending.filter(p => !ids.includes(Number(p.id))); save(); return ok(); }
      return ok();
    }
    if (plugin==='PushNotifications') {
      if (method==='checkPermissions') return ok({ receive: F.perm });
      if (method==='requestPermissions') { F.perm = F.grant===false ? 'denied' : 'granted'; save(); return ok({ receive: F.perm }); }
      if (method==='register') { setTimeout(() => window.__fire('PushNotifications','registration',{ value: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90' }), 50); return ok(); }
      return ok();
    }
    return Promise.reject(err('UNIMPLEMENTED', plugin+' not implemented'));
  };
})();
"""

def log(scene, step, ok, **kw):
    row = dict(scene=scene, step=step, ok=bool(ok), w=W, **kw); res.append(row)
    print(json.dumps(row, ensure_ascii=False)[:600], flush=True)

def shot(pg, name):
    p = f'{SHOTS}/{name}-{W}.png'; pg.screenshot(path=p); return p

def checks(pg, scene, name, scope=None, errs=None):
    c = pg.evaluate(CHK, scope)
    ax = [v for v in axe(pg, scope) if v.get('impact') in ('serious', 'critical')]
    log(scene, f'checks:{name}', c['ov'] == 0 and c['nsmall'] == 0 and not ax and not (errs or []),
        ov=c['ov'], small=c['small'], axe=ax, console=(errs or [])[:4], glued=c['glued'], tiny=c['tiny'])

def new(b, cfg, prefs=None, native=True, path='/dashboard'):
    pre = ''
    for k, v in (prefs or {}).items():
        pre += f"localStorage.setItem({json.dumps(k)}, {json.dumps(json.dumps(v))});"
    extra = (f"if(!sessionStorage.getItem('__fakecfg'))sessionStorage.setItem('__fakecfg', {json.dumps(json.dumps(cfg))});"
             f"if(!sessionStorage.getItem('__prefs')){{try{{{pre}}}catch(e){{}};sessionStorage.setItem('__prefs','1')}}") + (FAKE if native else '')
    ctx, pg, errs = ctx_for(b, W, SEED, native=native, extra=extra)
    pg.goto(BASE + path, wait_until='domcontentloaded', timeout=45000)
    try: pg.wait_for_load_state('networkidle', timeout=8000)
    except Exception: pass
    return ctx, pg, errs

fake = lambda pg, expr: pg.evaluate(f"()=>{{const F=window.__fake;{expr}}}")
calls = lambda pg: pg.evaluate("()=>window.__fake.calls.slice()")
LOCK = {'atlas.applock.v1': {'enabled': True, 'userId': USER['id'], 'offered': True}}
OFFERED = {'atlas.applock.v1': {'enabled': False, 'userId': '', 'offered': True}}

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE, args=['--no-proxy-server', '--no-sandbox'])

    # 1. Face ID offer after the first sign-in (notifications already granted so only the offer can show)
    ctx, pg, errs = new(b, {'perm': 'granted'})
    try:
        pg.wait_for_selector('[data-testid=faceid-offer]', timeout=9000); pg.wait_for_timeout(700)
        txt = pg.inner_text('[data-testid=faceid-offer]')
        log('offer', 'shown', 'לפתוח את atlas עם' in txt and 'Face ID' in txt, text=txt[:160]); shot(pg, 'faceid-offer')
        checks(pg, 'offer', 'sheet', '[data-testid=faceid-offer]', errs)
        pg.click('[data-testid=faceid-offer-yes]')
        try: pg.wait_for_selector('[data-testid=faceid-offer]', state='hidden', timeout=6000)
        except Exception: pass
        prefs = pg.evaluate("()=>JSON.parse(localStorage.getItem('atlas.applock.v1'))")
        gone = pg.locator('[data-testid=faceid-offer]').count() == 0 or not pg.is_visible('[data-testid=faceid-offer]')
        log('offer', 'accept→enabled', prefs.get('enabled') and prefs.get('userId') == USER['id'] and 'NativeBiometric.verifyIdentity' in calls(pg) and gone, prefs=prefs)
        pg.reload(wait_until='domcontentloaded'); pg.wait_for_timeout(3500)
        log('offer', 'not offered twice', pg.locator('[data-testid=faceid-offer]').count() == 0)
    except Exception as e: log('offer', 'error', False, err=str(e)[:300])
    ctx.close()

    # 2. Cold start with the lock on: asking → cancel → "נסו שוב" / "התנתקות" → success
    ctx, pg, errs = new(b, {'perm': 'granted', 'bio': {'available': True, 'type': 2, 'mode': 'hold'}}, LOCK)
    try:
        pg.wait_for_selector('[data-testid=app-lock]', timeout=9000); pg.wait_for_timeout(900)
        inert = pg.evaluate("()=>document.getElementById('root').hasAttribute('inert')")
        log('lock', 'cold start locked + app inert', inert and 'NativeBiometric.verifyIdentity' in calls(pg)); shot(pg, 'lock-asking')
        fake(pg, "F.release('cancel')"); pg.wait_for_timeout(500)
        t = pg.inner_text('[data-testid=app-lock]')
        log('lock', 'cancel → retry + sign out', 'נסו שוב' in t and 'התנתקות' in t, text=t[:120]); shot(pg, 'lock-cancelled')
        checks(pg, 'lock', 'cancelled', None, errs)
        fake(pg, "F.bio.mode='hold'"); pg.click('[data-testid=lock-retry]'); pg.wait_for_timeout(300)
        fake(pg, "F.release('fail')"); pg.wait_for_timeout(500)
        t = pg.inner_text('[data-testid=app-lock]')
        log('lock', 'failed face → message', 'לא זיהינו אתכם' in t, text=t[:120]); shot(pg, 'lock-failed')
        checks(pg, 'lock', 'failed', None, errs)
        fake(pg, "F.bio.mode='ok'"); pg.click('[data-testid=lock-retry]'); pg.wait_for_timeout(900)
        open_ = pg.locator('[data-testid=app-lock]').count()
        inert = pg.evaluate("()=>document.getElementById('root').hasAttribute('inert')")
        log('lock', 'unlock → app usable', open_ == 0 and not inert); shot(pg, 'lock-unlocked')
        # background < 5 min: privacy cover only, removed on return, no prompt
        n0 = calls(pg).count('NativeBiometric.verifyIdentity')
        pg.evaluate("()=>window.__fire('App','pause',{})"); pg.wait_for_timeout(250)
        cov = pg.locator('[data-testid=app-privacy-cover]').count(); shot(pg, 'privacy-cover')
        fake(pg, "F.offset = 4*60*1000"); pg.evaluate("()=>window.__fire('App','resume',{})"); pg.wait_for_timeout(500)
        log('lock', 'back after 4 min: cover then nothing', cov == 1 and pg.locator('[data-testid=app-privacy-cover],[data-testid=app-lock]').count() == 0 and calls(pg).count('NativeBiometric.verifyIdentity') == n0)
        # background > 5 min: locked + Face ID asked
        fake(pg, "F.bio.mode='hold'")
        pg.evaluate("()=>window.__fire('App','pause',{})"); fake(pg, "F.offset = 10*60*1000 + 6*60*1000"); pg.evaluate("()=>window.__fire('App','resume',{})"); pg.wait_for_timeout(900)
        log('lock', 'back after 6 min: locked + asked', pg.locator('[data-testid=app-lock]').count() == 1 and calls(pg).count('NativeBiometric.verifyIdentity') == n0 + 1)
        fake(pg, "F.release('ok')"); pg.wait_for_timeout(600)
        # sign out from the lock screen
        fake(pg, "F.bio.mode='cancel'"); pg.evaluate("()=>window.__fire('App','pause',{})"); fake(pg, "F.offset = 30*60*1000"); pg.evaluate("()=>window.__fire('App','resume',{})"); pg.wait_for_timeout(900)
        pg.click('[data-testid=lock-signout]'); pg.wait_for_timeout(2500)
        log('lock', 'sign out → /login', '/login' in pg.url, url=pg.url)
    except Exception as e: log('lock', 'error', False, err=str(e)[:300])
    ctx.close()

    # 2b. lock on, but another account is signed in → never locked out
    ctx, pg, errs = new(b, {'perm': 'granted'}, {'atlas.applock.v1': {'enabled': True, 'userId': 'someone-else', 'offered': True}})
    try:
        pg.wait_for_timeout(3000)
        log('lock', 'other account not locked', pg.locator('[data-testid=app-lock]').count() == 0 and not pg.evaluate("()=>document.getElementById('root').hasAttribute('inert')"))
    except Exception as e: log('lock', 'error2', False, err=str(e)[:300])
    ctx.close()

    # 3. Settings → אבטחה toggle
    ctx, pg, errs = new(b, {'perm': 'granted'}, LOCK, path='/settings?tab=security')
    try:
        pg.wait_for_selector('[data-testid=faceid-setting]', timeout=15000); pg.wait_for_timeout(800)  # the lock opened by itself (Face ID ok)
        log('settings', 'cold-start lock passed with Face ID', pg.locator('[data-testid=app-lock]').count() == 0 and 'NativeBiometric.verifyIdentity' in calls(pg))
        el = pg.locator('[data-testid=faceid-setting]'); el.scroll_into_view_if_needed()
        sw = el.locator('[role=switch]')
        log('settings', 'toggle on', sw.get_attribute('aria-checked') == 'true', text=el.inner_text()[:80]); shot(pg, 'settings-faceid-on')
        checks(pg, 'settings', 'security', None, errs)
        sw.click(); pg.wait_for_timeout(500)
        off = pg.evaluate("()=>JSON.parse(localStorage.getItem('atlas.applock.v1')).enabled")
        log('settings', 'toggle off → disabled', sw.get_attribute('aria-checked') == 'false' and off is False); shot(pg, 'settings-faceid-off')
        n0 = calls(pg).count('NativeBiometric.verifyIdentity')
        sw.click(); pg.wait_for_timeout(600)
        on = pg.evaluate("()=>JSON.parse(localStorage.getItem('atlas.applock.v1')).enabled")
        log('settings', 'toggle on → Face ID check first', on is True and calls(pg).count('NativeBiometric.verifyIdentity') == n0 + 1)
        fake(pg, "F.bio.mode='cancel'"); sw.click(); pg.wait_for_timeout(400); sw.click(); pg.wait_for_timeout(500)
        log('settings', 'cancelled Face ID keeps it off, no error', sw.get_attribute('aria-checked') == 'false' and pg.locator('[data-testid=faceid-setting] [role=alert]').count() == 0)
    except Exception as e: log('settings', 'error', False, err=str(e)[:300])
    ctx.close()

    # 4. Notifications pre-prompt (meaningful moment: signed in, on Today, upcoming arrivals, Face ID offer already done)
    ctx, pg, errs = new(b, {'perm': 'prompt'}, OFFERED)
    try:
        pg.wait_for_selector('[data-testid=notify-preprompt]', timeout=12000); pg.wait_for_timeout(700)
        at = pg.evaluate("()=>window.__fake.sheetAt||0")
        log('notify', 'not on first paint (shown after the 2.5 s settle)', at >= 2500, shown_ms=round(at))
        txt = pg.inner_text('[data-testid=notify-preprompt]')
        log('notify', 'pre-prompt shown', 'להזכיר לכם' in txt and '9:00' in txt, text=txt[:160]); shot(pg, 'notify-preprompt')
        checks(pg, 'notify', 'sheet', '[data-testid=notify-preprompt]', errs)
        pg.click('[data-testid=notify-yes]'); pg.wait_for_timeout(2500)
        pend = pg.evaluate("()=>window.__fake.pending")
        c = calls(pg)
        log('notify', 'iOS asked → granted → reminders scheduled + push registered',
            'PushNotifications.requestPermissions' in c and 'PushNotifications.register' in c and len(pend) >= 1,
            pending=[(x['id'], x['schedule']['at'], x['title'], x['body']) for x in pend][:5])
        # 09:00 Asia/Jerusalem check on the first one
        import datetime as _d
        from zoneinfo import ZoneInfo
        ok9 = all(_d.datetime.fromisoformat(x['schedule']['at'].replace('Z', '+00:00')).astimezone(ZoneInfo('Asia/Jerusalem')).strftime('%H:%M') == '09:00' for x in pend)
        log('notify', 'every reminder at 09:00 Israel', ok9)
        tok = pg.evaluate("()=>JSON.parse(localStorage.getItem('atlas.push.token.v1')||'null')")
        log('notify', 'token kept locally, no backend in demo → quiet', bool(tok and tok.get('token')) and not errs, token=tok, console=errs[:3])
        # booking cancelled → its reminder cancelled on the next return to the app
        pg.evaluate("""()=>{const k='atlas_entity_Booking';const a=JSON.parse(localStorage.getItem(k));const f=a.find(b=>b.id==='b4');if(f)f.status='CANCELLED';localStorage.setItem(k,JSON.stringify(a));}""")
        pg.evaluate("()=>window.__fire('App','resume',{})"); pg.wait_for_timeout(2500)
        pend2 = pg.evaluate("()=>window.__fake.pending.map(x=>x.title)")
        log('notify', 'cancelled booking → reminder removed', not any('יעל אברהם' in t for t in pend2) and any('יעל אברהם' in x['title'] for x in pend), before=[x['title'] for x in pend], after=pend2)
        pg.reload(wait_until='domcontentloaded'); pg.wait_for_timeout(4000)
        log('notify', 'not asked again', pg.locator('[data-testid=notify-preprompt]').count() == 0)
        pg.goto(BASE + '/settings?tab=notifications', wait_until='domcontentloaded')
        pg.wait_for_selector('[data-testid=notify-setting] [role=switch][aria-checked=true]', timeout=12000)
        el = pg.locator('[data-testid=notify-setting]')
        log('notify', 'settings card on', el.count() == 1, perm=pg.evaluate("()=>window.__fake.perm"))
        el.scroll_into_view_if_needed(); shot(pg, 'settings-notify')
        checks(pg, 'notify', 'settings', None, errs)
        el.locator('[role=switch]').click(); pg.wait_for_timeout(800)
        log('notify', 'settings off → all reminders cancelled', pg.evaluate("()=>window.__fake.pending.length") == 0)
    except Exception as e: log('notify', 'error', False, err=str(e)[:300])
    ctx.close()

    # 4b. Same session as the Face ID offer → no second sheet
    ctx, pg, errs = new(b, {'perm': 'prompt'})
    try:
        pg.wait_for_selector('[data-testid=faceid-offer]', timeout=9000)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(5000)
        log('notify', 'no pre-prompt in the Face ID offer session', pg.locator('[data-testid=notify-preprompt]').count() == 0)
    except Exception as e: log('notify', 'error2', False, err=str(e)[:300])
    ctx.close()

    # 5. Web (not the app): nothing changes, no plugin code loaded
    ctx, pg, errs = new(b, {}, LOCK, native=False)
    try:
        reqs = []
        pg.on('request', lambda r: reqs.append(r.url))
        pg.reload(wait_until='domcontentloaded'); pg.wait_for_timeout(4000)
        none = pg.locator('[data-testid=app-lock],[data-testid=faceid-offer],[data-testid=notify-preprompt]').count() == 0
        import glob
        pchunks = {os.path.basename(f) for f in glob.glob(f'{DIST}/assets/*.js') if re.search(r'["\'](PushNotifications|LocalNotifications|NativeBiometric)["\']', open(f, encoding='utf-8', errors='ignore').read())}
        plug = [u for u in reqs if os.path.basename(u.split('?')[0]) in pchunks or re.search(r'(AppLockHost|NotifyHost)', u)]
        log('web', 'plugin chunks found in build', len(pchunks) >= 3, chunks=sorted(pchunks))
        log('web', 'web untouched', none and not plug and not errs, plugin_chunks=plug[:4], console=errs[:3])
    except Exception as e: log('web', 'error', False, err=str(e)[:300])
    ctx.close()
    b.close()

json.dump(res, open(f'{DATA}/qa-{W}.json', 'w'), ensure_ascii=False, indent=1)
bad = [r for r in res if not r['ok']]
print(f'SUMMARY w={W} pass={len(res)-len(bad)} fail={len(bad)}')
for r in bad: print('FAIL', json.dumps(r, ensure_ascii=False)[:400])
