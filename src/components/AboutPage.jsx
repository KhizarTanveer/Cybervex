import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Search,
  Share2,
  Code2,
  Palette,
  Cpu,
  Layers,
  CalendarCheck,
  Briefcase,
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
  aboutServicesList,
  aboutMissionContent,
  aboutVisionContent,
  aboutValuesList,
  aboutPromiseContent,
  aboutFinalStatement,
} from '../data/aboutData';
import './AboutPage.css';

// Icon map helper for dynamic icon rendering
const iconMap = {
  TrendingUp,
  Search,
  Share2,
  Code2,
  Palette,
  Cpu,
  Layers,
  CalendarCheck,
  Briefcase,
  ShieldCheck,
  Award,
  Users2,
  Lightbulb,
  CheckCircle2,
};

/**
 * Reusable hook for swipeable card tracks with fill scroll bar
 */
function useSwipeScroll(scrollRef) {
  const [scrollRatio, setScrollRatio] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const calculateProgress = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 2) {
      setScrollRatio(0);
    } else {
      const ratio = Math.max(0, Math.min(1, scrollLeft / maxScroll));
      setScrollRatio(ratio);
    }
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    calculateProgress();
    el.addEventListener('scroll', calculateProgress, { passive: true });
    window.addEventListener('resize', calculateProgress);

    const onMouseDown = (e) => {
      isDragging.current = true;
      startX.current = e.pageX - el.offsetLeft;
      startScrollLeft.current = el.scrollLeft;
      el.style.scrollBehavior = 'auto';
      el.style.cursor = 'grabbing';
    };

    const onMouseMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const distance = (x - startX.current) * 1.35;
      el.scrollLeft = startScrollLeft.current - distance;
      calculateProgress();
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      el.style.scrollBehavior = 'smooth';
      el.style.cursor = 'grab';
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('scroll', calculateProgress);
      window.removeEventListener('resize', calculateProgress);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [calculateProgress, scrollRef]);

  const scrollByCard = useCallback((direction) => {
    if (!scrollRef.current) return;
    const firstCard = scrollRef.current.firstElementChild;
    const cardWidth = firstCard ? firstCard.clientWidth + 24 : 340;
    const delta = direction === 'left' ? -cardWidth : cardWidth;
    scrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  }, [scrollRef]);

  const handleTrackClick = useCallback((e) => {
    if (!scrollRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const { scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    scrollRef.current.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
  }, [scrollRef]);

  // Base fill corresponds to initial item presence, smoothly scaling to 100%
  const fillPercentage = scrollRatio * 100;

  return {
    fillPercentage,
    scrollByCard,
    handleTrackClick,
  };
}

export default function AboutPage() {
  const servicesScrollRef = useRef(null);
  const valuesScrollRef = useRef(null);

  const {
    fillPercentage: servicesFill,
    handleTrackClick: handleServicesTrackClick,
  } = useSwipeScroll(servicesScrollRef);

  const {
    fillPercentage: valuesFill,
    handleTrackClick: handleValuesTrackClick,
  } = useSwipeScroll(valuesScrollRef);

  return (
    <div className="about-page">
      {/* =====================================================================
          SECTION 1 — ABOUT HERO
          ===================================================================== */}
      <section id="about-hero" className="about-hero-section" aria-label="About Cybervex Digital Hero">
        <div className="about-hero__ambient-glow" aria-hidden="true" />
        <div className="subtle-grid-bg" aria-hidden="true" />

        <div className="container about-hero__container">
          <div className="about-hero__header">
            {/* Small Eyebrow with Warm Amber Indicator */}
            <div className="about-hero__eyebrow-wrapper">
              <span className="about-hero__eyebrow-dot" aria-hidden="true" />
              <span className="about-hero__eyebrow">{aboutHeroContent.eyebrow}</span>
            </div>

            {/* Editorial Main Heading */}
            <h1 className="about-hero__title">
              {aboutHeroContent.headingLine1}
              <br />
              <span className="about-hero__title-accent">{aboutHeroContent.headingLine2}</span>
            </h1>

            {/* Supporting Text */}
            <p className="about-hero__lead">{aboutHeroContent.leadText}</p>
          </div>

          {/* Understated Abstract Visual Inspired by Liquid-Glass Hero Artwork */}
          <div className="about-hero__visual-wrapper">
            <div className="about-hero__visual-frame">
              <img
                src="/images/about-hero-art.jpg"
                alt="Cybervex Digital Liquid Glass Ribbon Artwork"
                className="about-hero__visual-img"
                width="1920"
                height="1080"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <div className="about-hero__visual-gradient-mask" aria-hidden="true" />
              <div className="about-hero__visual-meta">
                <span className="about-hero__visual-tag">CREATIVITY × TECHNOLOGY × BUSINESS SUPPORT</span>
                <span className="about-hero__visual-coord">CYBERVEX • DIGITAL HORIZONS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2 — ABOUT US (WHO WE ARE)
          ===================================================================== */}
      <section id="who-we-are" className="section about-intro-section reveal-blur-section" aria-label="Who We Are">
        <div className="container">
          <div className="section-header">
            <span className="section-label">{aboutWhoWeAre.eyebrow}</span>
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

      {/* =====================================================================
          SECTION 3 — OUR SERVICES OVERVIEW (SWIPEABLE CARDS WITH FILL SCROLL BAR)
          ===================================================================== */}
      <section id="services-overview" className="section about-services-section reveal-blur-section" aria-label="Our Services Overview">
        <div className="container">
          <div className="section-header">
            <span className="section-label">02 / FULL CAPABILITIES</span>
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">
              Bringing practical digital, creative, and operational solutions together under one roof.
            </p>
          </div>

          {/* Swipeable Premium Service Cards (9 Services) */}
          <div
            ref={servicesScrollRef}
            className="about-swipe-container reveal-stagger"
          >
            {aboutServicesList.map((service) => {
              const IconComponent = iconMap[service.iconName] || Briefcase;
              return (
                <div key={service.number} className="about-service-card about-swipe-card">
                  <div className="about-service-card__top">
                    <span className="about-service-card__number">{service.number}</span>
                    <div className="about-service-card__icon-wrap">
                      <IconComponent size={20} className="about-service-card__icon" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="about-service-card__title">{service.title}</h3>
                  <div className="about-service-card__indicator" aria-hidden="true" />
                </div>
              );
            })}
          </div>

          {/* Fill Scroll Bar Underneath */}
          <div className="about-swipe-controls">
           
            <div
              className="about-swipe-track"
              onClick={handleServicesTrackClick}
              role="scrollbar"
              aria-valuenow={Math.round(servicesFill)}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Services scroll progress"
            >
              <div
                className="about-swipe-fill"
                style={{ width: `${servicesFill}%` }}
              />
            </div>
            
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 4 & 5 — OUR MISSION & OUR VISION
          ===================================================================== */}
      <section id="mission-vision" className="section about-mv-section reveal-blur-section" aria-label="Mission and Vision">
        <div className="container">
          <div className="section-header">
            <span className="section-label">{aboutMissionContent.eyebrow}</span>
            <h2 className="section-title">Mission & Vision</h2>
          </div>

          <div className="about-mv-grid reveal-stagger">
            {/* Section 4: Our Mission */}
            <div className="about-mv-card about-mv-card--mission">
              <div className="about-mv-card__glow" aria-hidden="true" />
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
            <span className="section-label">04 / CORE PRINCIPLES</span>
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
              className="about-swipe-track"
              onClick={handleValuesTrackClick}
              role="scrollbar"
              aria-valuenow={Math.round(valuesFill)}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Principles scroll progress"
            >
              <div
                className="about-swipe-fill"
                style={{ width: `${valuesFill}%` }}
              />
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
            <span className="section-label">{aboutPromiseContent.eyebrow}</span>
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
          <div className="about-closing__meta">
            <span className="about-closing__pip" aria-hidden="true" />
            <span className="about-closing__tag">CYBERVEX DIGITAL</span>
          </div>
          <h2 className="about-closing__brand">{aboutFinalStatement.brand}</h2>
          <p className="about-closing__statement">{aboutFinalStatement.statement}</p>
          <div className="about-closing__hairline" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
