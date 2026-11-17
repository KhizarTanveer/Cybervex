import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import useProjects from '../lib/useProjects';
import { PROJECT_CATEGORIES, projectCategories } from '../data/projectCategories';
import ProjectCard from './ProjectCard';
import ProjectFilter from './ProjectFilter';
import ProjectModal from './ProjectModal';

const ALL = 'all';

// Each card gets its own view-transition name, so the browser can glide it to its new place
const transitionName = (id) => `project-${String(id).replace(/[^\w-]/g, '')}`;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ProjectsPage() {
  const projects = useProjects();
  const [filter, setFilter] = useState(ALL);
  const [openProject, setOpenProject] = useState(null);

  const list = projects || [];
  const options = [{ id: ALL, label: 'All' }, ...PROJECT_CATEGORIES];
  const visible = filter === ALL ? list : list.filter((p) => projectCategories(p).includes(filter));

  // Cards that stay slide to their new spot, removed ones shrink away and new ones rise in
  // (View Transitions; browsers without it simply switch instantly)
  const chooseFilter = (id) => {
    if (id === filter) return;
    const update = () => flushSync(() => setFilter(id));
    if (document.startViewTransition && !prefersReducedMotion()) document.startViewTransition(update);
    else update();
  };

  return (
    <section
      id="projects"
      className="section projects-section projects-page reveal-blur-section"
      aria-label="All Projects"
    >
      <div className="container">
        <header className="projects-page__header">
          <h1 className="projects-page__title">Our Projects</h1>
          <p className="projects-page__intro">
            Demonstrating our design philosophy, technical standards, and interface craftsmanship.
          </p>
        </header>

        {projects && <ProjectFilter options={options} value={filter} onChange={chooseFilter} />}

        {/* Keeps room for the cards while they load, so the footer doesn't jump down when they appear */}
        <div className={`projects-grid projects-page__grid ${projects ? '' : 'projects-page__grid--loading'}`}>
          {visible.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              style={{ viewTransitionName: transitionName(project.id), viewTransitionClass: 'project-card' }}
              onOpen={setOpenProject}
            />
          ))}
        </div>

        {projects && !visible.length && <p className="projects-page__empty">No projects in this category yet.</p>}
      </div>

      {openProject && <ProjectModal project={openProject} onClose={() => setOpenProject(null)} />}
    </section>
  );
}
