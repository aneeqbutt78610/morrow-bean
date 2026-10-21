import { useEffect, useState, type RefObject } from 'react';

export interface UseInViewOptions {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
  /** Stop observing after the element first enters the view. */
  once?: boolean;
}

/**
 * Whether `ref`'s element intersects the viewport (or `root`). Without
 * IntersectionObserver support it reports `true`, so content still loads.
 */
export function useInView(ref: RefObject<Element>, options: UseInViewOptions = {}): boolean {
  const { root = null, rootMargin = '0px', threshold = 0, once = false } = options;
  const [inView, setInView] = useState(false);
  // Key the threshold by value so a fresh array literal each render doesn't
  // tear down and rebuild the observer.
  const thresholdKey = Array.isArray(threshold) ? threshold.join(',') : String(threshold);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { root, rootMargin, threshold: thresholdKey.split(',').map(Number) },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, root, rootMargin, thresholdKey, once]);

  return inView;
}
