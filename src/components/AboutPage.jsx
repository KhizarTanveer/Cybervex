import React, { useRef, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Award,
  Users2,
  Lightbulb,
  CheckCircle2,
  Target,
  Compass,
} from 'lucide-react';
import {
  aboutHeroContent,
  aboutWhoWeAre,
  aboutMissionContent,
  aboutVisionContent,
  aboutValuesList,
  aboutPromiseContent,
  aboutFinalStatement,
} from '../data/aboutData';
import LiquidFx from './LiquidFx';
import './AboutPage.css';

// Icon map helper for dynamic icon rendering
const iconMap = {
  TrendingUp,
  ShieldCheck,
  Award,
  Users2,
  Lightbulb,
  CheckCircle2,
};

/**
 * Swipeable card track with a fill scroll bar.
 * The fill is written straight to the DOM once per frame (no React re-render per scroll event),
 * so it tracks the cards exactly and stays smooth.
 */
function useSwipeScroll(scrollRef) {
  const trackRef = useRef(null);
  const fillRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    let frame = null;
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    const paintFill = () => {
      frame = null;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const ratio = maxScroll <= 2 ? 0 : Math.max(0, Math.min(1, el.scrollLeft / maxScroll));
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${ratio})`;
      if (trackRef.current) trackRef.current.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    };

    const requestPaint = () => {
      if (!frame) frame = requestAnimationFrame(paintFill);
    };

    const onMouseDown = (e) => {
      isDragging = true;
      startX = e.pageX;
      startScrollLeft = el.scrollLeft;
      // Snapping fights manual dragging, so pause it until release
      el.style.scrollSnapType = 'none';
      el.style.scrollBehavior = 'auto';
      el.style.cursor = 'grabbing';
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      el.scrollLeft = startScrollLeft - (e.pageX - startX) * 1.35;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      el.style.scrollSnapType = '';
      el.style.scrollBehavior = '';
      el.style.cursor = '';
    };

    paintFill();
    el.addEventListener('scroll', requestPaint, { passive: true });
    window.addEventListener('resize', requestPaint);
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener('scroll', requestPaint);
      window.removeEventListener('resize', requestPaint);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [scrollRef]);

  const handleTrackClick = useCallback((e) => {
    const el = scrollRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.scrollTo({ left: ratio * (el.scrollWidth - el.clientWidth), behavior: 'smooth' });
  }, [scrollRef]);

  return { trackRef, fillRef, handleTrackClick };
}

export default function AboutPage() {
  const valuesScrollRef = useRef(null);
  const {
    trackRef: valuesTrackRef,
    fillRef: valuesFillRef,
    handleTrackClick: handleValuesTrackClick,
  } = useSwipeScroll(valuesScrollRef);

  return (
    <div className="about-page">
      {/* Brand-icon watermark: sticks behind the intro sections and stops before Mission & Vision */}
      <div className="about-watermark-zone">
        <div className="about-watermark" aria-hidden="true">
          <div className="about-watermark__sticky">
            <span className="about-watermark__icon" />
          </div>
        </div>

        {/* =====================================================================
            SECTION 1 — ABOUT HERO
            ===================================================================== */}
        <section id="about-hero" className="about-hero-section" aria-label="About Cybervex Digital Hero">
          <div className="about-hero__ambient-glow" aria-hidden="true" />
          <div className="subtle-grid-bg" aria-hidden="true" />

          <div className="container about-hero__container">
            <div className="about-hero__header">
              {/* Editorial Main Heading */}
              <h1 className="about-hero__title">
                {aboutHeroContent.headingLine1}
                <br />
                <span className="about-hero__title-accent">{aboutHeroContent.headingLine2}</span>
              </h1>

              {/* Supporting Text */}
              <p className="about-hero__lead">{aboutHeroContent.leadText}</p>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SECTION 2 — ABOUT US (WHO WE ARE)
            ===================================================================== */}
        <section id="who-we-are" className="section about-intro-section reveal-blur-section" aria-label="Who We Are">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{aboutWhoWeAre.heading}</h2>
            </div>

            <div className="about-intro-grid">
              {/* Left Column: Editorial Accent & Philosophy */}
              <aside className="about-intro__aside">
                <div className="about-intro__aside-line" aria-hidden="true" />
                <blockquote className="about-intro__pullquote">
                  “{aboutWhoWeAre.pullQuote}”
                </blockquote>
                <div className="about-intro__aside-meta">
                  <span className="about-intro__meta-badge">TAILORED SOLUTIONS</span>
                  <span className="about-intro__meta-sub">Every business is different</span>
                </div>
              </aside>

              {/* Right Column: Complete Original Editorial Paragraphs */}
              <div className="about-intro__body">
                {aboutWhoWeAre.paragraphs.map((paragraph, idx) => (
                  <p key={idx} className="about-intro__paragraph">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================================
          SECTION 4 & 5 — OUR MISSION & OUR VISION
          ===================================================================== */}
      <section id="mission-vision" className="section about-mv-section reveal-blur-section" aria-label="Mission and Vision">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Mission & Vision</h2>
          </div>

          <div className="about-mv-grid reveal-stagger">
            {/* Section 4: Our Mission */}
            <div className="about-mv-card about-mv-card--mission">
              <div className="about-mv-card__glow" aria-hidden="true" />
              <LiquidFx />
              <div className="about-mv-card__header">
                <div className="about-mv-card__badge">
                  <Target size={16} className="about-mv-card__badge-icon" strokeWidth={1.5} />
                  <span>MISSION</span>
                </div>
                <span className="about-mv-card__num">01</span>
              </div>
              <h3 className="about-mv-card__title">{aboutMissionContent.heading}</h3>
              <div className="about-mv-card__content">
                {aboutMissionContent.paragraphs.map((p, idx) => (
                  <p key={idx} className="about-mv-card__paragraph">
                    {p}
                  </p>
                ))}
              </div>
            </div>

            {/* Section 5: Our Vision */}
            <div className="about-mv-card about-mv-card--vision">
              <div className="about-mv-card__glow" aria-hidden="true" />
              <LiquidFx />
              <div className="about-mv-card__header">
                <div className="about-mv-card__badge">
                  <Compass size={16} className="about-mv-card__badge-icon" strokeWidth={1.5} />
                  <span>VISION</span>
                </div>
                <span className="about-mv-card__num">02</span>
              </div>
              <h3 className="about-mv-card__title">{aboutVisionContent.heading}</h3>
              <div className="about-mv-card__content">
                {aboutVisionContent.paragraphs.map((p, idx) => (
                  <p key={idx} className="about-mv-card__paragraph">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 6 — OUR VALUES (SWIPEABLE CARDS WITH FILL SCROLL BAR)
          ===================================================================== */}
      <section id="our-values" className="section about-values-section reveal-blur-section" aria-label="The Principles Behind Our Work">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">The Principles Behind Our Work</h2>
            <p className="section-subtitle">
              The foundational standards and commitments that direct our relationships and execution.
            </p>
          </div>

          {/* Six Individual Value Cards in Swipeable Form */}
          <div
            ref={valuesScrollRef}
            className="about-swipe-container reveal-stagger"
          >
            {aboutValuesList.map((val) => {
              const IconComponent = iconMap[val.iconName] || ShieldCheck;
              return (
                <div key={val.number} className="about-value-card about-swipe-card about-swipe-card--value">
                  <LiquidFx />
                  <div className="about-value-card__header">
                    <span className="about-value-card__num">{val.number}</span>
                    <div className="about-value-card__icon-box">
                      <IconComponent size={20} className="about-value-card__icon" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="about-value-card__title">{val.heading}</h3>
                  <p className="about-value-card__text">{val.content}</p>
                  <div className="about-value-card__line" aria-hidden="true" />
                </div>
              );
            })}
          </div>

          {/* Fill Scroll Bar Underneath */}
          <div className="about-swipe-controls">
            
            <div
              ref={valuesTrackRef}
              className="about-swipe-track"
              onClick={handleValuesTrackClick}
              role="scrollbar"
              aria-valuenow={0}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Principles scroll progress"
            >
              <div ref={valuesFillRef} className="about-swipe-fill" />
            </div>
            
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 7 — OUR PROMISE
          ===================================================================== */}
      <section id="our-promise" className="section about-promise-section reveal-blur-section" aria-label="A Team You Can Rely On">
        <div className="container">
          <div className="about-promise-box">
            <div className="about-promise-box__ambient" aria-hidden="true" />
            <h2 className="section-title about-promise-title">{aboutPromiseContent.heading}</h2>

            {/* Typographically highlighted phrase */}
            <div className="about-promise-featured">
              <p className="about-promise-highlight">
                “{aboutPromiseContent.highlightPhrase}”
              </p>
            </div>

            {/* Full complete editorial text */}
            <div className="about-promise-body">
              {aboutPromiseContent.paragraphs.map((p, idx) => (
                <p key={idx} className="about-promise-paragraph">
                  {p}
                </p>
              ))}
            </div>

            <div className="about-promise-meta">
              <span className="about-promise-pill">LONG-TERM PARTNERSHIP</span>
              <span className="about-promise-sep">•</span>
              <span className="about-promise-pill">CLEAR COMMUNICATION</span>
              <span className="about-promise-sep">•</span>
              <span className="about-promise-pill">MEASURABLE VALUE</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 8 — FINAL BRAND STATEMENT
          ===================================================================== */}
      <section id="brand-statement" className="about-closing-section reveal-blur-section" aria-label="Cybervex Digital Brand Statement">
        <div className="about-closing__glow" aria-hidden="true" />
        <div className="container about-closing__container">
          <h2 className="about-closing__brand">
            <img
              src="/images/cybervex-logo-1280.png"
              alt={aboutFinalStatement.brand}
              className="about-closing__logo"
              width="911"
              height="186"
              loading="lazy"
              decoding="async"
            />
          </h2>
          <p className="about-closing__statement">{aboutFinalStatement.statement}</p>
          <div className="about-closing__hairline" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
