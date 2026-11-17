import React from 'react';

// Shared project card used by the home Projects section and the Projects page: image and title
export default function ProjectCard({ project, style }) {
  return (
    <article className="project-card" style={style}>
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
      </div>
    </article>
  );
}
