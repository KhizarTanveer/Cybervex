import React, { useEffect, useRef, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import { OPEN_SETTINGS_EVENT, getConsent, saveConsent } from '../lib/cookieConsent';
import './CookieConsent.css';

const CATEGORIES = [
  {
    id: 'necessary',
    title: 'Strictly necessary',
    text: 'Keep the site secure and working, and remember your cookie and language choices. Always on.',
    locked: true,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    text: 'Help us understand how visitors use the site (Google Analytics), so we can improve it.',
  },
  {
    id: 'marketing',
    title: 'Marketing',
    text: 'Measure our advertising and show you more relevant ads on other sites.',
  },
];

// Cookie banner: appears until the visitor chooses, and again from the footer's "Cookie Settings"
export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('main'); // 'main' | 'preferences'
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false });
  const firstButtonRef = useRef(null);

  useEffect(() => {
    // First visit: show shortly after the page has settled
    const timer = getConsent() ? null : setTimeout(() => setOpen(true), 900);
    const openSettings = () => {
      const saved = getConsent();
      setPrefs({ analytics: Boolean(saved?.analytics), marketing: Boolean(saved?.marketing) });
      setView('preferences');
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
    };
  }, []);

  useEffect(() => {
    if (open) firstButtonRef.current?.focus({ preventScroll: true });
  }, [open, view]);

  const choose = (choice) => {
    saveConsent(choice);
    setOpen(false);
    setView('main');
  };

  // Escape closes the settings screen when reopened from the footer (a choice already exists)
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && getConsent()) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-modal="false" aria-labelledby="cookie-banner-title">
      <div className="cookie-banner__head">
        <span className="cookie-banner__icon" aria-hidden="true">
          <Cookie size={20} />
        </span>
        <h2 id="cookie-banner-title" className="cookie-banner__title">
          {view === 'main' ? 'We value your privacy' : 'Cookie preferences'}
        </h2>
        {getConsent() && (
          <button type="button" className="cookie-banner__close" onClick={() => setOpen(false)} aria-label="Close cookie settings">
            <X size={18} />
          </button>
        )}
      </div>

      {view === 'main' ? (
        <>
          <p className="cookie-banner__text">
            We use cookies to keep our website working and, with your permission, to understand how it&apos;s used and
            improve our marketing. You can change your choice at any time. Read our{' '}
            <a href="/cookies-policy" className="cookie-banner__link">Cookies Policy</a>.
          </p>
          <div className="cookie-banner__actions">
            <button ref={firstButtonRef} type="button" className="cookie-banner__btn cookie-banner__btn--primary" onClick={() => choose({ analytics: true, marketing: true })}>
              Accept all
            </button>
            <button type="button" className="cookie-banner__btn" onClick={() => choose({ analytics: false, marketing: false })}>
              Reject all
            </button>
          </div>
          <button type="button" className="cookie-banner__text-btn" onClick={() => setView('preferences')}>
            Manage preferences
          </button>
        </>
      ) : (
        <>
          <ul className="cookie-banner__list">
            {CATEGORIES.map(({ id, title, text, locked }) => (
              <li key={id} className="cookie-banner__item">
                <div className="cookie-banner__item-text">
                  <span className="cookie-banner__item-title">{title}</span>
                  <span className="cookie-banner__item-desc">{text}</span>
                </div>
                <label className={`cookie-switch ${locked ? 'cookie-switch--locked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={locked ? true : prefs[id]}
                    disabled={locked}
                    onChange={(e) => setPrefs((p) => ({ ...p, [id]: e.target.checked }))}
                    aria-label={`${title} cookies`}
                  />
                  <span className="cookie-switch__track" aria-hidden="true" />
                </label>
              </li>
            ))}
          </ul>
          <div className="cookie-banner__actions">
            <button ref={firstButtonRef} type="button" className="cookie-banner__btn cookie-banner__btn--primary" onClick={() => choose(prefs)}>
              Save preferences
            </button>
            <button type="button" className="cookie-banner__btn" onClick={() => choose({ analytics: true, marketing: true })}>
              Accept all
            </button>
          </div>
        </>
      )}
    </div>
  );
}
