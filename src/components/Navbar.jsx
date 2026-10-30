import React, { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { navLinks, pageRoutes } from '../data/agencyData';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar({ currentRoute = '/', onNavigate }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('top');

  const toggleButtonRef = useRef(null);
  const closeButtonRef = useRef(null);

  const isSubPage = currentRoute !== '/';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      if (isSubPage) return;

      // Detect current section in view on home page
      const sections = ['top', 'services', 'work'];
      const scrollPos = window.scrollY + 120;

      for (let i = sections.length - 1; i >= 0; i--) {
        const sectionId = sections[i];
        const el = document.getElementById(sectionId);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionId);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSubPage]);

  // Lock background scroll when mobile menu is open and restore on close/unmount
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Shift focus to close button for keyboard accessibility
      const focusTimer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(focusTimer);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        toggleButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';

    // 1. Page Links (About, Contact)
    const pageRoute = pageRoutes[href];
    if (pageRoute) {
      if (currentRoute === pageRoute) {
        window.scrollTo({ top: 0, behavior });
      } else if (onNavigate) {
        onNavigate(pageRoute);
      } else {
        window.history.pushState({}, '', pageRoute);
      }
      return;
    }

    // 2. Home Link
    if (href === '#top' || href === '/') {
      if (isSubPage) {
        if (onNavigate) {
          onNavigate('/', '#top');
        }
      } else {
        if (window.location.hash) window.history.replaceState({}, '', '/'); // keep the address plain: no #top or #section
        window.scrollTo({ top: 0, behavior });
      }
      return;
    }

    // 3. Other anchors (#services, #work, etc.)
    if (isSubPage) {
      if (onNavigate) {
        onNavigate('/', href);
      }
      return;
    }

    // On home page, normal smooth scroll to element
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);

    if (element) {
      element.scrollIntoView({ behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';

    if (isSubPage) {
      if (onNavigate) {
        onNavigate('/', '#top');
      }
    } else {
      if (window.location.hash) window.history.replaceState({}, '', '/'); // keep the address plain: no #top or #section
      window.scrollTo({ top: 0, behavior });
    }
  };

  const effectiveActiveSection = isSubPage ? currentRoute.replace('/', '') : activeSection;

  const handleOpenMenu = () => {
    setMobileMenuOpen(true);
  };

  const handleCloseMenu = () => {
    setMobileMenuOpen(false);
    toggleButtonRef.current?.focus();
  };

  return (
    <>
      <header className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__container container">
          {/* Logo on the Left */}
          <a
            href="/"
            onClick={handleLogoClick}
            className="navbar__brand"
            aria-label="Cybervex Digital Homepage"
          >
            <img
              src="/images/cybervex-logo-640.png"
              alt="Cybervex Digital Logo"
              className="navbar__logo-img"
              width="911"
              height="186"
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="navbar__nav" aria-label="Main Navigation">
            <ul className="navbar__list">
              {navLinks.map((link) => {
                const linkId = link.href.replace('#', '');
                const isActive = effectiveActiveSection === linkId;
                return (
                  <li key={link.label} className="navbar__item">
                    <a
                      href={pageRoutes[link.href] || (link.href === '#top' ? '/' : link.href)}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className={`navbar__link ${isActive ? 'navbar__link--active' : ''}`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="navbar__actions">
            <LanguageSwitcher />

            {/* Mobile Clean Floating Hamburger Button (No Box) */}
            <button
              ref={toggleButtonRef}
              type="button"
              className="navbar__mobile-toggle"
              onClick={handleOpenMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
              aria-label="Open navigation menu"
            >
              <Menu size={24} color="#FFFFFF" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Accessible Full-Screen Obsidian Mobile Menu Overlay */}
      <div
        id="mobile-navigation-menu"
        className={`mobile-menu ${mobileMenuOpen ? 'mobile-menu--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
        aria-hidden={!mobileMenuOpen}
      >
        {/* Top bar matching navbar branding and alignment */}
        <div className="mobile-menu__top-bar container">
          <a
            href="/"
            onClick={handleLogoClick}
            className="navbar__brand"
            aria-label="Cybervex Digital Homepage"
          >
            <img
              src="/images/cybervex-logo-640.png"
              alt="Cybervex Digital Logo"
              className="navbar__logo-img"
              width="911"
              height="186"
            />
          </a>

          {/* Floating Minimal Close Icon (No Box) */}
          <button
            ref={closeButtonRef}
            type="button"
            className="mobile-menu__close-btn"
            onClick={handleCloseMenu}
            aria-label="Close navigation menu"
          >
            <X size={24} color="#FFFFFF" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content with editorial alignment and staggered links */}
        <div className="mobile-menu__inner container">
          <div className="mobile-menu__meta">
            <span className="mobile-menu__tag">INDEX</span>
            <span className="mobile-menu__meta-line" aria-hidden="true" />
          </div>

          <nav className="mobile-menu__nav" aria-label="Mobile Navigation">
            <ul className="mobile-menu__list">
              {navLinks.map((link, idx) => {
                const linkId = link.href.replace('#', '');
                const isActive = effectiveActiveSection === linkId;
                return (
                  <li
                    key={link.label}
                    className="mobile-menu__item"
                  >
                    <a
                      href={pageRoutes[link.href] || (link.href === '#top' ? '/' : link.href)}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className={`mobile-menu__link ${isActive ? 'mobile-menu__link--active' : ''}`}
                    >
                      <span className="mobile-menu__num">0{idx + 1}</span>
                      <span className="mobile-menu__text">{link.label}</span>
                      <span className="mobile-menu__arrow" aria-hidden="true">→</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mobile-menu__footer">
            <div className="mobile-menu__footer-contact">
              <span className="mobile-menu__footer-tag">Direct Inquiries</span>
              <a
                href="mailto:info@cybervexdigital.com"
                className="mobile-menu__footer-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                info@cybervexdigital.com
              </a>
            </div>
            <div className="mobile-menu__footer-meta">
              <span className="mobile-menu__footnote">Cybervex Digital © 2026</span>
              <span className="mobile-menu__footnote-sep">•</span>
              <span className="mobile-menu__footnote">Monochrome Craft</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
