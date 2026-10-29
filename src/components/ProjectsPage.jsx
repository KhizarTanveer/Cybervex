import React from 'react';
import useProjects from '../lib/useProjects';
import ProjectCard from './ProjectCard';

export default function ProjectsPage() {
  const projects = useProjects();

  return (
    <section
      id="projects"
      className="section projects-section projects-page reveal-blur-section"
      aria-label="All Projects"
    >
      <div className="container">
        <header className="projects-page__header">
          <h1 className="projects-page__title">Projects</h1>
          <p className="projects-page__intro">
            Demonstrating our design philosophy, technical standards, and interface craftsmanship.
          </p>
        </header>

        <div className="projects-grid projects-page__grid">
          {(projects || []).map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}
