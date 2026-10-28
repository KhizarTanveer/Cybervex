import React from 'react';
import { agencyIntro } from '../data/agencyData';

export default function AgencyIntro() {
  return (
    <section id="about" className="section agency-intro-section reveal-blur-section" aria-label="Agency Introduction">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-label">{agencyIntro.label}</span>
          <h2 className="section-title agency-intro-heading">
            {agencyIntro.heading}
          </h2>
        </div>

        {/* Editorial Introduction Text */}
        <div className="agency-intro-grid">
          <div className="agency-intro-lead">
            <p className="agency-lead-text">
              {agencyIntro.leadText}
            </p>
          </div>

          <div className="agency-intro-body">
            <p className="agency-body-text">
              {agencyIntro.bodyParagraph}
            </p>
          </div>
        </div>

        {/* Agency Pillars Grid */}
        <div className="agency-pillars-grid reveal-stagger">
          {agencyIntro.pillars.map((pillar, index) => (
            <div key={pillar.title} className="pillar-card">
              <div className="pillar-card__header">
                <span className="pillar-card__index">0{index + 1}</span>
                <span className="pillar-card__indicator" aria-hidden="true" />
              </div>
              <h3 className="pillar-card__title">{pillar.title}</h3>
              <p className="pillar-card__description">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
