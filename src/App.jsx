import React, { useState, useEffect, useLayoutEffect, useCallback, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ServicesPreview from './components/ServicesPreview';
import Projects from './components/Projects';
import ContactPage from './components/ContactPage';
import ProjectsPage from './components/ProjectsPage';
import AboutPage from './components/AboutPage';
import CareersPage from './components/CareersPage';

// Private admin panel: loaded only when its private address is opened (see lib/adminPath.js)
const AdminPage = lazy(() => import('./components/AdminPage'));
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import { useScrollReveal } from './hooks/useScrollReveal';
import { PUBLIC_PATHS, isAdminPath } from './lib/adminPath';
import { applySeo } from './lib/seoHead';
import './App.css';

// The address without a trailing slash, so /about/ works like /about
const currentPath = () => window.location.pathname.replace(/\/+$/, '') || '/';

// Resolve the page route from the URL (supports /about, #/about, #about-page, /projects, /careers, /contact, #contact)
const getRouteFromLocation = () => {
  if (typeof window === 'undefined') return '/';
  const path = currentPath();
  const hash = window.location.hash;
  if (path === '/about' || hash === '#/about' || hash === '#about-page') {
    return '/about';
  }
  if (path === '/projects' || hash === '#/projects') {
    return '/projects';
  }
  if (path === '/careers' || hash === '#/careers') {
    return '/careers';
  }
  if (path === '/contact' || hash === '#contact' || hash === '#/contact') {
    return '/contact';
  }
  return '/';
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(getRouteFromLocation);
  // An unknown address might be the admin panel's private one; render nothing until it's checked
  const [checkingPath, setCheckingPath] = useState(() => !PUBLIC_PATHS.has(currentPath()));

  useEffect(() => {
    if (!checkingPath) return undefined;
    let cancelled = false;
    isAdminPath(window.location.pathname)
      .catch(() => false)
      .then((isAdmin) => {
        if (cancelled) return;
        if (isAdmin) setCurrentRoute('/admin');
        setCheckingPath(false);
      });
    return () => {
      cancelled = true;
    };
  }, [checkingPath]);

  // Keep the title, description, canonical and social tags in step with the page (data/seo.js)
  useEffect(() => {
    if (!checkingPath) applySeo(currentRoute);
  }, [currentRoute, checkingPath]);

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
      if (!PUBLIC_PATHS.has(currentPath())) {
        setCheckingPath(true);
        return;
      }
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
      // The top of the home page is just "/", without a "#top" in the address
      const newUrl = targetAnchor && targetAnchor !== '#top' ? `/${targetAnchor}` : '/';
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

  if (checkingPath) return <div className="cybervex-app" />;

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
        ) : currentRoute === '/admin' ? (
          <Suspense fallback={<div className="admin-page" />}>
            <AdminPage />
          </Suspense>
        ) : currentRoute === '/careers' ? (
          /* Careers: open positions */
          <CareersPage />
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

      {/* Site-wide assistant: AI chat + direct WhatsApp (not needed in the admin panel) */}
      {currentRoute !== '/admin' && <ChatBot onNavigate={handleNavigate} />}
    </div>
  );
}
