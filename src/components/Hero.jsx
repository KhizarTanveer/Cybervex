import React from 'react';

export default function Hero() {
  return (
    <section id="top" className="hero-section hero-section--fullscreen" aria-label="Cybervex Digital Showcase">
      {/* Ambient background glow for visual depth */}
      <div className="hero-ambient-glow" aria-hidden="true" />

      {/* Full-bleed edge-to-edge frame with zero side padding */}
      <div className="hero-fullscreen-frame">
        {/* Artwork box: full width 16:9; the frame crops it evenly if it's taller than the screen */}
        <div className="hero-art">
          {/* Original artwork with the brand "Digital" lettering; @2x is a clean 2x resample for large/HiDPI screens */}
          <img
            src="/images/cybervex-hero.jpg"
            srcSet="/images/cybervex-hero.jpg 1672w, /images/cybervex-hero@2x.jpg 3344w"
            sizes="100vw"
            alt="Cybervex Digital"
            className="hero-fullscreen-img"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width="1672"
            height="941"
          />
        </div>
        {/* Smooth bottom fade into obsidian #050505 */}
        <div className="hero-fullscreen-bottom-fade" aria-hidden="true" />
      </div>
    </section>
  );
}
