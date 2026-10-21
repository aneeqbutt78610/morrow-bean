import * as THREE from 'three';

// Procedural building blocks for the 3D hero cup — modelled on the brand photo:
// a glossy white cappuccino cup (handle right) of caramel crema with a white
// rosetta-heart, resting on a loose mound of roasted beans. No GLB to fetch.
//
// Units: the cup is ~3.4 wide and ~1.6 tall, sitting with its base at y = CUP_LIFT.

/** Deterministic PRNG (mulberry32) so the bean mound — and so the poster — is identical on every load. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The cup rests on the beans, not the table. */
export const CUP_LIFT = 0.12;
/** Vertical stretch of the profile below — the photo's cup is deeper than it is wide-looking. */
const H = 1.22;
/** Crema surface height (cup-local) and radius — just inside the inner wall. */
export const CREMA_Y = 1.45 * H;
export const CREMA_RADIUS = 1.52;

/**
 * Walled cappuccino-cup profile, revolved by LatheGeometry: up the outer face,
 * a rolled rim, back down the inner wall to a concave floor — real wall thickness.
 */
export function cupProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.82, 0),
    new THREE.Vector2(0.98, 0.04 * H),
    new THREE.Vector2(1.36, 0.26 * H),
    new THREE.Vector2(1.56, 0.78 * H),
    new THREE.Vector2(1.66, 1.38 * H),
    new THREE.Vector2(1.7, 1.6 * H),
    new THREE.Vector2(1.67, 1.66 * H), // rolled outer lip
    new THREE.Vector2(1.6, 1.66 * H),
    new THREE.Vector2(1.56, 1.58 * H), // over the rim
    new THREE.Vector2(1.5, 1.1 * H),
    new THREE.Vector2(1.32, 0.5 * H),
    new THREE.Vector2(1.02, 0.26 * H),
    new THREE.Vector2(0, 0.22 * H), // concave interior floor
  ];
}

/** Rounded loop handle on the cup's right (+x), meeting the wall top and bottom. */
export function handleCurve(): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.55, 1.62, 0),
    new THREE.Vector3(1.95, 1.7, 0),
    new THREE.Vector3(2.3, 1.48, 0),
    new THREE.Vector3(2.36, 1.08, 0),
    new THREE.Vector3(2.12, 0.74, 0),
    new THREE.Vector3(1.75, 0.66, 0),
    new THREE.Vector3(1.38, 0.72, 0),
  ]);
}

/**
 * One roasted bean: a flattened ellipsoid with an S-curved crease down its flat
 * face. Length runs along z; the creased face points +y.
 */
export function createBeanGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 22, 16);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const halfLength = 0.25;
  for (let i = 0; i < pos.count; i += 1) {
    let x = pos.getX(i) * 0.175;
    let y = pos.getY(i) * 0.13;
    const z = pos.getZ(i) * halfLength;
    if (y > 0) {
      // Flatter crease side, with a groove that wanders slightly (an S-curve).
      y *= 0.62;
      const along = z / halfLength;
      const centre = Math.sin(along * Math.PI) * 0.022;
      const groove = Math.exp(-(((x - centre) / 0.03) ** 2)) * 0.05 * (1 - along * along);
      y -= groove;
    }
    x *= 1 - Math.abs(z / halfLength) * 0.08; // slightly tapered ends
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

export interface BeanPlacement {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  /** Per-bean roast shade multiplier. */
  shade: number;
}

/**
 * Seeded bean mound: a loose ring around and under the cup, heavier toward the
 * front-left as in the photo, with a second layer piled near the cup.
 */
export function layoutBeans(count: number, seed = 7): BeanPlacement[] {
  const rand = createRng(seed);
  const placed: BeanPlacement[] = [];
  const minGap = 0.31;
  let attempts = 0;
  while (placed.length < count && attempts < count * 60) {
    attempts += 1;
    const angle = rand() * Math.PI * 2;
    // Bias the spread toward the camera (+z) and slightly left.
    const frontness = Math.cos(angle - Math.PI * 0.58) * 0.5 + 0.5;
    const radius = 0.95 + Math.pow(rand(), 1.15) * (0.95 + frontness * 1.05);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.9;
    // Pile up toward the cup so it sits *in* the beans, not on a ring of them.
    const roll = rand();
    const layer = radius < 1.55 && roll < 0.3 ? 2 : radius < 2.0 && roll < 0.65 ? 1 : 0;
    const y = 0.09 + layer * 0.15 + rand() * 0.03;
    const clash = placed.some((b) => Math.abs(b.position.y - y) < 0.1 && Math.hypot(b.position.x - x, b.position.z - z) < minGap);
    if (clash) continue;
    const flipped = rand() < 0.45; // rounded back up instead of the crease
    placed.push({
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler((rand() - 0.5) * 0.6, rand() * Math.PI * 2, (flipped ? Math.PI : 0) + (rand() - 0.5) * 0.5),
      scale: 0.9 + rand() * 0.22,
      shade: 0.72 + rand() * 0.38,
    });
  }
  return placed;
}

// --- Crema + latte-art texture -------------------------------------------------

function heartPath(ctx: CanvasRenderingContext2D, cx: number, bottom: number, w: number, h: number): void {
  // A rosetta-heart whose point sits at `bottom` and whose lobes rise to bottom - h.
  const top = bottom - h;
  ctx.beginPath();
  ctx.moveTo(cx, bottom);
  ctx.bezierCurveTo(cx - w * 0.12, bottom - h * 0.3, cx - w, bottom - h * 0.5, cx - w, top + h * 0.3);
  ctx.bezierCurveTo(cx - w, top - h * 0.02, cx - w * 0.36, top - h * 0.06, cx, top + h * 0.2);
  ctx.bezierCurveTo(cx + w * 0.36, top - h * 0.06, cx + w, top - h * 0.02, cx + w, top + h * 0.3);
  ctx.bezierCurveTo(cx + w, bottom - h * 0.5, cx + w * 0.12, bottom - h * 0.3, cx, bottom);
  ctx.closePath();
}

/**
 * Crema with a white rosetta-heart, drawn on a 1024² canvas. The canvas top maps
 * to the cup's far rim, so the heart's lobes sit away from the camera and its
 * point faces the viewer, as in the photo.
 */
export function createCremaTexture(size = 1024): THREE.CanvasTexture {
  const crema = document.createElement('canvas');
  crema.width = crema.height = size;
  const base = crema.getContext('2d');
  const c = size / 2;
  const rand = createRng(11);
  if (base) {
    const g = base.createRadialGradient(c, c * 0.95, size * 0.04, c, c, c);
    g.addColorStop(0, '#c98e55');
    g.addColorStop(0.45, '#b77b44');
    g.addColorStop(0.78, '#955a30');
    g.addColorStop(0.92, '#6e3e20');
    g.addColorStop(1, '#4f2a14');
    base.fillStyle = g;
    base.fillRect(0, 0, size, size);
    // Microfoam speckle.
    for (let i = 0; i < 2600; i += 1) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * c * 0.98;
      const dark = rand() > 0.45;
      base.fillStyle = dark ? `rgba(92,52,24,${0.06 + rand() * 0.16})` : `rgba(232,200,152,${0.05 + rand() * 0.14})`;
      base.beginPath();
      base.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 0.8 + rand() * 2.4, 0, Math.PI * 2);
      base.fill();
    }
  }

  // Latte art on its own layer so it can be softened like real foam edges.
  const art = document.createElement('canvas');
  art.width = art.height = size;
  const ctx = art.getContext('2d');
  if (ctx) {
    const s = size / 1024;
    const foam = '#f5ecdc';
    const cremaFill = ctx.createPattern(crema, 'no-repeat');
    const bottom = 850 * s;
    // Nested heart bands, alternating foam / crema, all sharing the bottom point.
    const bands = 9;
    for (let k = 0; k < bands; k += 1) {
      const t = k / bands;
      heartPath(ctx, c, bottom, (395 - t * 300) * s, (640 - t * 380) * s);
      ctx.fillStyle = k % 2 === 0 ? foam : (cremaFill ?? '#c48850');
      ctx.fill();
    }
    // The pull-through stem down the centre.
    ctx.strokeStyle = foam;
    ctx.lineCap = 'round';
    ctx.lineWidth = 9 * s;
    ctx.beginPath();
    ctx.moveTo(c, 250 * s);
    ctx.quadraticCurveTo(c + 6 * s, 500 * s, c, bottom - 4 * s);
    ctx.stroke();
  }

  // Shift each thin row sideways by a couple of low-frequency waves so the bands
  // wobble like a real free pour rather than reading as a crisp logo.
  const poured = document.createElement('canvas');
  poured.width = poured.height = size;
  const pouredCtx = poured.getContext('2d');
  if (pouredCtx) {
    for (let y = 0; y < size; y += 2) {
      const v = y / size;
      const dx = (Math.sin(v * Math.PI * 7) * 5 + Math.sin(v * Math.PI * 19 + 1.3) * 2) * (size / 1024);
      pouredCtx.drawImage(art, 0, y, size, 2, dx, y, size, 2);
    }
  }

  if (base) {
    base.save();
    base.filter = 'blur(2.2px)';
    base.shadowColor = 'rgba(110,64,30,0.35)';
    base.shadowBlur = 12;
    base.drawImage(poured, 0, 0);
    base.restore();
  }

  const texture = new THREE.CanvasTexture(crema);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// --- Steam ----------------------------------------------------------------------

export const steamVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const steamFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uOpacity;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.12 + uSeed;
    float n = noise(vec2(uv.x * 3.0 + uSeed, uv.y * 2.4 - t * 2.0));
    float sway = (n - 0.5) * 0.22 * uv.y + sin(uv.y * 5.0 - t * 3.0 + uSeed) * 0.05 * uv.y;
    float x = uv.x - 0.5 - sway;
    float width = mix(0.04, 0.16, uv.y);
    float column = smoothstep(width, 0.0, abs(x));
    float fade = smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.45, uv.y);
    float detail = noise(vec2(uv.x * 6.0 + uSeed * 3.0, uv.y * 4.0 - t * 3.0));
    // Fade out well before the plane's edges so a wisp never shows a straight cut.
    float edges = smoothstep(0.0, 0.2, uv.x) * smoothstep(1.0, 0.8, uv.x);
    float alpha = column * fade * edges * (0.5 + 0.5 * detail) * uOpacity;
    gl_FragColor = vec4(1.0, 0.985, 0.96, alpha);
  }
`;
