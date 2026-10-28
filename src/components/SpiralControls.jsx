import React from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Orbit } from 'lucide-react';

const SERVICE_CATEGORIES_FILTER = [
  { id: 'all', label: 'All 23 Categories', startIdx: 0 },
  { id: 'marketing', label: 'Marketing & Ads', startIdx: 0 },
  { id: 'creative', label: 'Creative & Media', startIdx: 4 },
  { id: 'tech', label: 'Tech, Web & IT', startIdx: 6 },
  { id: 'bpo', label: 'BPO & Ops', startIdx: 9 },
  { id: 'events', label: 'Events & PR', startIdx: 12 },
  { id: 'strategy', label: 'Consulting & Retainers', startIdx: 17 },
];

export default function SpiralControls({
  onPrev,
  onNext,
  currentIndex,
  totalServices = 23,
  currentServiceTitle,
  viewMode,
  onToggleViewMode,
  activeFilter,
  onSelectFilter,
}) {
  const formattedCurrent = String(currentIndex + 1).padStart(2, '0');
  const formattedTotal = String(totalServices).padStart(2, '0');

  return (
    <div className="spiral-controls-container">
      {/* Category Quick-Jump Pills */}
      <div className="spiral-filter-bar" role="tablist" aria-label="Service category quick jump">
        {SERVICE_CATEGORIES_FILTER.map((cat) => (
          <button
            key={cat.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === cat.id}
            className={`spiral-filter-pill ${activeFilter === cat.id ? 'spiral-filter-pill--active' : ''}`}
            onClick={() => onSelectFilter(cat.id, cat.startIdx)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Interactive Control Panel */}
      <div className="spiral-control-panel">
        {/* Left: View Mode Toggle */}
        <div className="spiral-control-group spiral-control-group--left">
          <button
            type="button"
            className={`spiral-btn spiral-btn--mode ${viewMode === 'spiral' ? 'spiral-btn--mode-active' : ''}`}
            onClick={() => onToggleViewMode('spiral')}
            title="3D Spiral View"
            aria-label="Switch to 3D Spiral View"
          >
            <Orbit size={16} />
            <span className="spiral-btn__label">3D Spiral</span>
          </button>
          <button
            type="button"
            className={`spiral-btn spiral-btn--mode ${viewMode === 'grid' ? 'spiral-btn--mode-active' : ''}`}
            onClick={() => onToggleViewMode('grid')}
            title="Catalog Matrix Grid View"
            aria-label="Switch to Catalog Matrix Grid View"
          >
            <LayoutGrid size={16} />
            <span className="spiral-btn__label">Catalog Matrix</span>
          </button>
        </div>

        {/* Center: Live Counter & Service Focus Indicator */}
        <div className="spiral-counter-display">
          <span className="spiral-counter__number">
            <span className="spiral-counter__current">{formattedCurrent}</span>
            <span className="spiral-counter__slash">/</span>
            <span className="spiral-counter__total">{formattedTotal}</span>
          </span>
          <span className="spiral-counter__title" title={currentServiceTitle}>
            {currentServiceTitle}
          </span>
        </div>

        {/* Right: Manual Navigation Controls (Prev, Next) */}
        <div className="spiral-control-group spiral-control-group--right">
          <button
            type="button"
            className="spiral-btn spiral-btn--nav"
            onClick={onPrev}
            aria-label="Previous service card (Left Arrow)"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            className="spiral-btn spiral-btn--nav"
            onClick={onNext}
            aria-label="Next service card (Right Arrow)"
            title="Next (Right Arrow)"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
