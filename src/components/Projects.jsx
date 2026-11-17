import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import useProjects from '../lib/useProjects';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';

export default function Projects({ onNavigate }) {
  const projects = useProjects();
  const [openProject, setOpenProject] = useState(null);
  // Only projects marked "Feature on the home page" in the admin panel appear here
  const featured = projects?.filter((project) => project.featured);
  const handleViewMore = (e) => {
    e.preventDefault();
    if (onNavigate) onNavigate('/projects');
  };

  if (featured?.length === 0) return null;

  return (
    <section id="work" className="section projects-section reveal-blur-section" aria-label="Projects">
      <div className="container">
        {/* Premium Container: header stays fixed, only the list scrolls */}
        <div className="projects-shell">
          <div className="projects-shell__header">
            <div className="projects-shell__heading">
              <h2 className="projects-shell__title">Our Projects</h2>
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
              {(featured || []).map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={setOpenProject} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {openProject && <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />}
    </section>
  );
}
