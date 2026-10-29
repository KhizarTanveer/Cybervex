import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import useProjects from '../lib/useProjects';
import ProjectCard from './ProjectCard';

export default function Projects({ onNavigate }) {
  const projects = useProjects();
  const handleViewMore = (e) => {
    e.preventDefault();
    if (onNavigate) onNavigate('/projects');
  };

  return (
    <section id="work" className="section projects-section reveal-blur-section" aria-label="Projects">
      <div className="container">
        {/* Premium Container: header stays fixed, only the list scrolls */}
        <div className="projects-shell">
          <div className="projects-shell__header">
            <div className="projects-shell__heading">
              <h2 className="projects-shell__title">Projects</h2>
              <p className="projects-shell__note">
                <span className="projects-shell__dot" aria-hidden="true" />
                All projects featured below are concept prototypes designed to illustrate creative capability.
              </p>
            </div>
            <a href="/projects" onClick={handleViewMore} className="projects-view-more">
              <span>View more</span>
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div
            className="projects-scroll"
            tabIndex={0}
            role="region"
            aria-label="Projects list"
          >
            <div className="projects-grid">
              {projects.map((project, idx) => (
                <ProjectCard key={project.id} project={project} index={idx} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
