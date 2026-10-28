import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  spiralServicesList,
  servicesCompanyIntro,
  servicesStats,
} from '../data/spiralServicesData';
import SpiralServiceCard from './SpiralServiceCard';
import StatsBar from './StatsBar';
import LiquidFx from './LiquidFx';
import ServiceDetailsModal from './ServiceDetailsModal';
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import './SpiralServices.css';
import './ServiceDetailsModal.css';

export default function SpiralServices() {
  const totalCount = spiralServicesList.length; // 23 categories

  // State management
  const [rotationIndex, setRotationIndex] = useState(0);
  const [, setTargetIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Refs for high-frequency interaction and animation lifecycle
  const stageRef = useRef(null);
  const animFrameRef = useRef(null);
  const dragRafRef = useRef(null);
  const rotationIndexRef = useRef(0);
  const targetIndexRef = useRef(0);

  // Drag interaction refs
  const isPointerDownRef = useRef(false);
  const hasMovedFarRef = useRef(false);
  const hasLockedDirectionRef = useRef(false);
  const isVerticalScrollRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartRotRef = useRef(0);
  const lastPointerXRef = useRef(0);
  const lastPointerTimeRef = useRef(0);
  const velocityRef = useRef(0);

  // Keep refs synchronized
  useEffect(() => {
    rotationIndexRef.current = rotationIndex;
  }, [rotationIndex]);

  // Window resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup all animation frames on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
    };
  }, []);

  // Shortest angular difference on cyclic index [0..23)
  const getShortestDelta = (current, target, total) => {
    let diff = ((target - current) % total + total) % total;
    if (diff > total / 2) diff -= total;
    return diff;
  };

  /**
   * Starts a smooth, damped snap animation to target index.
   * Runs requestAnimationFrame ONLY while moving, then stops completely when idle.
   */
  const startSnapAnimation = useCallback(
    (target) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      // Check prefers-reduced-motion
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const normalizedTarget = ((target % totalCount) + totalCount) % totalCount;
      targetIndexRef.current = normalizedTarget;
      setTargetIndex(normalizedTarget);

      if (prefersReduced) {
        rotationIndexRef.current = normalizedTarget;
        setRotationIndex(normalizedTarget);
        return;
      }

      const animate = () => {
        const current = rotationIndexRef.current;
        const targetVal = targetIndexRef.current;
        const delta = getShortestDelta(current, targetVal, totalCount);

        if (Math.abs(delta) < 0.003) {
          rotationIndexRef.current = targetVal;
          setRotationIndex(targetVal);
          animFrameRef.current = null; // Clean stop when idle!
          return;
        }

        // Smooth spring damping interpolation
        const nextRot = current + delta * 0.16;
        rotationIndexRef.current = nextRot;
        setRotationIndex(nextRot);

        animFrameRef.current = requestAnimationFrame(animate);
      };

      animFrameRef.current = requestAnimationFrame(animate);
    },
    [totalCount]
  );

  // Command rotation to a specific card index
  const navigateToIndex = useCallback(
    (index) => {
      startSnapAnimation(index);
    },
    [startSnapAnimation]
  );

  // Prev / Next actions
  const handlePrev = useCallback(() => {
    const currentRounded = Math.round(rotationIndexRef.current);
    navigateToIndex(currentRounded - 1);
  }, [navigateToIndex]);

  const handleNext = useCallback(() => {
    const currentRounded = Math.round(rotationIndexRef.current);
    navigateToIndex(currentRounded + 1);
  }, [navigateToIndex]);

  // Keyboard navigation on stage
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        navigateToIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        navigateToIndex(totalCount - 1);
      }
    },
    [handlePrev, handleNext, navigateToIndex, totalCount]
  );

  /* --------------------------------------------------------------------------
     POINTER DRAG / SWIPE HANDLERS (Mobile Touch & Desktop Mouse)
     -------------------------------------------------------------------------- */
  const handlePointerDown = (e) => {
    // Only respond to primary button (left click) or touch
    if (e.button !== undefined && e.button !== 0) return;

    // Cancel any running snap animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    isPointerDownRef.current = true;
    hasMovedFarRef.current = false;
    hasLockedDirectionRef.current = false;
    isVerticalScrollRef.current = false;

    const clientX = e.clientX;
    const clientY = e.clientY;

    dragStartXRef.current = clientX;
    dragStartYRef.current = clientY;
    dragStartRotRef.current = rotationIndexRef.current;
    lastPointerXRef.current = clientX;
    lastPointerTimeRef.current = performance.now();
    velocityRef.current = 0;
    // Pointer capture is deferred until a horizontal drag is confirmed (see beginDrag).
    // Capturing here would retarget the follow-up click to the viewport,
    // so card / "Explore Details" onClick handlers would never fire.
  };

  // Confirm a horizontal drag and capture pointer so it continues smoothly off-stage
  const beginDrag = (e) => {
    hasMovedFarRef.current = true;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if not supported
    }
  };

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return;
    if (isVerticalScrollRef.current) return;
    // Mouse was released outside the stage before a drag began (no capture yet)
    if (e.pointerType === 'mouse' && e.buttons === 0) {
      isPointerDownRef.current = false;
      return;
    }

    const clientX = e.clientX;
    const clientY = e.clientY;

    const dx = clientX - dragStartXRef.current;
    const dy = clientY - dragStartYRef.current;

    // Detect direction lock on initial movement
    if (!hasLockedDirectionRef.current) {
      const distance = Math.hypot(dx, dy);
      if (distance > 7) {
        hasLockedDirectionRef.current = true;
        if (Math.abs(dy) > Math.abs(dx)) {
          // Intentional vertical page scroll: release and don't hijack!
          isVerticalScrollRef.current = true;
          isPointerDownRef.current = false;
          setIsDragging(false);
          return;
        } else {
          // Intentional horizontal spiral swipe
          beginDrag(e);
        }
      }
    }

    if (!hasMovedFarRef.current) {
      if (Math.abs(dx) > 6) {
        beginDrag(e);
      }
    }

    if (hasMovedFarRef.current) {
      // Calculate velocity for natural release inertia
      const now = performance.now();
      const dt = now - lastPointerTimeRef.current;
      if (dt > 8) {
        const moveDelta = clientX - lastPointerXRef.current;
        velocityRef.current = moveDelta / dt;
        lastPointerXRef.current = clientX;
        lastPointerTimeRef.current = now;
      }

      // Tuned responsive sensitivity:
      // Swipe left (dx < 0) -> rotates forward to next cards
      // Swipe right (dx > 0) -> rotates backward to previous cards
      const sensitivity =
        windowWidth < 480 ? 0.0048 : windowWidth < 768 ? 0.0042 : 0.0032;

      const newRot = dragStartRotRef.current - dx * sensitivity;
      rotationIndexRef.current = newRot;

      // Throttle React state update to display refresh rate
      if (!dragRafRef.current) {
        dragRafRef.current = requestAnimationFrame(() => {
          setRotationIndex(rotationIndexRef.current);
          dragRafRef.current = null;
        });
      }
    }
  };

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }

    if (hasMovedFarRef.current) {
      // User dragged: calculate subtle release inertia and snap to nearest card
      const velocity = velocityRef.current || 0;
      // Clamp velocity to avoid excessive momentum jumps
      const clampedVelocity = Math.max(-1.8, Math.min(1.8, velocity));
      const inertiaDistance = clampedVelocity * 0.18;

      const projectedRot = rotationIndexRef.current - inertiaDistance;
      const target = Math.round(projectedRot);
      startSnapAnimation(target);

      // Keep hasMovedFarRef true for 50ms so card onClick is safely suppressed
      setTimeout(() => {
        hasMovedFarRef.current = false;
      }, 50);
    } else {
      // Was a tap/click: reset
      hasMovedFarRef.current = false;
    }
  };

  const handlePointerCancel = (e) => {
    isPointerDownRef.current = false;
    setIsDragging(false);
    hasMovedFarRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignored
    }
    // Snap to nearest integer position
    const target = Math.round(rotationIndexRef.current);
    startSnapAnimation(target);
  };

  // Active service calculation
  const focalIndex = useMemo(() => {
    return ((Math.round(rotationIndex) % totalCount) + totalCount) % totalCount;
  }, [rotationIndex, totalCount]);

  // Parametric 3D position computation for spiral card i
  const computeCardTransform = useCallback(
    (cardIndex) => {
      let k = ((cardIndex - rotationIndex) % totalCount + totalCount) % totalCount;
      if (k > totalCount / 2) k -= totalCount;

      // Cull far away cards that are on the hidden/back side of the spiral
      const isSmallMobile = windowWidth < 414;
      const isMobile = windowWidth >= 414 && windowWidth < 768;
      const isTablet = windowWidth >= 768 && windowWidth < 1024;

      const maxVisibleSpan = isSmallMobile
        ? 2.3
        : isMobile
        ? 2.8
        : isTablet
        ? 3.6
        : 4.6;

      if (Math.abs(k) > maxVisibleSpan) {
        return { display: 'none' };
      }

      // Responsive trajectory geometry
      const Rx = isSmallMobile
        ? 140
        : isMobile
        ? 175
        : isTablet
        ? 290
        : 420;
      const Rz = isSmallMobile
        ? 80
        : isMobile
        ? 100
        : isTablet
        ? 170
        : 240;
      const yPitch = isSmallMobile
        ? 12
        : isMobile
        ? 16
        : isTablet
        ? 20
        : 24;
      const angleStep = isSmallMobile
        ? 0.54
        : isMobile
        ? 0.50
        : isTablet
        ? 0.44
        : 0.42;

      const theta = k * angleStep;

      // Spiral equations:
      // X: elliptical spiral expanding gently as cards wind outward
      const x = Rx * Math.sin(theta) * (1 + 0.035 * k);
      // Y: vertical helical rise/fall
      const y = -k * yPitch + Math.sin(theta) * 14;
      // Z: depth into 3D space, active card is in foreground (+120px)
      const z = Rz * (Math.cos(theta) - 1) - Math.abs(k) * (isMobile || isSmallMobile ? 32 : 45);

      // Orientation angles
      const rotY = -k * (isMobile || isSmallMobile ? 18 : 22);
      const rotZ = -k * 1.6;
      const rotX = 3 + Math.abs(k) * 1.2;

      // Scale & Opacity
      const scale = Math.max(0.66, 1.05 - Math.abs(k) * (isMobile || isSmallMobile ? 0.12 : 0.09));
      let opacity = 1.0;
      if (Math.abs(k) > 1.0) {
        opacity = Math.max(
          0,
          1.0 - (Math.abs(k) - 1.0) * (isMobile || isSmallMobile ? 0.4 : 0.28)
        );
      }

      const zIndex = 100 - Math.round(Math.abs(k) * 10);

      return {
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${scale})`,
        opacity,
        zIndex,
        pointerEvents: opacity < 0.25 ? 'none' : 'auto',
        transition: isDragging
          ? 'none'
          : 'transform 0.12s linear, opacity 0.12s linear',
      };
    },
    [rotationIndex, totalCount, windowWidth, isDragging]
  );

  // Modal navigation (Layer B)
  const handleModalNext = useCallback(() => {
    if (!selectedService) return;
    const currentIdx = spiralServicesList.findIndex((s) => s.id === selectedService.id);
    const nextIdx = (currentIdx + 1) % totalCount;
    setSelectedService(spiralServicesList[nextIdx]);
    navigateToIndex(nextIdx);
  }, [selectedService, totalCount, navigateToIndex]);

  const handleModalPrev = useCallback(() => {
    if (!selectedService) return;
    const currentIdx = spiralServicesList.findIndex((s) => s.id === selectedService.id);
    const prevIdx = (currentIdx - 1 + totalCount) % totalCount;
    setSelectedService(spiralServicesList[prevIdx]);
    navigateToIndex(prevIdx);
  }, [selectedService, totalCount, navigateToIndex]);

  // Card click callback with drag-protection
  const handleCardClick = useCallback(
    (service, isActive, idx) => {
      if (hasMovedFarRef.current) return;
      if (isActive) {
        setSelectedService(service);
      } else {
        navigateToIndex(idx);
      }
    },
    [navigateToIndex]
  );

  const handleDetailsClick = useCallback((service) => {
    if (hasMovedFarRef.current) return;
    setSelectedService(service);
  }, []);

  return (
    <section
      id="services"
      className="spiral-services-section reveal-blur-section"
      aria-label="Cybervex Digital Services — Rotating Spiral Capabilities"
    >
      {/* Ambient Cosmic Background Elements */}
      <div className="spiral-bg-ambient" aria-hidden="true">
        <div className="spiral-bg-glow spiral-bg-glow--top" />
        <div className="spiral-bg-glow spiral-bg-glow--center" />
        <div className="spiral-bg-grid" />
      </div>

      <div className="spiral-container">
        {/* Section Header */}
        <div className="spiral-header">
          <div className="spiral-header__meta">
            <span className="spiral-eyebrow">
              <span className="spiral-eyebrow__dot" />
              01 / CAPABILITIES PROFILE
            </span>
            <span className="spiral-badge-tag">{servicesCompanyIntro.tagline}</span>
          </div>

          <h2 className="spiral-title">
            All Digital, Creative & Operational Disciplines 
          </h2>

          <p className="spiral-subtitle">
            {servicesCompanyIntro.about.split('\n\n')[0]}
          </p>

          <StatsBar stats={servicesStats} />
        </div>

        {/* 3D ROTATING SPIRAL VIEWPORT */}
        <div
          className={`spiral-viewport ${isDragging ? 'spiral-viewport--dragging' : ''}`}
          ref={stageRef}
          tabIndex={0}
          role="region"
          aria-label="Interactive 3D Spiral Orbit of Services"
          aria-roledescription="carousel"
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {/* Background 3D Orbital Trajectory Guide Rings */}
          <div className="spiral-orbit-stage" aria-hidden="true">
            <div className="spiral-orbit-ring spiral-orbit-ring--1" />
            <div className="spiral-orbit-ring spiral-orbit-ring--2" />
            <div className="spiral-orbit-ring spiral-orbit-ring--3" />
            <div className="spiral-orbit-axis" />
          </div>

          {/* Central Focal Spotlight */}
          <div className="spiral-focal-spotlight" aria-hidden="true" />

          {/* 3D Transform Space containing cards */}
          <div className="spiral-3d-scene">
            {spiralServicesList.map((service, idx) => {
              const cardStyle = computeCardTransform(idx);
              if (cardStyle.display === 'none') return null;

              const isFocal = idx === focalIndex;
              let k = ((idx - rotationIndex) % totalCount + totalCount) % totalCount;
              if (k > totalCount / 2) k -= totalCount;
              const isActive = Math.abs(k) < 0.45;

              return (
                <SpiralServiceCard
                  key={service.id}
                  service={service}
                  style={cardStyle}
                  isActive={isActive}
                  isFocal={isFocal}
                  onCardClick={() => handleCardClick(service, isActive, idx)}
                  onDetailsClick={() => handleDetailsClick(service)}
                />
              );
            })}
          </div>
        </div>

        {/* VALUE PILLARS & COMMITMENT SHOWCASE (From source text) */}
        <div className="spiral-pillars-section">
          <div className="spiral-pillars-header">
            <span className="spiral-pillars-eyebrow">WHY CHOOSE CYBERVEX DIGITAL?</span>
            <h3 className="spiral-pillars-title">
              Multiple Business Solutions Under One Roof
            </h3>
            <p className="spiral-pillars-desc">
              We bring together digital marketing, technology, creative services, event management, and business support to simplify the client experience.
            </p>
          </div>

          <div className="spiral-pillars-grid">
            {servicesCompanyIntro.valuePillars.map((pillar, pIdx) => (
              <div key={pIdx} className="spiral-pillar-card">
                <div className="spiral-pillar-card__top">
                  <span className="spiral-pillar-card__num">0{pIdx + 1}</span>
                  <CheckCircle2 size={16} className="spiral-pillar-card__icon" />
                </div>
                <h4 className="spiral-pillar-card__title">{pillar.title}</h4>
                <p className="spiral-pillar-card__desc">{pillar.description}</p>
              </div>
            ))}
          </div>

          {/* Our Commitment Box */}
          <div className="spiral-commitment-banner">
            <LiquidFx />
            <div className="spiral-commitment-badge">
              <ShieldCheck size={18} className="spiral-commitment-badge__icon" />
              <span>OUR COMMITMENT</span>
            </div>
            <p className="spiral-commitment-text">
              {servicesCompanyIntro.commitment}
            </p>
            <div className="spiral-commitment-footer">
              <span className="spiral-commitment-tagline">
                {servicesCompanyIntro.closingStatement}
              </span>
              <a href="#contact" className="spiral-commitment-cta">
                <span>Contact With Cybervex</span>
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* LAYER B: FULL SERVICE DETAILS MODAL */}
      <ServiceDetailsModal
        service={selectedService}
        isOpen={Boolean(selectedService)}
        onClose={() => setSelectedService(null)}
        onPrev={handleModalPrev}
        onNext={handleModalNext}
        totalServices={totalCount}
      />
    </section>
  );
}
