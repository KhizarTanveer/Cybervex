import React, { useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Check, ShieldAlert, Sparkles, Building2, ExternalLink } from 'lucide-react';
import { getServiceIcon } from '../data/serviceIcons';

export default function ServiceDetailsModal({
  service,
  isOpen,
  onClose,
  onPrev,
  onNext,
  totalServices = 23,
}) {
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button on open
    setTimeout(() => {
      if (closeBtnRef.current) closeBtnRef.current.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || !service) return null;

  // Dynamically resolve icon from lucide-react
  const IconComponent = getServiceIcon(service.iconName);

  return (
    <div
      className="service-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-service-title"
      onClick={onClose}
    >
      <div
        className="service-modal-container"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Chrome */}
        <div className="service-modal-header">
          <div className="service-modal-header__meta">
            <span className="service-modal-badge">
              <span className="service-modal-badge__number">{service.number}</span>
              <span className="service-modal-badge__divider">/</span>
              <span className="service-modal-badge__total">{totalServices}</span>
            </span>
          </div>

          <div className="service-modal-header__actions">
            {/* Quick Next/Prev Navigation */}
            <div className="service-modal-nav-arrows">
              <button
                type="button"
                className="service-modal-nav-btn"
                onClick={onPrev}
                aria-label="Previous service"
                title="Previous service (Left Arrow)"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                className="service-modal-nav-btn"
                onClick={onNext}
                aria-label="Next service"
                title="Next service (Right Arrow)"
              >
                <ArrowRight size={16} />
              </button>
            </div>

            <button
              type="button"
              className="service-modal-close-btn"
              onClick={onClose}
              ref={closeBtnRef}
              aria-label="Close service details"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="service-modal-body">
          {/* Hero Banner inside Modal */}
          <div className="service-modal-hero">
            <div className="service-modal-icon-wrapper" aria-hidden="true">
              <IconComponent size={28} className="service-modal-icon" />
            </div>
            <div className="service-modal-title-group">
              <h2 id="modal-service-title" className="service-modal-title">
                {service.title}
              </h2>
              {service.description && (
                <p className="service-modal-description">{service.description}</p>
              )}
            </div>
          </div>

          {/* Subgroups (e.g., for BPO or Events) */}
          {service.subgroups && service.subgroups.length > 0 ? (
            <div className="service-modal-subgroups">
              {service.subgroups.map((group, gIdx) => (
                <div key={gIdx} className="service-modal-subgroup-card">
                  <div className="service-modal-subgroup-title">
                    <Building2 size={16} className="service-modal-subgroup-icon" />
                    <h4>{group.title}</h4>
                    <span className="service-modal-subgroup-count">
                      {group.items.length} items
                    </span>
                  </div>
                  <ul className="service-modal-points-grid">
                    {group.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="service-modal-point-item">
                        <span className="service-modal-point-bullet" aria-hidden="true">
                          <Check size={13} />
                        </span>
                        <span className="service-modal-point-text">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            /* Flat list of all verbatim points */
            <div className="service-modal-points-section">
              <div className="service-modal-points-header">
                <h4 className="service-modal-points-heading">
                  Delivered Disciplines & Scope of Work
                </h4>
                <span className="service-modal-points-counter">
                  {service.points ? service.points.length : 0} points
                </span>
              </div>

              <ul className="service-modal-points-grid">
                {service.points &&
                  service.points.map((point, pIdx) => (
                    <li key={pIdx} className="service-modal-point-item">
                      <span className="service-modal-point-bullet" aria-hidden="true">
                        <Check size={13} />
                      </span>
                      <span className="service-modal-point-text">{point}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Important Qualification Notes & Compliance disclaimers */}
          {(service.notes || service.complianceNotice) && (
            <div className="service-modal-notes-box">
              <ShieldAlert size={18} className="service-modal-notes-icon" />
              <div className="service-modal-notes-content">
                <span className="service-modal-notes-label">Operational Note & Compliance</span>
                <p className="service-modal-notes-text">
                  {service.notes || service.complianceNotice}
                </p>
              </div>
            </div>
          )}

          {/* Bottom Action / CTA */}
          <div className="service-modal-footer">
            <div className="service-modal-footer__info">
              <Sparkles size={16} className="service-modal-footer__sparkle" />
              <span>Tailored execution scoped to your exact goals and business budget.</span>
            </div>
            <a
              href="#contact"
              className="service-modal-cta-btn"
              onClick={onClose}
            >
              <span>Discuss This Service</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
