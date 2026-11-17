// Project categories: the filter bar on the Projects page and the checkboxes in the admin panel.
// Shared with the server (server/index.js), which stores only these ids.
export const PROJECT_CATEGORIES = [
  { id: 'google-ads', label: 'Google Ads' },
  { id: 'meta-ads', label: 'Meta Ads' },
  { id: 'web-development', label: 'Website Development', shortLabel: 'Websites' }, // shortLabel: phones
];

const CATEGORY_IDS = new Set(PROJECT_CATEGORIES.map((c) => c.id));

// Known ids only, each once
export const cleanCategories = (list) => [...new Set(list)].filter((id) => CATEGORY_IDS.has(id));

// Projects saved before categories existed: guess from the title ("Docx Hub - Google Ads",
// "Murshid Interior - Google & Meta Ads", "Terra Luxuria - WordPress", …)
export const guessCategories = (title = '') => {
  const t = title.toLowerCase();
  const found = [];
  if (/google/.test(t)) found.push('google-ads');
  if (/\bmeta\b|facebook|instagram/.test(t)) found.push('meta-ads');
  if (/website|web app|web development|wordpress|shopify|mern|e-?commerce|landing page/.test(t)) found.push('web-development');
  return found;
};

// A project's categories: the saved ones, or a guess for older projects
export const projectCategories = (project) =>
  Array.isArray(project.categories) ? project.categories : guessCategories(project.title);
