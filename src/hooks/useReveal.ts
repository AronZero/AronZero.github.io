import { useEffect, useRef } from 'react';

/**
 * Adds `is-in` to the element once it scrolls into view, which triggers the
 * `.reveal` / `.fade-up` transitions in motion.css. Lines inside a `.reveal`
 * get a stagger index automatically.
 */
export function useReveal<T extends HTMLElement>(rootMargin = '0px 0px -8% 0px') {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.querySelectorAll<HTMLElement>('.line > span').forEach((line, i) => {
      line.style.setProperty('--i', String(i));
    });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add('is-in');
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return ref;
}
