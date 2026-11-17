import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { PROJECT_CATEGORIES, projectCategories } from '../data/projectCategories';
import './ProjectModal.css';

const CLOSE_MS = 260; // matches the closing animation in ProjectModal.css

// Project details popup: full image, categories, title and description.
// Closes with the ✕ button, Escape or a click outside; the page behind doesn't scroll while open.
// Rendered into <body> so animated (transformed) page sections can't shift its fixed position.
export default function ProjectModal({ project, onClose }) {
  const [closing, setClosing] = useState(false);
  const closeRef = useRef(null);
  const modalRef = useRef(null);
  // Latest onClose without re-running the open/close effect when the parent re-renders
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => onCloseRef.current(), CLOSE_MS);
  }, []);

  useEffect(() => {
    const opener = document.activeElement;
    const modal = modalRef.current;
    // Freeze the page behind: the site scrolls on <html> (it has overflow-x set), so lock both.
    const html = document.documentElement;
    const before = { html: html.style.overflow, body: document.body.style.overflow };
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Some browsers (iOS Safari, some trackpads) still scroll the page through overflow: hidden,
    // so every wheel and touch scroll is stopped too — except inside the popup, while the popup
    // itself still has room to scroll in that direction (so it never hands the scroll to the page).
    const popupCanScroll = (target, dy) =>
      modal.contains(target) &&
      modal.scrollHeight > modal.clientHeight + 1 &&
      (dy > 0 ? modal.scrollTop + modal.clientHeight < modal.scrollHeight - 1 : dy < 0 && modal.scrollTop > 0);
    let touchY = 0;
    const onWheel = (e) => {
      if (!popupCanScroll(e.target, e.deltaY)) e.preventDefault();
    };
    const onTouchStart = (e) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      const y = e.touches[0].clientY;
      const dy = touchY - y; // finger moving up = scrolling down
      touchY = y;
      if (e.touches.length > 1 || !popupCanScroll(e.target, dy)) e.preventDefault();
    };
    document.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('wheel', onWheel);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      html.style.overflow = before.html;
      document.body.style.overflow = before.body;
      opener?.focus?.({ preventScroll: true });
    };
  }, [close]);

  const categories = PROJECT_CATEGORIES.filter((c) => projectCategories(project).includes(c.id));

  return createPortal(
    <div className={`project-modal-overlay ${closing ? 'is-closing' : ''}`} onClick={close} role="presentation">
      <div
        className="project-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="project-modal__close" onClick={close} ref={closeRef} aria-label="Close project details">
          <X size={20} aria-hidden="true" />
        </button>

        <div className="project-modal__media">
          <img src={project.image} alt={project.title} className="project-modal__image" decoding="async" />
        </div>

        <div className="project-modal__body">
          {categories.length > 0 && (
            <ul className="project-modal__tags" aria-label="Services">
              {categories.map((c) => (
                <li key={c.id} className="project-modal__tag">{c.label}</li>
              ))}
            </ul>
          )}
          <h2 id="project-modal-title" className="project-modal__title">{project.title}</h2>
          {project.description && <p className="project-modal__description">{project.description}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
