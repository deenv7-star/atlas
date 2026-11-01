// atlas launch film: Three.js stage (iPhone 16 Pro + MacBook Pro 14", real atlas captures as screen textures).
// Every frame is a pure function of time t (seconds). Units: millimetres.
import * as THREE from "three";
import { RoomEnvironment } from "./assets/lib/RoomEnvironment.js";
import BBOX_DATA from "./assets/cap/bbox.js";

const { E, clamp, prog } = window.__hfUtil;
const W = 1080, H = 1920;
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (k) => k * k * (3 - 2 * k);
const DEG = Math.PI / 180;

let readyResolve;
window.__hf = window.__hf || {};
window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["stage"] = new Promise((r) => (readyResolve = r));

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById("stage");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.autoClear = false;
renderer.setClearColor(0x000000, 0);
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
scene.environmentIntensity = 0.95;

const key = new THREE.DirectionalLight(0xffffff, 1.6);
key.position.set(-400, 700, 600);
scene.add(key);
const rim = new THREE.DirectionalLight(0xdfe3ff, 2.2);
rim.position.set(500, 300, -500);
scene.add(rim);
const fill = new THREE.HemisphereLight(0xffffff, 0xd9dcef, 0.6);
scene.add(fill);

const camera = new THREE.PerspectiveCamera(20, W / H, 5, 8000);
const TANH = Math.tan((camera.fov * DEG) / 2);

// world root (mirrored for the floor reflection pass)
const world = new THREE.Group();
scene.add(world);
const shadowsGroup = new THREE.Group();
scene.add(shadowsGroup);

// ---------------------------------------------------------------- helpers
function rrShape(w, h, r, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  const x = cx - w / 2, y = cy - h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// superellipse-ish continuous corner (Apple "squircle") rounded rect
function squircleShape(w, h, r, n = 24) {
  const s = new THREE.Shape();
  const pts = [];
  const corners = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180], [w / 2 - r, -h / 2 + r, 270]];
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (90 * i) / n) * DEG;
      const c = Math.cos(a), sn = Math.sin(a);
      // exponent 4 superellipse blend: softer than a circle, like Apple corners
      const ex = 2 / 4.2;
      const x = Math.sign(c) * Math.pow(Math.abs(c), ex) * r;
      const y = Math.sign(sn) * Math.pow(Math.abs(sn), ex) * r;
      pts.push(new THREE.Vector2(cx + x, cy + y));
    }
  s.setFromPoints(pts);
  return s;
}
function planarUV(geo, w, h) {
  const p = geo.attributes.position, uv = [];
  for (let i = 0; i < p.count; i++) uv.push(p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return geo;
}
function canvasTex(cv, srgb = true) {
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = MAX_ANISO;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  return t;
}
function mk(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}
function loadImg(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("img " + src));
    i.src = src;
  });
}
function softShadowTex(w, h, rr, blur) {
  const c = mk(w, h), g = c.getContext("2d");
  g.filter = `blur(${blur}px)`;
  g.fillStyle = "rgba(27,38,86,1)";
  const pad = blur * 2.2;
  g.beginPath();
  g.roundRect(pad, pad, w - pad * 2, h - pad * 2, rr);
  g.fill();
  return canvasTex(c);
}

// ---------------------------------------------------------------- materials
const titanium = new THREE.MeshPhysicalMaterial({ color: 0xaeb2b9, metalness: 1, roughness: 0.34, envMapIntensity: 1.15 });
const titaniumDark = new THREE.MeshPhysicalMaterial({ color: 0x8d9198, metalness: 1, roughness: 0.42 });
const sapphire = new THREE.MeshPhysicalMaterial({ color: 0x6f747c, metalness: 0.6, roughness: 0.15, clearcoat: 1 });
const blackGlass = new THREE.MeshPhysicalMaterial({ color: 0x050608, metalness: 0, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04 });
const pureBlack = new THREE.MeshBasicMaterial({ color: 0x000000 });
const aluminium = new THREE.MeshPhysicalMaterial({ color: 0xd6d8dd, metalness: 1, roughness: 0.4, envMapIntensity: 1.1 });
const aluminiumEdge = new THREE.MeshPhysicalMaterial({ color: 0xc9ccd2, metalness: 1, roughness: 0.3 });
const keyMat = new THREE.MeshStandardMaterial({ color: 0x0e0f12, roughness: 0.62 });
const wellMat = new THREE.MeshStandardMaterial({ color: 0x1d1f24, roughness: 0.8 });
const padMat = new THREE.MeshPhysicalMaterial({ color: 0xcfd2d7, metalness: 0.7, roughness: 0.48 });
const hingeMat = new THREE.MeshStandardMaterial({ color: 0x2a2c31, metalness: 0.6, roughness: 0.5 });
// additive glass sheen: black diffuse adds nothing, only the environment reflection is added on top of the screen
const sheen = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 0.32 });

// ---------------------------------------------------------------- iPhone 16 Pro (71.5 x 149.6 x 8.25 mm)
const IP = { W: 71.5, H: 149.6, D: 8.25, R: 11.9, bezel: 2.31 };
IP.k = (IP.W - 2 * IP.bezel) / 393; // mm per pt  (display 393 x 852 pt)
IP.DW = 393 * IP.k;
IP.DH = 852 * IP.k;
IP.DR = 55 * IP.k;
const phone = new THREE.Group(); // origin: bottom centre, screen faces +z
const phoneBody = new THREE.Group();
phoneBody.position.y = IP.H / 2;
phone.add(phoneBody);
{
  const bev = 1.15;
  const g = new THREE.ExtrudeGeometry(squircleShape(IP.W - 2 * bev, IP.H - 2 * bev, IP.R - bev), { depth: IP.D - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 6, curveSegments: 12 });
  g.translate(0, 0, -(IP.D - 2 * bev) / 2);
  phoneBody.add(new THREE.Mesh(g, titanium));
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(squircleShape(IP.W - 1.3, IP.H - 1.3, IP.R - 0.65)), blackGlass);
  glass.position.z = IP.D / 2 + 0.02;
  phoneBody.add(glass);
  // buttons: left = Action + volume up/down, right = side button + Camera Control (positions from the top edge)
  const btn = (side, fromTop, len, mat = titanium, prot = 0.55) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.9, len - 1.8, 6, 12), mat);
    m.scale.set(prot / 0.9, 1, 1.0);
    m.position.set(side * (IP.W / 2 - 0.15), IP.H / 2 - fromTop, 0);
    phoneBody.add(m);
  };
  btn(-1, 33.5, 6.5);
  btn(-1, 49.5, 11);
  btn(-1, 63.5, 11);
  btn(1, 52, 17);
  btn(1, 101, 13, sapphire, 0.25);
}
const phoneScreenGeo = planarUV(new THREE.ShapeGeometry(squircleShape(IP.DW, IP.DH, IP.DR), 24), IP.DW, IP.DH);
const phoneScreenMat = new THREE.MeshBasicMaterial({ toneMapped: false });
const phoneScreen = new THREE.Mesh(phoneScreenGeo, phoneScreenMat);
phoneScreen.position.z = IP.D / 2 + 0.05;
phoneBody.add(phoneScreen);
// display-local group: origin = display centre, on the glass
const phoneDisp = new THREE.Group();
phoneDisp.position.z = IP.D / 2 + 0.06;
phoneBody.add(phoneDisp);
{
  // Dynamic Island 126 x 37 pt, 11 pt below the display top
  const di = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(126 * IP.k, 37 * IP.k, 18.5 * IP.k), 16), pureBlack);
  di.position.set(0, IP.DH / 2 - (11 + 18.5) * IP.k, 0.5);
  phoneDisp.add(di);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(1.6 * IP.k * 3, 20), new THREE.MeshPhysicalMaterial({ color: 0x0b0d16, roughness: 0.05, clearcoat: 1 }));
  lens.position.set(40 * IP.k, IP.DH / 2 - 29.5 * IP.k, 0.52);
  phoneDisp.add(lens);
  const sh = new THREE.Mesh(phoneScreenGeo, sheen);
  sh.position.z = 0.9;
  sh.renderOrder = 20;
  phoneDisp.add(sh);
}
world.add(phone);

// ---------------------------------------------------------------- MacBook Pro 14" (312.6 x 221.2 x 15.5 mm, 3024 x 1964 panel)
const MB = { W: 312.6, D: 221.2, BT: 10.4, LT: 5.0, R: 9.5, DW: 302.5, DH: 196.4, open: 108 };
MB.k = MB.DW / 1512; // mm per pt
const mac = new THREE.Group();
{
  const bev = 1.6;
  const g = new THREE.ExtrudeGeometry(rrShape(MB.W - 2 * bev, MB.D - 2 * bev, MB.R - bev), { depth: MB.BT - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 5, curveSegments: 16 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bev, 0);
  mac.add(new THREE.Mesh(g, aluminium));
  // keyboard well + keys
  const top = MB.BT + 0.02;
  const wellW = 276, wellD = 114, wellZ = -MB.D / 2 + 13 + wellD / 2;
  const well = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(wellW, wellD, 3)), wellMat);
  well.rotation.x = -Math.PI / 2;
  well.position.set(0, top, wellZ);
  mac.add(well);
  const keys = [];
  const pitch = 19.1, gap = 1.6;
  const rows = [
    { h: 9.5, keys: Array(14).fill(1) },
    { h: 16.2, keys: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5] },
    { h: 16.2, keys: [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    { h: 16.2, keys: [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.75] },
    { h: 16.2, keys: [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.3] },
    { h: 16.2, keys: [1, 1, 1, 1.25, 5.1, 1.25, 1, 1, 1, 1] },
  ];
  let z = wellZ - wellD / 2 + 3.5;
  for (const row of rows) {
    const total = row.keys.reduce((a, b) => a + b, 0) * pitch;
    let x = -total / 2;
    for (const u of row.keys) {
      keys.push([x + (u * pitch) / 2, z + row.h / 2, u * pitch - gap, row.h]);
      x += u * pitch;
    }
    z += row.h + gap + 0.6;
  }
  const keyGeo = new THREE.BoxGeometry(1, 0.7, 1);
  const inst = new THREE.InstancedMesh(keyGeo, keyMat, keys.length);
  const m4 = new THREE.Matrix4();
  keys.forEach(([x, kz, w, d], i) => {
    m4.compose(new THREE.Vector3(x, top + 0.35, kz), new THREE.Quaternion(), new THREE.Vector3(w, 1, d));
    inst.setMatrixAt(i, m4);
  });
  mac.add(inst);
  const pad = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(150, 96, 5)), padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, top + 0.01, MB.D / 2 - 11 - 48);
  mac.add(pad);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 262, 24), hingeMat);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, MB.BT - 0.8, -MB.D / 2 + 3.2);
  mac.add(hinge);
}
const lid = new THREE.Group(); // pivot at hinge
lid.position.set(0, MB.BT + 0.4, -MB.D / 2 + 3.2);
lid.rotation.x = -(MB.open - 90) * DEG;
mac.add(lid);
{
  const bev = 1.0;
  const g = new THREE.ExtrudeGeometry(rrShape(MB.W - 2 * bev, MB.D - 2 * bev, MB.R - bev), { depth: MB.LT - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 16 });
  g.translate(0, MB.D / 2 + 1.2, -MB.LT + bev);
  lid.add(new THREE.Mesh(g, aluminium));
  const bezel = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(MB.W - 3.4, MB.D - 3.2, MB.R - 1.7), 16), blackGlass);
  bezel.position.set(0, MB.D / 2 + 1.2, 0.03);
  lid.add(bezel);
}
MB.dispY = 1.2 + MB.D - 6.4 - MB.DH / 2; // display centre in lid coords
const macScreenGeo = planarUV(new THREE.ShapeGeometry(rrShape(MB.DW, MB.DH, 2.4), 8), MB.DW, MB.DH);
const macScreenMat = new THREE.MeshBasicMaterial({ toneMapped: false });
const macScreen = new THREE.Mesh(macScreenGeo, macScreenMat);
macScreen.position.set(0, MB.dispY, 0.06);
lid.add(macScreen);
const macDisp = new THREE.Group();
macDisp.position.set(0, MB.dispY, 0.08);
lid.add(macDisp);
{
  // notch ~ 31 x 6.4 mm at the top centre of the panel, rounded lower corners
  const nw = 31, nh = 6.4, nr = 2.2;
  const s = new THREE.Shape();
  s.moveTo(-nw / 2, nh);
  s.lineTo(-nw / 2, nr);
  s.quadraticCurveTo(-nw / 2, 0, -nw / 2 + nr, 0);
  s.lineTo(nw / 2 - nr, 0);
  s.quadraticCurveTo(nw / 2, 0, nw / 2, nr);
  s.lineTo(nw / 2, nh);
  const notch = new THREE.Mesh(new THREE.ShapeGeometry(s, 8), pureBlack);
  notch.position.set(0, MB.DH / 2 - nh + 0.01, 0.4);
  macDisp.add(notch);
  const cam = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), new THREE.MeshPhysicalMaterial({ color: 0x10131c, roughness: 0.05, clearcoat: 1 }));
  cam.position.set(0, MB.DH / 2 - 3.1, 0.45);
  macDisp.add(cam);
  const sh = new THREE.Mesh(macScreenGeo, sheen);
  sh.position.z = 0.9;
  sh.renderOrder = 20;
  macDisp.add(sh);
}
world.add(mac);

// contact shadows
const phoneShadow = new THREE.Mesh(new THREE.PlaneGeometry(130, 46), new THREE.MeshBasicMaterial({ map: softShadowTex(520, 184, 70, 22), transparent: true, depthWrite: false, opacity: 0.34 }));
phoneShadow.rotation.x = -Math.PI / 2;
shadowsGroup.add(phoneShadow);
const macShadow = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), new THREE.MeshBasicMaterial({ map: softShadowTex(800, 600, 60, 34), transparent: true, depthWrite: false, opacity: 0.3 }));
macShadow.rotation.x = -Math.PI / 2;
shadowsGroup.add(macShadow);

// floor reflection fade (multiplies what was drawn by (1-a))
const fadeMat = new THREE.ShaderMaterial({
  uniforms: { uC: { value: new THREE.Vector2() }, uDir: { value: new THREE.Vector2(0, 1) }, uFront: { value: 10 }, uFade: { value: 200 }, uBase: { value: 0.8 } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec2 uC; uniform vec2 uDir; uniform float uFront; uniform float uFade; uniform float uBase; varying vec3 vW;
    void main(){ float d = dot(vW.xz-uC, uDir) - uFront; float a = mix(uBase, 1.0, smoothstep(0.0, uFade, d)); gl_FragColor = vec4(0.,0.,0.,a); }`,
  transparent: true, depthTest: false, depthWrite: false,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
});
const fadeScene = new THREE.Scene();
const fadePlane = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), fadeMat);
fadePlane.rotation.x = -Math.PI / 2;
fadeScene.add(fadePlane);

// ---------------------------------------------------------------- screen textures
const CAP = "assets/cap/";
let BBOX = {};
const imgs = {};
async function img(p) {
  if (!imgs[p]) imgs[p] = loadImg(CAP + p + ".png");
  return imgs[p];
}
const texCache = new Map(); // key -> {tex, last}
let frameNo = 0;
function cacheTex(key, build) {
  let e = texCache.get(key);
  if (!e) {
    e = { tex: build(), last: frameNo };
    texCache.set(key, e);
    if (texCache.size > 14) {
      let oldK = null, oldL = Infinity;
      for (const [k, v] of texCache) if (k !== key && v.last < oldL && !v.pin) { oldL = v.last; oldK = k; }
      if (oldK) { texCache.get(oldK).tex.dispose(); texCache.delete(oldK); }
    }
  }
  e.last = frameNo;
  return e.tex;
}

// iPhone composite: iOS status bar (54 pt) + capture scaled to fit under it (Dynamic Island never covers UI)
const IPS = { px: 3, sb: 54 };
IPS.s = (852 - IPS.sb) / 852;
IPS.cw = 1179 * IPS.s;
IPS.x0 = (1179 - IPS.cw) / 2;
IPS.y0 = IPS.sb * 3;
const STATUS_TIME = {};
function drawBattery(g, x, y, sc, col) {
  g.save();
  g.translate(x, y);
  g.scale(sc, sc);
  g.strokeStyle = col; g.fillStyle = col; g.globalAlpha = 1;
  // signal bars
  for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(i * 6.2, 10 - i * 3, 4.2, 4 + i * 3, 1.2); g.fill(); }
  // wifi
  g.lineWidth = 2.2; g.lineCap = "round";
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(40, 15, 4 + i * 4.2, -Math.PI * 0.75, -Math.PI * 0.25); g.stroke(); }
  g.beginPath(); g.arc(40, 14.5, 1.6, 0, Math.PI * 2); g.fill();
  // battery
  g.globalAlpha = 0.45; g.lineWidth = 1.3; g.beginPath(); g.roundRect(54, 2.5, 25, 12, 3.8); g.stroke();
  g.beginPath(); g.roundRect(80.2, 6.5, 1.8, 4.2, 1); g.fill();
  g.globalAlpha = 1; g.beginPath(); g.roundRect(56, 4.5, 18, 8, 2.2); g.fill();
  g.restore();
}
function phoneComposite(im, time) {
  const c = mk(1179, 2556), g = c.getContext("2d");
  g.imageSmoothingQuality = "high";
  // status bar ground continues the page's first row; side margins continue the page edges
  g.drawImage(im, 0, 0, 1179, 2, 0, 0, 1179, IPS.y0 + 2);
  g.drawImage(im, 0, 0, 2, 2556, 0, IPS.y0, IPS.x0 + 1, 2556 - IPS.y0);
  g.drawImage(im, 1177, 0, 2, 2556, 1179 - IPS.x0 - 1, IPS.y0, IPS.x0 + 1, 2556 - IPS.y0);
  g.drawImage(im, 0, 0, 1179, 2556, IPS.x0, IPS.y0, IPS.cw, 2556 - IPS.y0);
  // status bar (RTL iOS mirrors it: time on the right ear, indicators on the left)
  const lum = (() => { const d = g.getImageData(600, 40, 1, 1).data; return 0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2]; })();
  const col = lum > 140 ? "#1B2656" : "#FFFFFF";
  g.fillStyle = col;
  g.font = "500 50px Heebo";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(time, 1179 - 66 * 3 - 6, 29.5 * 3 + 2);
  drawBattery(g, 30 * 3 - 12, 21 * 3, 3, col);
  // home indicator
  g.fillStyle = lum > 140 ? "rgba(27,38,86,0.85)" : "rgba(255,255,255,0.9)";
  g.beginPath(); g.roundRect(1179 / 2 - 67 * 3, 2556 - 8 * 3 - 5 * 3, 134 * 3, 5 * 3, 7.5); g.fill();
  return c;
}
function phoneTex(name, time) {
  return cacheTex("ip/" + name, () => canvasTex(phoneComposite(imgs["iphone/" + name].v, time)));
}
// css bbox (pt in the capture) -> display-local mm (centre) and size
function phoneRect(b) {
  const sx = IP.DW / 1179;
  const cx = (IPS.x0 + (b.x + b.w / 2) * 3 * IPS.s) * sx - IP.DW / 2;
  const cy = IP.DH / 2 - (IPS.y0 + (b.y + b.h / 2) * 3 * IPS.s) * sx;
  return { cx, cy, w: b.w * 3 * IPS.s * sx, h: b.h * 3 * IPS.s * sx };
}

// Mac composite: light menu bar (37 pt, notch zone) + capture at 2x shifted down; bottom rows fall off the panel.
const MACS = { mb: 37 };
function macComposite(im, time, extra) {
  const c = mk(3024, 1964), g = c.getContext("2d");
  const top = (MACS.mb + extra) * 2;
  g.drawImage(im, 0, 0, 3024, 2, 0, 0, 3024, top + 2);
  g.drawImage(im, 0, 0, 3024, 1964 - top, 0, top, 3024, 1964 - top);
  // menu bar: translucent white over the page, clock + battery on the left (RTL)
  g.fillStyle = "rgba(255,255,255,0.55)";
  g.fillRect(0, 0, 3024, MACS.mb * 2);
  g.fillStyle = "rgba(27,38,86,0.10)";
  g.fillRect(0, MACS.mb * 2 - 1, 3024, 1);
  g.fillStyle = "#1B2656";
  g.font = "400 27px Heebo";
  g.textAlign = "left";
  g.textBaseline = "middle";
  g.direction = "rtl";
  g.fillText(time, 124, MACS.mb);
  g.direction = "ltr";
  g.save(); g.translate(30, MACS.mb - 12); g.globalAlpha = 0.5; g.strokeStyle = "#1B2656"; g.lineWidth = 2; g.beginPath(); g.roundRect(0, 0, 50, 24, 7); g.stroke();
  g.globalAlpha = 1; g.fillStyle = "#1B2656"; g.beginPath(); g.roundRect(4, 4, 36, 16, 4); g.fill(); g.beginPath(); g.roundRect(52, 8, 4, 8, 2); g.fill(); g.restore();
  return c;
}
const MAC_EXTRA = { "channels-b-booking-no-booking-bar": 14, "channels-b-booking": 14, "channels-c-both-no-airbnb-bar": 14, "channels-c-both": 14 };
function macTex(name, time) {
  return cacheTex("mac/" + name, () => canvasTex(macComposite(imgs["mac/" + name].v, time, MAC_EXTRA[name] || 0)));
}
function macRect(b, extra = 0) {
  const sx = MB.k; // mm per pt
  return { cx: (b.x + b.w / 2) * sx - MB.DW / 2, cy: MB.DH / 2 - (MACS.mb + extra + b.y + b.h / 2) * sx, w: b.w * sx, h: b.h * sx };
}

// iOS lock screen (23:40) + notification banner, drawn in the iOS form
function lockScreen() {
  const c = mk(1179, 2556), g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 1179 * 0.4, 2556);
  gr.addColorStop(0, "#3E2BF1");
  gr.addColorStop(0.55, "#2a2a9e");
  gr.addColorStop(1, "#1B2656");
  g.fillStyle = gr; g.fillRect(0, 0, 1179, 2556);
  const rg = g.createRadialGradient(950, 500, 40, 950, 500, 1100);
  rg.addColorStop(0, "rgba(255,255,255,0.18)"); rg.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rg; g.fillRect(0, 0, 1179, 2556);
  drawBattery(g, 30 * 3 - 12, 21 * 3, 3, "#FFFFFF");
  g.fillStyle = "#FFFFFF"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.direction = "rtl";
  g.font = "500 58px Heebo"; g.globalAlpha = 0.92;
  g.fillText("יום רביעי, 4 בנובמבר", 1179 / 2, 106 * 3);
  g.direction = "ltr"; g.globalAlpha = 1;
  g.font = "500 318px Heebo";
  g.fillText("23:40", 1179 / 2, 212 * 3);
  // flashlight + camera buttons
  const btn = (x, draw) => {
    g.save(); g.fillStyle = "rgba(10,12,30,0.32)"; g.beginPath(); g.arc(x, 2556 - 74 * 3, 25 * 3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#fff"; g.fillStyle = "#fff"; g.lineWidth = 6; g.lineJoin = "round"; g.translate(x, 2556 - 74 * 3); draw(); g.restore();
  };
  btn(46 * 3, () => { g.beginPath(); g.moveTo(-18, -36); g.lineTo(18, -36); g.lineTo(18, -22); g.lineTo(10, -8); g.lineTo(10, 36); g.lineTo(-10, 36); g.lineTo(-10, -8); g.lineTo(-18, -22); g.closePath(); g.stroke(); g.beginPath(); g.arc(0, 8, 4, 0, 7); g.fill(); });
  btn(1179 - 46 * 3, () => { g.beginPath(); g.roundRect(-38, -24, 76, 54, 10); g.stroke(); g.beginPath(); g.roundRect(-14, -34, 28, 12, 4); g.stroke(); g.beginPath(); g.arc(0, 3, 14, 0, 7); g.stroke(); });
  g.fillStyle = "rgba(255,255,255,0.92)"; g.beginPath(); g.roundRect(1179 / 2 - 67 * 3, 2556 - 13 * 3 - 15, 134 * 3, 15, 7.5); g.fill();
  return c;
}
const BANNER = { w: 361, h: 76 }; // pt
function bannerCanvas() {
  const s = 3, c = mk(BANNER.w * s, BANNER.h * s), g = c.getContext("2d");
  g.fillStyle = "rgba(246,247,251,0.86)";
  g.beginPath(); g.roundRect(0, 0, c.width, c.height, 24 * s); g.fill();
  // avatar (sender initial, no app logo)
  const ax = c.width - (14 + 19) * s, ay = c.height / 2;
  g.fillStyle = "#1B2656"; g.beginPath(); g.arc(ax, ay, 19 * s, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#FFFFFF"; g.font = `500 ${20 * s}px Heebo`; g.textAlign = "center"; g.textBaseline = "middle"; g.direction = "rtl";
  g.fillText("נ", ax, ay + 1.5 * s);
  const tx = c.width - (14 + 38 + 11) * s;
  g.textAlign = "right"; g.textBaseline = "alphabetic"; g.fillStyle = "#1B2656";
  g.font = `500 ${15.5 * s}px Heebo`; g.fillText("נועה", tx, 32 * s);
  g.font = `400 ${15.5 * s}px Heebo`; g.fillText("פנוי בשבת?", tx, 55 * s);
  g.direction = "ltr"; g.textAlign = "left"; g.fillStyle = "rgba(27,38,86,0.55)"; g.font = `400 ${13 * s}px Heebo`;
  g.fillText("23:40", 16 * s, 31 * s);
  return c;
}
function ringCanvas() {
  const c = mk(256, 256), g = c.getContext("2d");
  g.strokeStyle = "#3E2BF1"; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 110, 0, Math.PI * 2); g.stroke();
  return c;
}
function dotCanvas() {
  const c = mk(256, 256), g = c.getContext("2d");
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 120);
  r.addColorStop(0, "rgba(62,43,241,0.55)"); r.addColorStop(0.6, "rgba(62,43,241,0.35)"); r.addColorStop(1, "rgba(62,43,241,0)");
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  return c;
}

// ---------------------------------------------------------------- lift planes
const elemShadowTex = softShadowTex(256, 256, 40, 18);
function makeLift(parent) {
  const grp = new THREE.Group();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: elemShadowTex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false }));
  shadow.renderOrder = 5;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }));
  card.renderOrder = 10;
  grp.add(shadow);
  grp.add(card);
  parent.add(grp);
  return { grp, shadow, card };
}
const phoneLift = makeLift(phoneDisp);
const macLift = makeLift(macDisp);
const macLift2 = makeLift(macDisp); // badge pop
const coverMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }));
coverMesh.renderOrder = 11;
macLift.card.add(coverMesh);
const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(BANNER.w * IP.k, BANNER.h * IP.k), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }));
bannerMesh.renderOrder = 12;
phoneDisp.add(bannerMesh);
const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }));
ring.renderOrder = 15;
phoneDisp.add(ring);
const dot = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false }));
dot.renderOrder = 14;
phoneDisp.add(dot);

function elemTex(path) {
  return cacheTex("el/" + path, () => {
    const t = new THREE.Texture(imgs[path].v);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAX_ANISO; t.needsUpdate = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  });
}
// pose a lift: r = rect (display mm), k = 0..1 lift amount, z = max lift mm, sc = max extra scale
function poseLift(L, tex, r, k, z, sc, op = 1, extra = {}) {
  L.grp.visible = op > 0.002;
  if (!L.grp.visible) return;
  L.card.material.map = tex;
  L.card.material.opacity = op;
  L.card.material.needsUpdate = L.card.material._m !== tex;
  L.card.material._m = tex;
  const s = 1 + sc * k;
  L.grp.position.set(r.cx + (extra.dx || 0), r.cy + (extra.dy || 0), 0.15 + z * k + (extra.dz || 0));
  L.grp.rotation.set(extra.rx || 0, extra.ry || 0, extra.rz || 0);
  L.card.scale.set(r.w * s, r.h * s, 1);
  L.shadow.scale.set(r.w * s * 1.22 + 2, r.h * s * 1.35 + 2, 1);
  L.shadow.position.set(0, -z * k * 0.22 - 0.5, -z * k * 0.98 - 0.02);
  L.shadow.material.opacity = 0.32 * Math.min(1, k * 1.5) * op;
}

// ---------------------------------------------------------------- shots
// display point (pt in capture) -> world, via the device's display group
const tmpV = new THREE.Vector3(), tmpN = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
function camFrame(dispGroup, rectFn, pt, ppm, fy, yaw, pitch, fx = 540) {
  // pt: [x,y] in capture pt; ppm: screen px per mm at the point; fy/fx: where the point sits in frame
  const r = rectFn({ x: pt[0], y: pt[1], w: 0, h: 0 });
  dispGroup.updateWorldMatrix(true, false);
  const P = new THREE.Vector3(r.cx, r.cy, 0).applyMatrix4(dispGroup.matrixWorld);
  dispGroup.getWorldQuaternion(tmpQ);
  const n = new THREE.Vector3(0, 0, 1).applyQuaternion(tmpQ);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(tmpQ);
  const right = new THREE.Vector3().crossVectors(up, n).normalize();
  // orbit the view direction around the display: yaw about display-up, pitch about display-right
  const dir = n.clone().applyAxisAngle(up, yaw * DEG).applyAxisAngle(right, -pitch * DEG).normalize();
  const D = H / (ppm * 2 * TANH);
  camera.position.copy(P).addScaledVector(dir, D);
  // shift the aim so P lands at (fx, fy) in frame
  const camUp = new THREE.Vector3(0, 1, 0);
  const camRight = new THREE.Vector3().crossVectors(dir.clone().negate(), camUp).normalize();
  camUp.crossVectors(camRight, dir.clone().negate()).normalize();
  const target = P.clone().addScaledVector(camUp, (fy - H / 2) / ppm).addScaledVector(camRight, -(fx - W / 2) / ppm);
  camera.up.set(0, 1, 0);
  camera.lookAt(target);
}
function lerpArr(a, b, k) { return a.map((v, i) => lerp(v, b[i], k)); }

const SHOTS = [
  // t0, t1, device, from{pt,ppm,fy,yaw,pitch}, to{...}, ease. pt = capture point (pt) placed at frame (540, fy) at ppm px/mm
  { t0: 5.0, t1: 6.0, dev: "phone", a: { pt: [196, 430], ppm: 8.4, fy: 990, yaw: -16, pitch: 4 }, b: { pt: [196, 570], ppm: 9.0, fy: 1010, yaw: -7, pitch: 2 }, ease: "power2.inOut" },
  { t0: 6.0, t1: 7.5, dev: "phone", a: { pt: [130, 330], ppm: 9.6, fy: 1160, yaw: 12, pitch: 3 }, b: { pt: [100, 340], ppm: 10.8, fy: 1250, yaw: 6, pitch: 1 }, ease: "power2.out" },
  { t0: 7.5, t1: 8.5, dev: "phone", a: { pt: [196, 560], ppm: 8.6, fy: 1400, yaw: -10, pitch: 5 }, b: { pt: [196, 640], ppm: 9.2, fy: 1590, yaw: -3, pitch: 2 }, ease: "power2.out" },
  { t0: 8.5, t1: 12.0, dev: "mac", a: { pt: [760, 860], ppm: 6.3, fy: 1730, yaw: 12, pitch: 13 }, b: { pt: [720, 870], ppm: 6.7, fy: 1800, yaw: 4, pitch: 11 }, ease: "power1.inOut" },
  { t0: 12.0, t1: 16.0, dev: "phone", a: { pt: [196, 470], ppm: 8.6, fy: 1270, yaw: 9, pitch: 3 }, b: { pt: [196, 500], ppm: 8.9, fy: 1330, yaw: -4, pitch: 2 }, ease: "power1.inOut" },
  { t0: 16.0, t1: 17.5, dev: "mac", a: { pt: [860, 660], ppm: 3.9, fy: 1130, yaw: -12, pitch: 7 }, b: { pt: [860, 680], ppm: 4.4, fy: 1180, yaw: -6, pitch: 5 }, ease: "power2.out" },
  { t0: 17.5, t1: 18.5, dev: "mac", a: { pt: [620, 380], ppm: 3.7, fy: 1020, yaw: 10, pitch: 6 }, b: { pt: [620, 380], ppm: 4.1, fy: 1040, yaw: 5, pitch: 4 }, ease: "power2.out" },
  { t0: 18.5, t1: 20.7, dev: "phone", a: { pt: [196, 520], ppm: 9.0, fy: 1380, yaw: -11, pitch: 4 }, b: { pt: [150, 560], ppm: 10.2, fy: 1560, yaw: -3, pitch: 2 }, ease: "power2.out" },
];

// screen state per time (phone / mac)
const PHONE_STATES = [
  [5.0, "lock"], [6.0, "calendar-full"], [6.18, "calendar-slot-empty"], [7.5, "lead-saved-toast"], [7.62, "lead-saved-toast-slot-empty"],
  [12.0, "today-message-ready-full"], [13.02, "today-welcome-row-slot-empty"], [13.5, "today-message-ready-full"], [13.5, "whatsapp-composer-full"], [13.56, "whatsapp-composer-text-slot-empty"], [14.05, "whatsapp-composer-full"],
  [14.5, "whatsapp-sent-toast"], [15.0, "messages-welcome-sent"], [15.04, "messages-welcome-sent-slot-empty"],
  [18.5, "receipts-before"], [18.66, "receipts-before-status-slot-empty"], [19.62, "receipts-after"],
];
const PHONE_TIME = { lock: "23:40", "calendar-full": "23:40", "calendar-slot-empty": "23:40", "lead-saved-toast": "23:41", "lead-saved-toast-slot-empty": "23:41", "receipts-before": "20:00", "receipts-before-status-slot-empty": "20:00", "receipts-after": "20:00" };
const MAC_STATES = [
  [8.5, "channels-b-booking-no-booking-bar"], [9.5, "channels-b-booking"], [9.98, "channels-c-both-no-airbnb-bar"], [10.5, "channels-c-both"],
  [16.0, "today-income-chart-slot-empty"], [17.5, "report-full"], [17.66, "report-kpis-slot-empty"],
];
const MAC_TIME = { "channels-b-booking-no-booking-bar": "יום ד׳ 23:40", "channels-b-booking": "יום ד׳ 23:40", "channels-c-both-no-airbnb-bar": "יום ד׳ 23:40", "channels-c-both": "יום ד׳ 23:40" };
function stateAt(list, t) {
  let s = null;
  for (const [a, n] of list) if (t >= a) s = n;
  return s;
}

// ---------------------------------------------------------------- per-frame
let lockTex = null, bannerTex = null, ringTex = null, dotTex = null, coverTex = null;
function bb(p) { return BBOX[p]; }

function render3d(t) {
  frameNo++;
  const shot = SHOTS.find((s) => t >= s.t0 && t < s.t1);
  renderer.setRenderTarget(null);
  renderer.clear(true, true, true);
  if (!shot) return;
  phone.visible = shot.dev === "phone";
  mac.visible = shot.dev === "mac";
  phoneShadow.visible = phone.visible;
  macShadow.visible = mac.visible;
  phone.position.set(0, 0, 0); phone.rotation.set(0, 0, 0);
  mac.position.set(2000, 0, 0); mac.rotation.set(0, 0, 0);
  phoneLift.grp.visible = false; macLift.grp.visible = false; macLift2.grp.visible = false;
  bannerMesh.visible = false; ring.visible = false; dot.visible = false; coverMesh.visible = false;

  const k = E(shot.ease)(clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1));
  const P = {};
  for (const f of ["ppm", "fy", "yaw", "pitch"]) P[f] = lerp(shot.a[f], shot.b[f], k);
  P.pt = lerpArr(shot.a.pt, shot.b.pt, k);
  // gentle hand-held drift so nothing is ever frozen
  P.yaw += 0.6 * Math.sin(t * 0.8);
  P.pitch += 0.4 * Math.sin(t * 0.63 + 1);

  let devOffY = 0, devRotZ = 0, devRotX = 0;
  if (shot.dev === "phone") {
    const st = stateAt(PHONE_STATES, t);
    const time = PHONE_TIME[st] || "15:00";
    phoneScreenMat.map = st === "lock" ? lockTex : phoneTex(st, time);
    phoneScreenMat.needsUpdate = phoneScreenMat._m !== phoneScreenMat.map;
    phoneScreenMat._m = phoneScreenMat.map;
    camFrame(phoneDisp, phoneRect, P.pt, P.ppm, P.fy, P.yaw, P.pitch);
    // entrances / exits of the device itself
    if (t >= 12.0 && t < 13.3) { const e = prog(t, 12.62, 13.12, "power3.out"); devOffY = -330 * (1 - e); devRotX = 8 * (1 - e) * DEG; }
    if (t >= 19.9) { const e = prog(t, 19.95, 20.6, "power3.in"); devOffY = -380 * e; devRotZ = -10 * e * DEG; devRotX = 6 * e * DEG; }
    if (t >= 5.0 && t < 5.5) { const e = prog(t, 5.0, 5.5, "power3.out"); devOffY = -26 * (1 - e); }
    phone.position.y = devOffY;
    phone.rotation.set(devRotX, 0, devRotZ);
    phoneShadow.position.set(0, 0.2, 0);
    phoneShadow.material.opacity = 0.34 * clamp(1 - Math.abs(devOffY) / 60, 0, 1);
    phoneScene(t);
  } else {
    mac.position.set(0, 0, 0);
    const st = stateAt(MAC_STATES, t);
    const time = MAC_TIME[st] || (t > 17.4 ? "יום ב׳ 20:00" : "יום ב׳ 20:00");
    macScreenMat.map = macTex(st, time);
    macScreenMat.needsUpdate = macScreenMat._m !== macScreenMat.map;
    macScreenMat._m = macScreenMat.map;
    const extra = MAC_EXTRA[st] || 0;
    camFrame(macDisp, (b) => macRect(b, extra), P.pt, P.ppm, P.fy, P.yaw, P.pitch);
    macShadow.position.set(0, 0.2, 0);
    macShadow.material.opacity = 0.3;
    macScene(t);
  }
  camera.updateMatrixWorld();

  // pass 1: floor reflection (mirror world about y = 0), faded with distance from the device
  const reflect = Math.abs(devOffY) < 1;
  if (reflect) {
    world.scale.y = -1;
    shadowsGroup.visible = false;
    world.updateMatrixWorld(true);
    renderer.render(scene, camera);
    const dev = phone.visible ? phone : mac;
    const c = new THREE.Vector3();
    dev.getWorldPosition(c);
    const toCam = new THREE.Vector2(camera.position.x - c.x, camera.position.z - c.z).normalize();
    fadeMat.uniforms.uC.value.set(c.x, c.z);
    fadeMat.uniforms.uDir.value.copy(toCam);
    fadeMat.uniforms.uFront.value = phone.visible ? IP.D / 2 : MB.D / 2;
    fadeMat.uniforms.uFade.value = phone.visible ? 70 : 120;
    fadeMat.uniforms.uBase.value = phone.visible ? 0.84 : 0.88;
    renderer.render(fadeScene, camera);
    world.scale.y = 1;
    shadowsGroup.visible = true;
    world.updateMatrixWorld(true);
    renderer.clearDepth();
  }
  renderer.render(scene, camera);
}

function phoneScene(t) {
  // Scene 3a: lock screen banner
  if (t < 6.0) {
    const e = prog(t, 5.22, 5.62, "back.out(1.6)");
    const o = prog(t, 5.22, 5.42);
    bannerMesh.visible = true;
    bannerMesh.material.map = bannerTex; bannerMesh.material.opacity = o;
    const y0 = IP.DH / 2 - (650 + BANNER.h / 2) * IP.k;
    bannerMesh.position.set(0, y0 + 10 * (1 - e), 0.3 + 4 * (1 - e) + 1.2 * prog(t, 5.62, 6.0));
    const sc = 0.9 + 0.1 * e;
    bannerMesh.scale.set(sc, sc, 1);
  }
  // Scene 3b: Saturday cell lifts
  if (t >= 6.0 && t < 7.5) {
    const b = bb("iphone/el-calendar-saturday");
    const up = prog(t, 6.18, 6.62, "power3.out");
    poseLift(phoneLift, elemTex("iphone/el-calendar-saturday"), phoneRect(b), up, 16, 1.25, 1, { rz: 0, ry: -4 * up * DEG, dz: 0.6 * Math.sin(t * 2.2) * up });
  }
  // Scene 3c: lead-saved toast lifts
  if (t >= 7.5 && t < 8.5) {
    const b = bb("iphone/el-toast-lead-saved");
    const up = prog(t, 7.62, 8.0, "power3.out");
    poseLift(phoneLift, elemTex("iphone/el-toast-lead-saved"), phoneRect(b), up, 14, 0.12, 1, { rx: 5 * up * DEG, dz: 0.5 * Math.sin(t * 2.4) * up });
  }
  // Scene 5: welcome row lifts and settles; composer text lifts; tap; sent bubble lifts
  if (t >= 12.0 && t < 13.5) {
    const b = bb("iphone/el-today-welcome-row");
    const up = prog(t, 13.02, 13.28, "power3.out") * (1 - prog(t, 13.36, 13.5, "power2.in"));
    if (t >= 13.02) poseLift(phoneLift, elemTex("iphone/el-today-welcome-row"), phoneRect(b), up, 13, 0.1, 1);
  }
  if (t >= 13.5 && t < 14.5) {
    const b = bb("iphone/el-whatsapp-welcome-text");
    const up = prog(t, 13.56, 13.86, "power3.out") * (1 - prog(t, 13.9, 14.05, "power2.in"));
    if (t < 14.05) poseLift(phoneLift, elemTex("iphone/el-whatsapp-welcome-text"), phoneRect(b), up, 12, 0.08, 1);
    // one tap on "שליחה בוואטסאפ"
    const tap = phoneRect({ x: 196, y: 821, w: 0, h: 0 });
    const pd = prog(t, 14.0, 14.12) * (1 - prog(t, 14.12, 14.3));
    if (pd > 0) {
      dot.visible = true; dot.material.map = dotTex; dot.material.opacity = pd;
      dot.position.set(tap.cx, tap.cy, 0.4); dot.scale.set(12, 12, 1);
    }
    const rk = prog(t, 14.06, 14.48, "power2.out");
    if (rk > 0 && rk < 1) {
      ring.visible = true; ring.material.map = ringTex; ring.material.opacity = 0.85 * (1 - rk);
      const s = 6 + 26 * rk;
      ring.position.set(tap.cx, tap.cy, 0.45); ring.scale.set(s, s, 1);
    }
  }
  if (t >= 15.0 && t < 16.0) {
    const b = bb("iphone/el-whatsapp-sent-bubble");
    const up = prog(t, 15.04, 15.4, "power3.out");
    poseLift(phoneLift, elemTex("iphone/el-whatsapp-sent-bubble"), phoneRect(b), up, 12, 0.08, 1, { ry: 3 * up * DEG });
  }
  // Scene 6b: receipt status flips טיוטה -> נשלח
  if (t >= 18.5) {
    const bBefore = bb("iphone/el-receipt-status-before"), bAfter = bb("iphone/el-receipt-status-after");
    const up = prog(t, 18.66, 18.98, "power3.out") * (1 - prog(t, 19.42, 19.62, "power2.in"));
    const flip = prog(t, 19.0, 19.32, "power2.inOut");
    const after = flip > 0.5;
    const r = phoneRect(after ? bAfter : bBefore);
    if (t < 19.62) poseLift(phoneLift, elemTex(after ? "iphone/el-receipt-status-after" : "iphone/el-receipt-status-before"), r, up, 14, 1.4, 1, { rx: (after ? flip - 1 : flip) * Math.PI });
  }
}

function macScene(t) {
  // Scene 4: channel bookings fly in and land in their unit row; badge lights on landing
  if (t >= 8.5 && t < 12.0) {
    const legs = [
      { el: "mac/el-booking-bar-b", badge: "mac/el-booking-badge-b", t0: 8.8, t1: 9.5, from: [150, 95, 230, 16] },
      { el: "mac/el-airbnb-bar-c", badge: "mac/el-airbnb-badge-c", t0: 9.8, t1: 10.5, from: [-160, 60, 230, -14] },
    ];
    for (const L of legs) {
      if (t < L.t0 || t >= L.t1 + 0.45) continue;
      const r = macRect(bb(L.el), 14);
      const f = prog(t, L.t0, L.t1, "power2.inOut");
      const inv = 1 - f;
      const op = prog(t, L.t0, L.t0 + 0.12);
      poseLift(macLift, elemTex(L.el), r, 0, 0, 0, op, { dx: L.from[0] * inv, dy: L.from[1] * inv, dz: L.from[2] * inv, rz: L.from[3] * inv * DEG, ry: -10 * inv * DEG });
      macLift.card.scale.set(r.w * (1 + 0.15 * inv), r.h * (1 + 0.15 * inv), 1);
      macLift.shadow.material.opacity = 0.28 * Math.min(1, inv * 3) * op;
      macLift.shadow.position.set(0, -4 * inv - 0.5, -L.from[2] * inv * 0.97 - 0.1);
      // the badge is "unlit" in flight: covered by the bar's own colour, uncovered when it lands
      const rb = macRect(bb(L.badge), 14);
      const cov = 1 - prog(t, L.t1 + 0.02, L.t1 + 0.2);
      coverMesh.visible = cov > 0.002;
      coverMesh.material.map = coverTex; coverMesh.material.opacity = cov;
      coverMesh.position.set((rb.cx - r.cx) / r.w, (rb.cy - r.cy) / r.h, 0.01);
      coverMesh.scale.set((rb.w + 0.5) / r.w, (rb.h + 0.5) / r.h, 1);
      // badge pop
      const pk = prog(t, L.t1 + 0.02, L.t1 + 0.3, "back.out(2.2)");
      const pOp = prog(t, L.t1 + 0.02, L.t1 + 0.12) * (1 - prog(t, L.t1 + 0.32, L.t1 + 0.45));
      if (pOp > 0) poseLift(macLift2, elemTex(L.badge), rb, 1 - pk, 4, 0.6, pOp);
    }
  }
  // Scene 6a: income chart card lifts, bars grow (real 8-step capture of the CSS animation)
  if (t >= 16.0 && t < 17.5) {
    const b = { x: 533.34375, y: 487.5, w: 646.65625, h: 374.5 };
    const up = prog(t, 16.12, 16.5, "power3.out");
    const fi = Math.round(clamp((t - 16.55) / 0.48, 0, 1) * 7);
    poseLift(macLift, elemTex("mac/seq-income-chart-0" + fi), macRect(b), up, 48, 0.1, 1, { ry: -9 * up * DEG, rx: 3 * up * DEG });
  }
  // Scene 6b: KPI row (income / expenses / net) lifts
  if (t >= 17.5 && t < 18.5) {
    const b = bb("mac/el-report-kpis");
    const up = prog(t, 17.66, 18.02, "power3.out");
    poseLift(macLift, elemTex("mac/el-report-kpis"), macRect(b), up, 30, 0.06, 1, { rx: 4 * up * DEG });
  }
}

// ---------------------------------------------------------------- build
(async () => {
  await document.fonts.ready;
  BBOX = BBOX_DATA;
  const names = [];
  for (const [, n] of PHONE_STATES) if (n !== "lock") names.push("iphone/" + n);
  for (const [, n] of MAC_STATES) names.push("mac/" + n);
  for (const k of Object.keys(BBOX)) names.push(k);
  for (let i = 0; i < 8; i++) names.push("mac/seq-income-chart-0" + i);
  await Promise.all([...new Set(names)].map(async (n) => { imgs[n] = { v: await loadImg(CAP + n + ".png") }; }));
  lockTex = canvasTex(lockScreen());
  bannerTex = canvasTex(bannerCanvas());
  ringTex = canvasTex(ringCanvas());
  dotTex = canvasTex(dotCanvas());
  {
    const c = mk(64, 32), g = c.getContext("2d");
    g.fillStyle = "rgb(233,230,254)"; g.beginPath(); g.roundRect(0, 0, 64, 32, 16); g.fill();
    coverTex = canvasTex(c);
  }
  window.__render3d = render3d;
  render3d(window.__lastT || 0);
  readyResolve();
})();
