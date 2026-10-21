## Task: Rebuild the homepage hero coffee animation with real, smooth lazy loading

Rework `src/components/motion/HeroCoffee.tsx` (and how `src/pages/Home.tsx` loads it) so the hero video loads lazily, starts smoothly, and never hurts first paint. Keep everything in strict TypeScript. Do not use `any`; the ESLint rule for it is set to `error`.

### Read first
- `CLAUDE.md`, especially the "Hero media / motion" section
- `src/components/motion/HeroCoffee.tsx`, `src/pages/Home.tsx`, `src/components/motion/HeroAtmosphere.tsx`
- `index.html`, for how the poster is currently preloaded, if at all

### Constraints that must not change
- `public/hero-coffee-poster.jpg` stays the LCP element and the reduced-motion/no-autoplay still. Keep both filenames the same.
- The video plays **once** and holds on the final cup. Do not add `loop`.
- Do not use the `autoplay` attribute. Start playback from an effect with `muted` and `playsInline`, and only when motion is allowed.
- Pause when the tab is hidden. Resume only if the video hasn't finished yet.
- Leave `HeroAtmosphere.tsx` (Three.js motes) working. It may be lazy-loaded too, but it must not block the hero.

### Required behaviour

1. **Instant, stable first paint**
   - Render the poster as a real `<img>` with explicit `width`/`height` (or a CSS `aspect-ratio`), `fetchpriority="high"`, and `decoding="async"`. There must be zero layout shift when the video replaces it.
   - Add `<link rel="preload" as="image" href="/hero-coffee-poster.jpg" fetchpriority="high">` in `index.html` if it isn't there already.

2. **Lazy loading that actually defers the download**
   - Code-split the video component with `React.lazy` + `Suspense`, using the poster as the fallback, so its JS isn't in the main chunk.
   - Don't attach the video `src` until all of these are true: the page has painted (`requestIdleCallback`, with a `setTimeout` fallback), the hero is in or near the viewport (`IntersectionObserver`, `rootMargin: "200px"`), and the user allows motion.
   - Use `preload="none"` until the conditions are met, then set the source and call `load()`.
   - Skip the video entirely (poster only) when `prefers-reduced-motion: reduce` is on, when `navigator.connection?.saveData` is true, or when `effectiveType` is `"2g"`/`"slow-2g"`. Type `navigator.connection` properly with a small interface, not `any`.

3. **Smooth poster-to-video handoff**
   - Keep the poster on screen until the video can play through (`canplaythrough`, or the first `requestVideoFrameCallback` where supported). Then crossfade (`opacity`, about 400–600 ms, GPU-friendly `will-change: opacity`) from poster to video. No flash of a black or empty frame.
   - If `play()` rejects (autoplay blocked) or the video errors, stay on the poster silently. Never show a broken player.
   - When playback ends, hold on the final frame. Since the poster is the final frame, the end state must be visually identical.

4. **Performance and cleanup**
   - Disconnect the observer, cancel idle callbacks, remove listeners, and pause the video on unmount.
   - No re-renders on every frame. Track state with a small typed state machine, e.g. `type HeroState = "poster" | "loading" | "ready" | "playing" | "ended" | "fallback"`.
   - Extract reusable logic into typed hooks, e.g. `usePrefersReducedMotion()`, `useInView(ref, options)`, `useCanLoadHeavyMedia()`.
   - Optional: if adding a `public/hero-coffee.webm`, use `<source>` elements with WebM first and MP4 as the fallback.

### Tests (Vitest + jsdom, colocated `*.test.tsx`)
Mock `IntersectionObserver`, `matchMedia`, `HTMLMediaElement.prototype.play`/`pause`/`load`, and `navigator.connection`. Cover these cases:
- The poster renders immediately, and the video has no `src` before it is in view.
- The video source is set only after it is in view and idle.
- Reduced motion, `saveData`, and slow connections each keep poster-only with no video request.
- A `play()` rejection falls back to the poster.
- Hiding the tab pauses the video, and showing it resumes only if it hasn't ended.
- Unmounting cleans up the observer and listeners.

### Done when
- `npm run test:all` passes (tests, typecheck, lint, build).
- In the build output the hero video code is in a separate chunk.
- In DevTools (Network panel, throttled to "Fast 4G"), `hero-coffee.mp4` is not requested before first paint, and the poster is still reported as the LCP element.
- Update the "Hero media / motion" section of `CLAUDE.md` to describe the new loading flow.