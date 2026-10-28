import React, { useEffect, useRef, useState } from 'react';
import LiquidFx from './LiquidFx';
import './StatsBar.css';

const DURATION = 1800;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// Show final values immediately when animation is unwanted or unsupported
const skipAnimation = () =>
  typeof window === 'undefined' ||
  !('IntersectionObserver' in window) ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Liquid-glass stats strip; numbers count up each time the bar scrolls into view
export default function StatsBar({ stats }) {
  const barRef = useRef(null);
  const [progress, setProgress] = useState(() => (skipAnimation() ? 1 : 0));

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || skipAnimation()) return undefined;

    let frame = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (frame) cancelAnimationFrame(frame);
        frame = null;
        // Reset while off-screen so the count replays on the next visit
        if (!entry.isIntersecting) {
          setProgress(0);
          return;
        }
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / DURATION, 1);
          setProgress(easeOutCubic(t));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );
    observer.observe(bar);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="stats-bar" ref={barRef}>
      <LiquidFx />

      <ul className="stats-bar__list">
        {stats.map(({ value, suffix, label }) => (
          <li key={label} className="stats-bar__item" aria-label={`${value}${suffix} ${label}`}>
            <span className="stats-bar__value" aria-hidden="true">
              {Math.round(value * progress)}
              <span className="stats-bar__suffix">{suffix}</span>
            </span>
            <span className="stats-bar__label" aria-hidden="true">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
