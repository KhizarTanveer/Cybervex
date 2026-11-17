import React from 'react';
import { ArrowUpRight } from 'lucide-react';

// Shared project card used by the home Projects section and the Projects page: image and title.
// Clicking it (or Enter / Space) calls onOpen to show the project's details popup.
export default function ProjectCard({ project, style, onOpen }) {
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(project);
    }
  };

  return (
    <article
      className="project-card project-card--clickable"
      style={style}
      role="button"
      tabIndex={0}
      aria-label={`${project.title}: view details`}
      onClick={() => onOpen(project)}
      onKeyDown={onKeyDown}
    >
      <div className="project-card__media">
        <img
          src={project.image}
          alt={project.title}
          className="project-card__image"
          loading="lazy"
          decoding="async"
          width="1400"
          height="875"
        />
      </div>

      <div className="project-card__body">
        <h3 className="project-card__title">{project.title}</h3>
        {/* Hint that the card opens the project details */}
        <span className="project-card__more" aria-hidden="true">
          See more
          <ArrowUpRight size={15} className="project-card__more-icon" />
        </span>
      </div>
    </article>
  );
}
