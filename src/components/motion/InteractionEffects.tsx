import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollToTop } from '../../services/scroll';

export function CursorFollower() {
  const ringRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const finePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;
    let frame = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const magneticButtons = new Set<HTMLElement>();
    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      const target = event.target;
      const activeButton = target instanceof Element ? target.closest<HTMLElement>('.button') : null;
      magneticButtons.forEach((button) => { if (button !== activeButton) { button.style.setProperty('--magnet-x', '0px'); button.style.setProperty('--magnet-y', '0px'); magneticButtons.delete(button); } });
      if (activeButton) {
        const rect = activeButton.getBoundingClientRect();
        const x = (event.clientX - (rect.left + rect.width / 2)) * 0.055;
        const y = (event.clientY - (rect.top + rect.height / 2)) * 0.055;
        activeButton.style.setProperty('--magnet-x', `${Math.max(-4, Math.min(4, x))}px`);
        activeButton.style.setProperty('--magnet-y', `${Math.max(-4, Math.min(4, y))}px`);
        magneticButtons.add(activeButton);
      }
    };
    const tick = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      ring.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      frame = window.requestAnimationFrame(tick);
    };
    const onOver = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('a, button, input, textarea, select, [role="button"]')) ring.classList.add('cursor-follower--hover');
      else ring.classList.remove('cursor-follower--hover');
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    frame = window.requestAnimationFrame(tick);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerover', onOver); window.cancelAnimationFrame(frame); magneticButtons.forEach((button) => { button.style.setProperty('--magnet-x', '0px'); button.style.setProperty('--magnet-y', '0px'); }); };
  }, []);
  return <div className="cursor-follower-root" aria-hidden="true"><span className="cursor-follower" ref={ringRef} /><span className="cursor-follower__dot" ref={dotRef} /></div>;
}

// One reveal style for every page: each page's main blocks fade/rise in as they scroll into view.
const MOTION_SELECTOR = [
  '.section-heading, .featured-grid__item, .menu-card, .visit-detail-card, .story-value-row, .instagram-grid__item, .pairing-banner, .contact-form-wrap, .visit-info > div, .order-line, .checkout-form',
  '.philosophy-section__copy, .coffee-feature-copy, .coffee-feature-photo', // Home
  '.story-closing .container', // Our Story
  '.visit-map-layout > *, .visit-photo-band > div, .visit-social__inner', // Visit Us
  '.contact-intro, .menu-controls, .order-confirmation', // Contact, Menu, Order
].join(', ');

export function PageMotion() {
  const location = useLocation();

  // Lay out the hidden "about to reveal" state *before* the browser paints so
  // elements never flash in fully-opaque and then jump back to hidden. Running
  // this in a layout effect (not a passive effect) is what removes that flicker.
  useLayoutEffect(() => {
    const reducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Replay the page-enter transition on every navigation, not just first load.
    const main = document.querySelector<HTMLElement>('#main-content');
    if (main && !reducedMotion) {
      main.classList.remove('is-entering');
      void main.offsetWidth; // Force reflow so the animation restarts.
      main.classList.add('is-entering');
    }

    if (!main) return;
    const targets = main.querySelectorAll<HTMLElement>(MOTION_SELECTOR);
    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((node) => { node.classList.remove('motion-ready'); node.classList.add('motion-visible'); });
      return;
    }
    targets.forEach((node, index) => {
      node.classList.remove('motion-visible');
      node.classList.add('motion-ready');
      // Stagger within each row of up to four items for a gentle cascade.
      node.style.setProperty('--motion-delay', `${Math.min(index % 4, 3) * 80}ms`);
    });
  }, [location.pathname]);

  // Reveal-on-scroll runs as a passive effect after the hidden state is painted.
  useEffect(() => {
    const reducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scrollToTop(true); // jump to top on navigation (Lenis-aware)
    const main = document.querySelector('#main-content');
    if (!main || reducedMotion || !('IntersectionObserver' in window)) return;
    const targets = main.querySelectorAll<HTMLElement>(MOTION_SELECTOR);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [location.pathname]);

  return null;
}
