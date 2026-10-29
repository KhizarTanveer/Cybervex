import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { LANGUAGES, getLanguage, restoreLanguage, setLanguage } from '../lib/translate';
import './LanguageSwitcher.css';

const flagSrc = (flag) => `/flags/${flag}.svg`;

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState(getLanguage);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const language = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  useEffect(() => {
    restoreLanguage();
  }, []);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const choose = (code) => {
    setOpen(false);
    if (code === current) return;
    setCurrent(code);
    setLanguage(code).catch(() => setCurrent(getLanguage()));
  };

  return (
    <div className="lang-switch notranslate" translate="no" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="lang-switch__button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Language: ${language.name}. Change language`}
      >
        <img src={flagSrc(language.flag)} alt="" className="lang-switch__flag" width="24" height="18" />
        <span className="lang-switch__code">{language.code.slice(0, 2).toUpperCase()}</span>
        <ChevronDown size={14} aria-hidden="true" className="lang-switch__chevron" />
      </button>

      {open && (
        <ul className="lang-switch__menu" aria-label="Choose a language">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                className={`lang-switch__option ${l.code === current ? 'lang-switch__option--active' : ''}`}
                onClick={() => choose(l.code)}
                aria-current={l.code === current ? 'true' : undefined}
                lang={l.code}
              >
                <img src={flagSrc(l.flag)} alt="" className="lang-switch__flag" width="24" height="18" />
                <span className="lang-switch__names">
                  <span className="lang-switch__native">{l.native}</span>
                  {l.native !== l.name && <span className="lang-switch__english">{l.name}</span>}
                </span>
                {l.code === current && <Check size={15} aria-hidden="true" className="lang-switch__check" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
