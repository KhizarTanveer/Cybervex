import { useEffect } from 'react';

/**
 * Custom hook for continuously reversible scroll-based blur reveal.
 * - Works symmetrically in BOTH downward and upward scrolling.
 * - Sections blur when exiting the reveal zone and become sharp when entering.
 * - Repeats animation every time the user scrolls away and returns.
 * - Uses native IntersectionObserver without continuous rAF loops.
 * - Respects prefers-reduced-motion: reduce.
 * - Handles React Strict Mode and component unmount cleanly.
 */
export function useScrollReveal(trigger) {
  useEffect(() => {
    // 1. Accessibility: Check for prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    // 2. Feature detection
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    // 3. Mark JS as ready for CSS transitions
    document.documentElement.classList.add('js-reveal-ready');

    const sections = document.querySelectorAll('.reveal-blur-section');
    if (!sections.length) return;

    // 4. Reveal Zone configuration:
    // -60px top margin ensures smooth exit/enter transition right below the navbar
    // -50px bottom margin gives a natural visual lead-in before reaching screen bottom
    // threshold: 0 ensures any intersecting portion of a section keeps it sharp while reading
    const observerOptions = {
      root: null,
      rootMargin: '-60px 0px -50px 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Continuously toggle is-revealed based on live intersection state
        entry.target.classList.toggle('is-revealed', entry.isIntersecting);
      });
    }, observerOptions);

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, [trigger]);
}
