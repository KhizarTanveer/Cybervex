import React from 'react';
import { selectedWorkData } from '../data/agencyData';
import ProjectCard from './ProjectCard';

export default function ProjectsPage() {
  return (
    <section
      id="projects"
      className="section projects-section projects-page reveal-blur-section"
      aria-label="All Projects"
    >
      <div className="container">
        <header className="projects-page__header">
          <span className="section-label">Portfolio</span>
          <h1 className="projects-page__title">Projects</h1>
          <p className="projects-page__intro">
            Demonstrating our design philosophy, technical standards, and interface craftsmanship.
          </p>
          <p className="projects-shell__note">
            <span className="projects-shell__dot" aria-hidden="true" />
            All projects featured below are concept prototypes designed to illustrate creative capability.
          </p>
        </header>

        <div className="projects-grid projects-page__grid">
          {selectedWorkData.map((project, idx) => (
            <ProjectCard key={project.id} project={project} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
