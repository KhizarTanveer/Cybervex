import React from 'react';

// Shared project card used by the home Projects section and the Projects page
export default function ProjectCard({ project, index }) {
  return (
    <article className="project-card">
      <div className="project-card__media">
        <img
          src={project.image}
          alt={`${project.title} — ${project.conceptBadge}`}
          className="project-card__image"
          loading="lazy"
        />
        <span className="project-card__badge">{project.conceptBadge}</span>
        <span className="project-card__index" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div className="project-card__body">
        <div className="project-card__meta">
          <span className="project-card__category">{project.category}</span>
          <span className="project-card__year">{project.year}</span>
        </div>
        <h3 className="project-card__title">{project.title}</h3>
        <p className="project-card__description">{project.description}</p>
        <div className="project-card__tags">
          {project.tags.map((tag) => (
            <span key={tag} className="project-card__tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
