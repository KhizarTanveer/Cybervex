import React, { useEffect, useRef } from 'react';

const HERO_POSTER = '/images/cybervex-hero.webp';
const HERO_VIDEO = '/videos/cybervex-hero-loop.mp4';

// Visitors who asked for less motion or less data keep the still artwork (the video's poster).
const prefersStill = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData === true;

export default function Hero() {
  const videoRef = useRef(null);

  // Muted is set on the element itself (iOS Safari only autoplays videos that are muted), then the
  // loop starts. If autoplay is blocked (e.g. Low Power Mode) the poster artwork simply stays.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersStill()) return;
    video.defaultMuted = true;
    video.muted = true;
    video.src = HERO_VIDEO;
    const play = () => video.play()?.catch(() => {});
    play();
    // Some WebKit builds stop at the loop point instead of looping: start it again (only while
    // the tab is visible, so the browser's own pause for hidden tabs is respected).
    const resume = () => {
      if (!document.hidden && video.paused) play();
    };
    video.addEventListener('pause', resume);
    video.addEventListener('ended', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      video.removeEventListener('pause', resume);
      video.removeEventListener('ended', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, []);

  return (
    <section id="top" className="hero-section hero-section--fullscreen" aria-label="Cybervex Digital Showcase">
      {/* Ambient background glow for visual depth */}
      <div className="hero-ambient-glow" aria-hidden="true" />

      {/* Full-bleed edge-to-edge frame with zero side padding */}
      <div className="hero-fullscreen-frame">
        {/* Artwork box: full width 16:9; the frame crops it evenly if it's taller than the screen */}
        <div className="hero-art">
          {/* Looping brand video; the still artwork shows until it starts (and for reduced motion / data saver) */}
          <video
            ref={videoRef}
            className="hero-fullscreen-img"
            poster={HERO_POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            aria-label="Cybervex Digital"
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
