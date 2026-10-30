import { adminSeo, canonicalUrl, pageSeo } from '../data/seo';

// Find or create one head tag; an empty value removes it
function setTag(selector, create, attr, value) {
  let el = document.head.querySelector(selector);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

const meta = (key, keyAttr = 'name') => () => {
  const el = document.createElement('meta');
  el.setAttribute(keyAttr, key);
  return el;
};

const setMeta = (name, value) => setTag(`meta[name="${name}"]`, meta(name), 'content', value);
const setProperty = (property, value) => setTag(`meta[property="${property}"]`, meta(property, 'property'), 'content', value);

// Keeps the page's title, description, canonical and social tags in step with the current page.
// The first load already has the right tags from the page's own HTML file (built by vite.config.js).
export function applySeo(route) {
  if (route === '/admin') {
    document.title = adminSeo.title;
    setMeta('description', adminSeo.description);
    setMeta('robots', adminSeo.robots);
    setTag('link[rel="canonical"]', null, 'href', '');
    setProperty('og:url', '');
    return;
  }

  const { title, description } = pageSeo[route] || pageSeo['/'];
  const url = canonicalUrl(pageSeo[route] ? route : '/');
  document.title = title;
  setMeta('description', description);
  setMeta('robots', 'index, follow, max-image-preview:large');
  setTag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', url);
  setProperty('og:title', title);
  setProperty('og:description', description);
  setProperty('og:url', url);
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
}
