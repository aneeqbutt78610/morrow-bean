import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Warm, slow-drifting motes behind the hero — a subtle WebGL "atmosphere" tuned
// to the café palette (terracotta / sand / sage) rather than a cold tech look.
// It is purely decorative: pauses when the tab is hidden, resizes with its box,
// respects reduced motion, and fully disposes its GPU resources on unmount.

const PALETTE = [
  [0.78, 0.47, 0.36], // terracotta
  [0.85, 0.78, 0.68], // sand
  [0.61, 0.67, 0.57], // sage
];

function makeSpriteTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export function HeroAtmosphere() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let webgl = true;

    const width = mount.clientWidth || 1;
    const height = mount.clientHeight || 1;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      webgl = false;
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 6;

    const COUNT = 70;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    const sway = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
      speeds[i] = 0.0015 + Math.random() * 0.0028;
      sway[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.42,
      map: makeSpriteTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      sizeAttenuation: true,
      blending: THREE.NormalBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    let frame = 0;
    let running = false;
    let onScreen = true;

    const renderOnce = () => renderer.render(scene, camera);

    const tick = (time: number) => {
      if (!running) return;
      for (let i = 0; i < COUNT; i += 1) {
        let y = posAttr.getY(i) + speeds[i] * 60 * 0.016;
        const x = posAttr.getX(i) + Math.sin(time * 0.0002 + sway[i]) * 0.002;
        if (y > 4.2) y = -4.2; // wrap to the bottom
        posAttr.setY(i, y);
        posAttr.setX(i, x);
      }
      posAttr.needsUpdate = true;
      renderOnce();
      frame = window.requestAnimationFrame(tick);
    };

    // Run only while the hero is on-screen and the tab is visible, so the motes
    // never compete with the rest of the page (or the 3D cup) for frames.
    const sync = () => {
      const shouldRun = !reduced && onScreen && !document.hidden;
      if (shouldRun && !running) {
        running = true;
        frame = window.requestAnimationFrame(tick);
      } else if (!shouldRun && running) {
        running = false;
        window.cancelAnimationFrame(frame);
      }
    };

    renderOnce(); // a static first frame; for reduced motion it's the only one
    sync();

    document.addEventListener('visibilitychange', sync);
    const viewObserver = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        onScreen = entry.isIntersecting;
        sync();
      })
      : null;
    viewObserver?.observe(mount);

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderOnce();
    };
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(mount);

    return () => {
      if (!webgl) return;
      running = false;
      window.cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', sync);
      viewObserver?.disconnect();
      observer?.disconnect();
      geometry.dispose();
      material.map?.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="hero-atmosphere" ref={mountRef} aria-hidden="true" />;
}
