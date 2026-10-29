import React from 'react';

// Shared project card used by the home Projects section and the Projects page: image, title, description
export default function ProjectCard({ project }) {
  return (
    <article className="project-card">
      <div className="project-card__media">
        <img
          src={project.image}
          alt={project.title}
          className="project-card__image"
          loading="lazy"
        />
      </div>

      <div className="project-card__body">
        <h3 className="project-card__title">{project.title}</h3>
        <p className="project-card__description">{project.description}</p>
      </div>
    </article>
  );
}
