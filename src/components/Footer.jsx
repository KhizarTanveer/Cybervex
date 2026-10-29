import React from 'react';
import { navLinks, footerData, pageRoutes } from '../data/agencyData';
import { ArrowUp } from 'lucide-react';

// Brand glyphs (lucide-react no longer ships brand icons), keyed by footerData.socials name
const socialIcons = {
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="url(#footer-ig-gradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="footer-ig-gradient" x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.3" stopColor="#FA7E1E" />
          <stop offset="0.55" stopColor="#D62976" />
          <stop offset="0.8" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="url(#footer-ig-gradient)" stroke="none" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96zM3 9.75h3.96V21H3V9.75zm6.45 0h3.8v1.54h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.74 2.63 4.74 6.06V21h-3.96v-5.07c0-1.21-.02-2.77-1.69-2.77-1.69 0-1.95 1.32-1.95 2.68V21H9.45V9.75z" />
    </svg>
  ),
  Threads: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.6 7.6C17.4 4.8 15 3.2 11.9 3.2 7.1 3.2 4.2 6.7 4.2 12s2.9 8.8 7.7 8.8c3.9 0 6.9-2.2 6.9-5.4 0-2.7-2.1-4.3-5.2-4.3-2.4 0-4 1.2-4 2.9 0 1.6 1.4 2.6 3.1 2.6 2.6 0 4.2-2 4.2-5.4 0-2.4-1.3-3.9-3.3-3.9-1.4 0-2.4.6-3 1.5" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.87.25-1.46 1.5-1.46h1.6V4.36c-.28-.04-1.23-.12-2.33-.12-2.31 0-3.89 1.41-3.89 4V10.4H7.8v3h2.58V21h3.12z" />
    </svg>
  ),
  Gmail: (
    <svg viewBox="52 42 88 66">
      <path fill="#4285F4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
      <path fill="#34A853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
      <path fill="#FBBC04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
      <path fill="#EA4335" d="M72 74V48l24 18 24-18v26L96 92" />
      <path fill="#C5221F" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
    </svg>
  ),
};

export default function Footer({ currentRoute = '/', onNavigate }) {
  const isSubPage = currentRoute !== '/';

  const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (isSubPage) {
      if (onNavigate) {
        onNavigate('/', '#top');
      }
    } else {
      scrollToTop(e);
    }
  };

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';

    // 1. Page Links (About, Contact)
    const pageRoute = pageRoutes[href];
    if (pageRoute) {
      if (currentRoute === pageRoute) {
        window.scrollTo({ top: 0, behavior });
      } else if (onNavigate) {
        onNavigate(pageRoute);
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
        window.scrollTo({ top: 0, behavior });
      }
      return;
    }

    // 3. Other anchors
    if (isSubPage) {
      if (onNavigate) {
        onNavigate('/', href);
      }
      return;
    }

    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  };

  return (
    <footer className="footer" aria-label="Site Footer">
      <div className="container">
        {/* Matte Glass Panel */}
        <div className="footer__glass">
          <div className="footer__top">
            {/* Brand */}
            <div className="footer__brand">
              <a
                href={isSubPage ? '/' : '#top'}
                onClick={handleLogoClick}
                className="footer__brand-link"
                aria-label="Cybervex Digital Homepage"
              >
                <img
                  src="/images/cybervex-logo-640.png"
                  alt="Cybervex Digital Logo"
                  className="footer__logo-img"
                  width="911"
                  height="186"
                />
              </a>
              <p className="footer__tagline">{footerData.tagline}</p>
            </div>

            {/* Navigation */}
            <nav aria-label="Footer navigation">
              <ul className="footer__nav-list">
                {navLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={pageRoutes[link.href] || link.href}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className="footer__nav-link"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Connect: icon-only */}
            <ul className="footer__social-list" aria-label="Connect">
              {footerData.socials.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`footer__social-link footer__social-link--${social.name.toLowerCase()}`}
                    aria-label={social.name}
                    title={social.name}
                  >
                    {socialIcons[social.name]}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__bottom">
            <p className="footer__copyright">{footerData.copyright}</p>
            <button
              type="button"
              onClick={scrollToTop}
              className="footer__back-to-top"
              aria-label="Scroll back to top of page"
            >
              <span>Back to top</span>
              <ArrowUp size={14} className="footer__back-icon" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
