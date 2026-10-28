import React, { useEffect, useId, useRef, useState } from 'react';
import './LiquidFx.css';

// Drifting particles: vertical position (%), size (px), loop time (s), start offset (s)
const PARTICLES = [
  { top: 18, size: 2, duration: 9, delay: -1 },
  { top: 72, size: 3, duration: 12, delay: -7 },
  { top: 44, size: 2, duration: 8, delay: -4 },
  { top: 86, size: 2, duration: 11, delay: -2 },
  { top: 30, size: 3, duration: 14, delay: -10 },
  { top: 58, size: 2, duration: 10, delay: -6 },
  { top: 12, size: 2, duration: 13, delay: -12 },
  { top: 64, size: 3, duration: 9.5, delay: -3 },
  { top: 38, size: 2, duration: 12.5, delay: -9 },
  { top: 80, size: 2, duration: 10.5, delay: -5 },
];

// Waving guide lines drawn across the container (viewBox 0 0 720 110).
// They overshoot the edges so sideways drift never reveals a line end.
const LINES = [
  'M-60 70 C 120 30, 240 100, 360 62 S 600 24, 780 58',
  'M-60 40 C 140 78, 260 18, 380 50 S 620 92, 780 46',
  'M-60 92 C 160 70, 300 104, 440 80 S 640 60, 780 84',
  'M-60 22 C 100 48, 230 6, 350 30 S 590 54, 780 18',
  'M-60 56 C 170 92, 290 34, 420 66 S 650 38, 780 72',
  'M-60 104 C 130 84, 270 112, 400 96 S 610 76, 780 100',
];

const DRIFTS = ['liquid-fx-drift-a', 'liquid-fx-drift-b', 'liquid-fx-drift-c'];
const between = (min, max) => min + Math.random() * (max - min);

// Fresh random timing per instance so every card's lines wander independently
const randomLineMotion = () =>
  LINES.map(() => ({
    drift: {
      animationName: DRIFTS[Math.floor(Math.random() * DRIFTS.length)],
      animationDuration: `${between(7, 15).toFixed(2)}s`,
      animationDelay: `-${between(0, 15).toFixed(2)}s`,
      animationDirection: Math.random() < 0.5 ? 'alternate' : 'alternate-reverse',
    },
    flow: {
      animationDuration: `${between(4.5, 10).toFixed(2)}s`,
      animationDelay: `-${between(0, 10).toFixed(2)}s`,
      animationDirection: Math.random() < 0.35 ? 'reverse' : 'normal',
    },
  }));

// Decorative gold SVG lines & particles; fills its positioned parent and pauses off-screen
export default function LiquidFx() {
  const fxRef = useRef(null);
  const gradientId = `liquid-fx-gradient-${useId().replace(/[^\w-]/g, '')}`;
  const [lineMotion] = useState(randomLineMotion);

  useEffect(() => {
    const fx = fxRef.current;
    if (!fx || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      fx.classList.toggle('liquid-fx--paused', !entry.isIntersecting);
    });
    observer.observe(fx);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="liquid-fx" ref={fxRef} aria-hidden="true">
      <svg className="liquid-fx__lines" viewBox="0 0 720 110" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#C8A96A" stopOpacity="0" />
            <stop offset="0.5" stopColor="#C8A96A" stopOpacity="0.55" />
            <stop offset="1" stopColor="#C8A96A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {LINES.map((d, i) => (
          <g key={d} className="liquid-fx__line-group" style={lineMotion[i].drift}>
            <path d={d} className="liquid-fx__line" stroke={`url(#${gradientId})`} />
            <path d={d} className="liquid-fx__line-flow" pathLength="100" style={lineMotion[i].flow} />
          </g>
        ))}
      </svg>

      {PARTICLES.map(({ top, size, duration, delay }) => (
        <span
          key={`${top}-${duration}`}
          className="liquid-fx__particle-track"
          style={{ top: `${top}%`, animationDuration: `${duration}s`, animationDelay: `${delay}s` }}
        >
          <span className="liquid-fx__particle" style={{ width: size, height: size }} />
        </span>
      ))}
    </div>
  );
}
