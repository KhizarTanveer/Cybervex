import React, { useLayoutEffect, useRef, useState } from 'react';

// Centered pill bar for the Projects page. A gold indicator slides under the chosen option.
export default function ProjectFilter({ options, value, onChange }) {
  const barRef = useRef(null);
  const [indicator, setIndicator] = useState(null);

  // Place the indicator over the active button (again whenever the bar changes size)
  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const place = () => {
      const active = bar.querySelector('[aria-pressed="true"]');
      if (active) setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [value, options]);

  return (
    <div className="project-filter" role="group" aria-label="Filter projects by service">
      <div className="project-filter__bar" ref={barRef}>
        {indicator && (
          <span
            className="project-filter__indicator"
            style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
            aria-hidden="true"
          />
        )}
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="project-filter__option"
            aria-pressed={option.id === value}
            onClick={() => onChange(option.id)}
          >
            {option.shortLabel ? (
              <>
                <span className="project-filter__label-long">{option.label}</span>
                <span className="project-filter__label-short">{option.shortLabel}</span>
              </>
            ) : (
              option.label
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
