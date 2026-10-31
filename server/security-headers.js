// Content-Security-Policy for the website and API. vercel.json carries the same policy for the
// site on Vercel — keep the two in sync when adding a new outside service.
// Allowed outside services: Google Fonts (Outfit), Google Website Translator (language switcher)
// and Google Tag Manager / Google Analytics (the GTM snippet in index.html).
const googleTags = {
  scripts: ['https://www.googletagmanager.com', 'https://*.googletagmanager.com'],
  connect: ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'],
  images: ['https://*.google-analytics.com', 'https://*.googletagmanager.com'],
};

export const cspDirectives = {
  'default-src': ["'self'"],
  // 'unsafe-inline' is here because Google's translator runs an inline script (in a frame it
  // creates) that changes with every Google release, and the GTM snippet is inline. The site itself
  // never injects HTML, and scripts can still only come from this site and these Google services.
  'script-src': ["'self'", "'unsafe-inline'", 'https://translate.google.com', 'https://translate.googleapis.com', 'https://translate-pa.googleapis.com', 'https://www.gstatic.com', ...googleTags.scripts],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://www.gstatic.com', 'https://translate.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https://www.gstatic.com', 'https://www.google.com', 'https://translate.google.com', 'https://translate.googleapis.com', 'https://fonts.gstatic.com', ...googleTags.images],
  'connect-src': ["'self'", 'https://translate.googleapis.com', 'https://translate-pa.googleapis.com', ...googleTags.connect],
  // googletagmanager.com: GTM's Preview / Tag Assistant mode
  'frame-src': ["'self'", 'https://translate.google.com', 'https://translate.googleapis.com', 'https://www.googletagmanager.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};

// The same policy as one header string (used by tests and for vercel.json)
export const cspHeader = Object.entries(cspDirectives)
  .map(([name, values]) => `${name} ${values.join(' ')}`)
  .join('; ');
