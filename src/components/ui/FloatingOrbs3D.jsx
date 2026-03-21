import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

/* ─── FloatingOrbs3D ──────────────────────────────────────────
   Three.js scene with:
   - Floating reflective glass spheres
   - Particle field
   - Animated torus rings
   - Soft point lights with brand colors
   - Mouse parallax interaction
──────────────────────────────────────────────────────────────── */

export default function FloatingOrbs3D({
  className = '',
  style = {},
  orbCount = 6,
  particleCount = 200,
  interactive = true,
}) {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth  || 600;
    const H = el.clientHeight || 400;

    /* ── Renderer ──────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    /* ── Scene & Camera ────────────────────────────────────── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 8);

    /* ── Lights ────────────────────────────────────────────── */
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const tealLight = new THREE.PointLight(0x00D1C1, 3, 20);
    tealLight.position.set(-4, 3, 4);
    scene.add(tealLight);

    const purpleLight = new THREE.PointLight(0x6366f1, 2.5, 18);
    purpleLight.position.set(4, -2, 3);
    scene.add(purpleLight);

    const whiteLight = new THREE.PointLight(0xffffff, 1.5, 15);
    whiteLight.position.set(0, 5, 2);
    scene.add(whiteLight);

    /* ── Glass Material helper ─────────────────────────────── */
    function makeGlassMaterial(color) {
      return new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.05,
        roughness: 0.05,
        transmission: 0.92,
        thickness: 0.6,
        ior: 1.45,
        reflectivity: 0.95,
        transparent: true,
        opacity: 0.88,
        envMapIntensity: 1,
      });
    }

    /* ── Orbs ──────────────────────────────────────────────── */
    const orbColors = [0x00D1C1, 0x6366f1, 0x3b82f6, 0xf59e0b, 0xec4899, 0x10b981];
    const orbs = [];

    for (let i = 0; i < orbCount; i++) {
      const radius = 0.3 + Math.random() * 0.55;
      const geo = new THREE.SphereGeometry(radius, 64, 64);
      const mat = makeGlassMaterial(orbColors[i % orbColors.length]);
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.set(
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3 - 1,
      );

      // Random oscillation params
      mesh.userData = {
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3,
        speedZ: (Math.random() - 0.5) * 0.2,
        originX: mesh.position.x,
        originY: mesh.position.y,
        originZ: mesh.position.z,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
      };

      scene.add(mesh);
      orbs.push(mesh);
    }

    /* ── Torus Rings ───────────────────────────────────────── */
    const torusColors = [0x00D1C1, 0x6366f1];
    const toruses = [];

    for (let i = 0; i < 2; i++) {
      const geo = new THREE.TorusGeometry(1.2 + i * 0.6, 0.04 - i * 0.01, 16, 120);
      const mat = new THREE.MeshStandardMaterial({
        color: torusColors[i],
        emissive: torusColors[i],
        emissiveIntensity: 0.4,
        metalness: 0.8,
        roughness: 0.1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(i === 0 ? -2 : 2.5, i === 0 ? 0.5 : -0.5, -2);
      mesh.rotation.set(Math.PI / 4, 0, i * Math.PI / 3);
      mesh.userData = { rotSpeed: 0.003 + i * 0.002, axis: new THREE.Vector3(0.3, 1, 0.5).normalize() };
      scene.add(mesh);
      toruses.push(mesh);
    }

    /* ── Particle Field ────────────────────────────────────── */
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);
    const particleData = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;

      const t = Math.random();
      pColors[i * 3]     = t < 0.5 ? 0.0  : 0.388;
      pColors[i * 3 + 1] = t < 0.5 ? 0.82 : 0.400;
      pColors[i * 3 + 2] = t < 0.5 ? 0.76 : 0.965;

      particleData.push({
        vy: (Math.random() - 0.5) * 0.004,
        vx: (Math.random() - 0.5) * 0.003,
      });
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ── Mouse interaction ─────────────────────────────────── */
    const onMouseMove = (e) => {
      if (!interactive) return;
      const rect = el.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      mouseRef.current.y = -((e.clientY - rect.top)  / rect.height - 0.5) * 2;
    };
    if (interactive) el.addEventListener('mousemove', onMouseMove);

    /* ── Resize handler ─────────────────────────────────────── */
    const onResize = () => {
      const nW = el.clientWidth;
      const nH = el.clientHeight;
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();
      renderer.setSize(nW, nH);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    /* ── Animation loop ─────────────────────────────────────── */
    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.01;

      // Orb floating
      orbs.forEach((orb) => {
        const d = orb.userData;
        orb.position.x = d.originX + Math.sin(t * 0.6 + d.phase) * 0.5;
        orb.position.y = d.originY + Math.cos(t * 0.5 + d.phase) * 0.4;
        orb.position.z = d.originZ + Math.sin(t * 0.4 + d.phase) * 0.2;
        orb.rotation.y += d.rotSpeed;
        orb.rotation.x += d.rotSpeed * 0.5;
      });

      // Torus rotation
      toruses.forEach((tor) => {
        tor.rotateOnAxis(tor.userData.axis, tor.userData.rotSpeed);
      });

      // Particle drift
      const pos = pGeo.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        pos[i * 3]     += particleData[i].vx;
        pos[i * 3 + 1] += particleData[i].vy;
        if (pos[i * 3 + 1] > 5)  pos[i * 3 + 1] = -5;
        if (pos[i * 3 + 1] < -5) pos[i * 3 + 1] = 5;
        if (pos[i * 3]     > 7)  pos[i * 3]     = -7;
        if (pos[i * 3]     < -7) pos[i * 3]     = 7;
      }
      pGeo.attributes.position.needsUpdate = true;

      // Camera parallax
      camera.position.x += (mouseRef.current.x * 0.3 - camera.position.x) * 0.05;
      camera.position.y += (mouseRef.current.y * 0.2 - camera.position.y) * 0.05;

      // Light animation
      tealLight.position.x = -4 + Math.sin(t * 0.7) * 2;
      purpleLight.position.y = -2 + Math.cos(t * 0.5) * 2;

      renderer.render(scene, camera);
    };
    animate();

    /* ── Cleanup ────────────────────────────────────────────── */
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      if (interactive) el.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [orbCount, particleCount, interactive]);

  return (
    <div
      ref={mountRef}
      className={className}
      style={{ ...style, position: 'relative', overflow: 'hidden' }}
    />
  );
}
