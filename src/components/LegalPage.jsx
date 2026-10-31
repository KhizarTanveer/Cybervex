import React from 'react';
import { Mail } from 'lucide-react';
import { legalPages } from '../data/legalData';
import { openCookieSettings } from '../lib/cookieConsent';
import './LegalPage.css';

const CONTACT_EMAIL = 'info@cybervexdigital.com';
const URL_ONLY = /^https?:\/\/\S+$/;

// "Website: https://…" and bare URLs become links; everything else is plain text
function Text({ children }) {
  const match = children.match(/^(.*?)(https?:\/\/\S+)$/);
  if (!match) return children;
  return (
    <>
      {match[1]}
      <a href={match[2]} className="legal-page__link">{match[2]}</a>
    </>
  );
}

function ListItem({ item }) {
  if (typeof item === 'string') return <li>{item}</li>;
  return (
    <li>
      <strong>{item.label}:</strong> {item.text}
    </li>
  );
}

function Block({ block }) {
  if (block.h3) return <h3 className="legal-page__subheading">{block.h3}</h3>;
  if (block.ul) {
    return (
      <ul className="legal-page__list">
        {block.ul.map((item, i) => <ListItem key={i} item={item} />)}
      </ul>
    );
  }
  if (block.ol) {
    return (
      <ol className="legal-page__list legal-page__list--numbered">
        {block.ol.map((item, i) => <ListItem key={i} item={item} />)}
      </ol>
    );
  }
  return (
    <p className={URL_ONLY.test(block.p) ? 'legal-page__url' : undefined}>
      {block.label && <strong>{block.label}: </strong>}
      <Text>{block.p}</Text>
    </p>
  );
}

// One page per legal document (route: /terms, /privacy-policy, /cookies-policy)
export default function LegalPage({ route }) {
  const page = legalPages[route];
  if (!page) return null;

  return (
    <section className="section legal-page" aria-labelledby="legal-page-title">
      <div className="container legal-page__container">
        <header className="legal-page__header">
          <h1 id="legal-page-title" className="legal-page__title">{page.title}</h1>
        </header>

        <div className="legal-page__body">
          {page.sections.map((section, i) => (
            <section key={section.heading} className="legal-page__section">
              <h2 className="legal-page__heading">
                <span className="legal-page__number">{String(i + 1).padStart(2, '0')}</span>
                {section.heading}
              </h2>
              {section.blocks.map((block, j) => <Block key={j} block={block} />)}
            </section>
          ))}
        </div>

        <aside className="legal-page__contact">
          <p>
            Questions about this policy? Email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="legal-page__link">
              <Mail size={15} aria-hidden="true" /> {CONTACT_EMAIL}
            </a>
          </p>
          {route === '/cookies-policy' && (
            <button type="button" className="legal-page__btn" onClick={openCookieSettings}>
              Manage cookie settings
            </button>
          )}
        </aside>
      </div>
    </section>
  );
}
