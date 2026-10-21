import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, ContactShadows, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import {
  CREMA_RADIUS,
  CREMA_Y,
  CUP_LIFT,
  createBeanGeometry,
  createCremaTexture,
  cupProfile,
  handleCurve,
  layoutBeans,
  steamFragmentShader,
  steamVertexShader,
} from './heroCoffeeAssets';

// The hero's 3D cappuccino. Loaded lazily by HeroCoffee (the gate) only once the
// page is idle, the hero is near the viewport, and the device can afford it —
// so three / R3F / drei never land in the main bundle.
//
// All motion runs in useFrame with delta time and mutates refs: no React state
// changes per frame. Motion is deliberately "lazy": a slow breath of a float, a
// slow 360° turntable spin, and damped pointer parallax, eased in over the first
// seconds so the canvas fades in over a still identical to the poster.

// Framing. The poster is a 1200×1450 render shown with object-fit: cover, so the
// camera emulates cover on that design aspect: wider boxes narrow the vertical
// FOV (crop top/bottom), narrower boxes keep it (crop the sides) — the poster and
// the live canvas line up at every hero size.
const DESIGN_ASPECT = 1200 / 1450;
const BASE_FOV = 30;
const CAMERA_DISTANCE = 12.4;
const CAMERA_ELEVATION = THREE.MathUtils.degToRad(33);
const LOOK_AT = new THREE.Vector3(0, 0.6, 0);

/** One full, slow turntable revolution of the cup and its bean mound. */
const SPIN_PERIOD_S = 24;
const PARALLAX_MAX = THREE.MathUtils.degToRad(4);
const FLOAT_HEIGHT = 0.04;
const MOTION_EASE_IN_S = 3;

const CERAMIC = '#f4f1ea';
const BEAN = '#3d2417';
const BEAN_COUNT = 115;

function clamp1(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

/** Frame-rate independent exponential smoothing toward `target`. */
function damp(current: number, target: number, lambda: number, delta: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * delta));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function CameraRig() {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera;
  const size = useThree((state) => state.size);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const get = useThree((state) => state.get);
  useLayoutEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const halfFov = THREE.MathUtils.degToRad(BASE_FOV / 2);
    camera.fov = aspect > DESIGN_ASPECT
      ? THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(halfFov) * (DESIGN_ASPECT / aspect)))
      : BASE_FOV;
    camera.position.set(
      0,
      LOOK_AT.y + Math.sin(CAMERA_ELEVATION) * CAMERA_DISTANCE,
      Math.cos(CAMERA_ELEVATION) * CAMERA_DISTANCE,
    );
    camera.lookAt(LOOK_AT);
    camera.updateProjectionMatrix();
    // A resize clears the canvas; if the loop is paused (off-screen / hidden tab)
    // nothing else would redraw it, so draw the current frame right away.
    if (get().frameloop === 'never') gl.render(scene, camera);
  }, [camera, gl, scene, get, size.width, size.height]);
  return null;
}

/** Soft studio light from the upper left, like the photo — no HDRI download. */
function Lighting() {
  return (
    <>
      <hemisphereLight args={['#fff4e4', '#6b5444', 0.45]} />
      <directionalLight position={[-4, 6, 4]} intensity={2.1} color="#fff1dc" />
      <directionalLight position={[4.5, 2.5, 2]} intensity={0.35} color="#ffe2c4" />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#e9dccb']} />
        <Lightformer form="rect" intensity={2.4} color="#fff4e6" position={[-4, 5, 4]} scale={[6, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.9} color="#ffe6cc" position={[5, 2, 2]} scale={[4, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.4} color="#ffffff" position={[0, 6, -3]} scale={3} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.5} color="#d8c6ae" position={[0, -3, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
    </>
  );
}

function Cup() {
  const bodyGeometry = useMemo(() => new THREE.LatheGeometry(cupProfile(), 112), []);
  const handleGeometry = useMemo(() => new THREE.TubeGeometry(handleCurve(), 72, 0.16, 18, false), []);
  const cremaGeometry = useMemo(() => new THREE.CircleGeometry(CREMA_RADIUS, 96), []);
  const cremaTexture = useMemo(() => createCremaTexture(), []);

  useEffect(() => () => {
    bodyGeometry.dispose();
    handleGeometry.dispose();
    cremaGeometry.dispose();
    cremaTexture.dispose();
  }, [bodyGeometry, handleGeometry, cremaGeometry, cremaTexture]);

  return (
    <group position-y={CUP_LIFT}>
      <mesh geometry={bodyGeometry}>
        <meshPhysicalMaterial color={CERAMIC} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={handleGeometry}>
        <meshPhysicalMaterial color={CERAMIC} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={0.55} />
      </mesh>
      <mesh geometry={cremaGeometry} position-y={CREMA_Y} rotation-x={-Math.PI / 2}>
        <meshStandardMaterial map={cremaTexture} roughness={0.55} envMapIntensity={0.4} />
      </mesh>
    </group>
  );
}

/** The bean mound under and around the cup — one draw call. */
function Beans() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => createBeanGeometry(), []);
  const placements = useMemo(() => layoutBeans(BEAN_COUNT), []);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    const dummy = new THREE.Object3D();
    const base = new THREE.Color(BEAN);
    const shaded = new THREE.Color();
    placements.forEach((bean, i) => {
      dummy.position.copy(bean.position);
      dummy.rotation.copy(bean.rotation);
      dummy.scale.setScalar(bean.scale);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
      instanced.setColorAt(i, shaded.copy(base).multiplyScalar(bean.shade));
    });
    instanced.count = placements.length;
    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  }, [placements]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, BEAN_COUNT]} frustumCulled={false}>
      <meshPhysicalMaterial color="#ffffff" roughness={0.42} clearcoat={0.35} clearcoatRoughness={0.4} />
    </instancedMesh>
  );
}

const STEAM_WISPS = [
  { x: -0.38, seed: 0.0, height: 2.3 },
  { x: 0.08, seed: 3.7, height: 2.7 },
  { x: 0.46, seed: 7.9, height: 2.2 },
];

/** A few faint wisps rising and fading above the crema. */
function Steam() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(1.15, 1, 1, 1), []);
  const materials = useMemo(
    () => STEAM_WISPS.map((wisp) => new THREE.ShaderMaterial({
      vertexShader: steamVertexShader,
      fragmentShader: steamFragmentShader,
      uniforms: { uTime: { value: 0 }, uSeed: { value: wisp.seed }, uOpacity: { value: 0.3 } },
      transparent: true,
      depthWrite: false,
    })),
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    for (const material of materials) material.uniforms.uTime.value += dt;
  });

  useEffect(() => () => {
    geometry.dispose();
    materials.forEach((material) => material.dispose());
  }, [geometry, materials]);

  return (
    <>
      {STEAM_WISPS.map((wisp, i) => (
        <Billboard key={wisp.seed} position={[wisp.x, CUP_LIFT + CREMA_Y + 0.25 + wisp.height / 2, 0.1]}>
          <mesh geometry={geometry} material={materials[i]} scale={[1, wisp.height, 1]} />
        </Billboard>
      ))}
    </>
  );
}

/** Idle float + continuous 360° turntable spin + damped, capped pointer parallax. */
function Rig({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const elapsed = useRef(0);
  const spin = useRef(0);
  const parallax = useRef({ yaw: 0, pitch: 0 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = clamp1((event.clientX / Math.max(1, window.innerWidth)) * 2 - 1);
      pointer.current.y = clamp1((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    // Clamp so a resume after the loop was paused doesn't lurch.
    const dt = Math.min(delta, 0.1);
    elapsed.current += dt;
    const t = elapsed.current;
    // Ease the motion in so the first second matches the poster still.
    const amount = smoothstep(0.4, MOTION_EASE_IN_S, t);
    g.position.y = Math.sin(t * 0.6) * FLOAT_HEIGHT * amount;
    // The spin's speed eases in with `amount`, so it starts from rest at the poster pose.
    spin.current = (spin.current + ((Math.PI * 2) / SPIN_PERIOD_S) * amount * dt) % (Math.PI * 2);
    const p = parallax.current;
    p.yaw = damp(p.yaw, pointer.current.x * PARALLAX_MAX * amount, 2.2, dt);
    p.pitch = damp(p.pitch, pointer.current.y * PARALLAX_MAX * 0.5 * amount, 2.2, dt);
    g.rotation.y = spin.current + p.yaw;
    g.rotation.x = p.pitch;
  });

  return <group ref={group}>{children}</group>;
}

/** Calls `onReady` once a frame has actually been rendered (onCreated + one frame). */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current >= 2) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

export interface HeroCoffee3DProps {
  /** Run the render loop (hero on-screen and tab visible); otherwise hold the last frame. */
  active: boolean;
  /** Fired once after the first frame has rendered, to start the crossfade. */
  onFirstFrame: () => void;
}

export default function HeroCoffee3D({ active, onFirstFrame }: HeroCoffee3DProps) {
  const [dprMax, setDprMax] = useState(1.75);
  return (
    <Canvas
      className="hero-coffee__canvas"
      style={{ position: 'absolute', inset: 0 }}
      dpr={[1, dprMax]}
      // Measure layout size, not the transformed box: the hero's entrance animation
      // scales it from 0.96, which would otherwise size the canvas ~4% small.
      resize={{ offsetSize: true }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: BASE_FOV, near: 0.1, far: 60 }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.05;
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDprMax(1)} onIncline={() => setDprMax(1.75)} flipflops={3} onFallback={() => setDprMax(1)} />
      <CameraRig />
      <Lighting />
      <Rig>
        <Cup />
        <Beans />
        <Steam />
      </Rig>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.4} scale={9} blur={2.6} far={1.2} resolution={384} color="#2b211c" />
      <FirstFrame onReady={onFirstFrame} />
    </Canvas>
  );
}
