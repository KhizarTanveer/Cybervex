import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServicesPreview from './components/ServicesPreview';
import Projects from './components/Projects';
import ContactPage from './components/ContactPage';
import ProjectsPage from './components/ProjectsPage';
import AboutPage from './components/AboutPage';
import Footer from './components/Footer';
import { useScrollReveal } from './hooks/useScrollReveal';
import './App.css';

// Resolve the page route from the URL (supports /about, #/about, #about-page, /projects, /contact, #contact)
const getRouteFromLocation = () => {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname;
  const hash = window.location.hash;
  if (path === '/about' || hash === '#/about' || hash === '#about-page') {
    return '/about';
  }
  if (path === '/projects' || hash === '#/projects') {
    return '/projects';
  }
  if (path === '/contact' || hash === '#contact' || hash === '#/contact') {
    return '/contact';
  }
  return '/';
};

const pageTitles = {
  '/about': 'About Us — Cybervex Digital | Growing Together, Building for the Future',
  '/projects': 'Projects — Cybervex Digital',
  '/contact': 'Contact — Cybervex Digital',
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(getRouteFromLocation);

  // Keep document title synchronized with active route
  useEffect(() => {
    document.title = pageTitles[currentRoute] || 'Cybervex Digital — Digital Agency';
  }, [currentRoute]);

  // Dedicated pages always open at the top. Runs after the new page renders,
  // so the previous page's scroll position can't carry over.
  useLayoutEffect(() => {
    if (currentRoute !== '/') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentRoute]);

  // Handle browser back and forward history buttons
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      const route = getRouteFromLocation();
      if (route !== '/') {
        // Legacy in-page #contact anchors (e.g. service CTAs) now open the Contact page
        if (route === '/contact' && window.location.pathname !== '/contact') {
          window.history.replaceState({}, '', '/contact');
        }
        setCurrentRoute(route);
      } else {
        setCurrentRoute('/');
        if (hash) {
          setTimeout(() => {
            const id = hash.replace('#', '');
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 60);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Programmatic client navigation handler
  const handleNavigate = useCallback((path, targetAnchor) => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReducedMotion ? 'auto' : 'smooth';

    if (path && path !== '/') {
      window.history.pushState({}, '', path);
      setCurrentRoute(path);
    } else {
      // Navigating back to home '/'
      const newUrl = targetAnchor ? `/${targetAnchor}` : '/';
      window.history.pushState({}, '', newUrl);
      setCurrentRoute('/');

      if (targetAnchor) {
        setTimeout(() => {
          const id = targetAnchor.replace('#', '');
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({ behavior });
          } else {
            window.scrollTo({ top: 0, behavior });
          }
        }, 60);
      } else {
        window.scrollTo({ top: 0, behavior });
      }
    }
  }, []);

  // Initialize scroll-based blur reveal, re-running whenever route changes
  useScrollReveal(currentRoute);

  return (
    <div className="cybervex-app">
      {/* 1. Brand Navigation */}
      <Navbar currentRoute={currentRoute} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <main id="main-content">
        {currentRoute === '/about' ? (
          /* Dedicated About Us Page */
          <AboutPage />
        ) : currentRoute === '/projects' ? (
          /* Dedicated Projects Page */
          <ProjectsPage />
        ) : currentRoute === '/contact' ? (
          /* Dedicated Contact Page */
          <ContactPage />
        ) : (
          /* Homepage Sections (100% Preserved) */
          <>
            {/* 2. Hero Section */}
            <Hero />

            {/* 3. Services Preview */}
            <ServicesPreview />

            {/* 5. Projects (Concept Demonstrators) */}
            <Projects onNavigate={handleNavigate} />
          </>
        )}
      </main>

      {/* 8. Brand Footer */}
      <Footer currentRoute={currentRoute} onNavigate={handleNavigate} />
    </div>
  );
}
