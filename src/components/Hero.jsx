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
          <img
            src="/images/cybervex-hero-art.jpg"
            srcSet="/images/cybervex-hero-art.jpg 2048w, /images/cybervex-hero-art@2x.jpg 3840w"
            sizes="(max-width: 768px) 100vw, 3840px"
            alt=""
            className="hero-fullscreen-img"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            width="3840"
            height="2160"
          />
          {/* Brand wordmark layered on top so it stays razor-sharp at any resolution */}
          <img
            src="/images/cybervex-wordmark-4k.png"
            alt="Cybervex Digital"
            className="hero-art__wordmark"
            width="3003"
            height="410"
            loading="eager"
            decoding="async"
          />
        </div>
        {/* Smooth bottom fade into obsidian #050505 */}
        <div className="hero-fullscreen-bottom-fade" aria-hidden="true" />
      </div>
    </section>
  );
}
