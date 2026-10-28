import React from 'react';

export default function Hero() {
  return (
    <section id="top" className="hero-section hero-section--fullscreen" aria-label="Cybervex Digital Showcase">
      {/* Ambient background glow for visual depth */}
      <div className="hero-ambient-glow" aria-hidden="true" />

      {/* Full-bleed edge-to-edge frame with zero side padding */}
      <div className="hero-fullscreen-frame">
        <img
          src="/images/cybervex-hero.png"
          srcSet="/images/cybervex-hero.png 2048w, /images/cybervex-hero@2x.png 3840w"
          sizes="(max-width: 1440px) 100vw, 3840px"
          alt="Cybervex Digital Visual Identity"
          className="hero-fullscreen-img"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          width="3840"
          height="2160"
        />
        {/* Smooth bottom fade into obsidian #050505 */}
        <div className="hero-fullscreen-bottom-fade" aria-hidden="true" />
      </div>
    </section>
  );
}
