import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

export default function SpiralServiceCard({
  service,
  style,
  isActive,
  isFocal,
  onCardClick,
  onDetailsClick,
  onSelect,
  onActivate,
}) {
  const IconComponent = LucideIcons[service.iconName] || LucideIcons.Sparkles;
  const totalPoints = service.points ? service.points.length : 0;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onCardClick) {
      onCardClick();
    } else if (isActive && onSelect) {
      onSelect(service);
    } else if (onActivate) {
      onActivate();
    }
  };

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    if (onDetailsClick) {
      onDetailsClick();
    } else if (onSelect) {
      onSelect(service);
    }
  };

  return (
    <article
      className={`spiral-card ${isActive ? 'spiral-card--active' : ''} ${
        isFocal ? 'spiral-card--focal' : ''
      }`}
      style={style}
      onClick={handleClick}
      role="button"
      tabIndex={isActive ? 0 : -1}
      aria-label={`${service.number} ${service.title}`}
      aria-current={isActive ? 'true' : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(service);
        }
      }}
    >
      {/* Ambient Inner Glow Rim */}
      <div className="spiral-card__glow-rim" aria-hidden="true" />

      {/* Card Header */}
      <div className="spiral-card__header">
        <div className="spiral-card__badge-group">
          <span className="spiral-card__number">{service.number}</span>
          <span className="spiral-card__category">{service.shortCategory}</span>
        </div>

        <div className="spiral-card__icon-box" aria-hidden="true">
          <IconComponent size={20} className="spiral-card__icon" />
        </div>
      </div>

      {/* Card Title & Description */}
      <div className="spiral-card__body">
        <h3 className="spiral-card__title">{service.title}</h3>
        {service.description && (
          <p className="spiral-card__desc">{service.description}</p>
        )}
      </div>

      {/* Highlights / Preview Points */}
      {service.highlights && service.highlights.length > 0 && (
        <div className="spiral-card__highlights">
          <span className="spiral-card__highlights-label">
            <Sparkles size={12} className="spiral-card__sparkle-icon" />
            Core Disciplines
          </span>
          <ul className="spiral-card__highlights-list">
            {service.highlights.slice(0, 3).map((hl, idx) => (
              <li key={idx} className="spiral-card__highlight-item">
                <span className="spiral-card__bullet" aria-hidden="true" />
                <span className="spiral-card__highlight-text">{hl}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Card Footer / Action */}
      <div className="spiral-card__footer">
        <span className="spiral-card__points-count">
          {totalPoints} service points
        </span>
        <button
          type="button"
          className="spiral-card__action-btn"
          onClick={handleDetailsClick}
          aria-label={`Explore full details for ${service.title}`}
          tabIndex={isActive ? 0 : -1}
        >
          <span>Explore Details</span>
          <ArrowUpRight size={15} className="spiral-card__action-arrow" />
        </button>
      </div>
    </article>
  );
}
