// Content-Security-Policy for the website and API. vercel.json carries the same policy for the
// site on Vercel — keep the two in sync when adding a new outside service.
// Allowed outside services: Google Fonts (Outfit) and Google Website Translator (language switcher).
export const cspDirectives = {
  'default-src': ["'self'"],
  // 'unsafe-inline' is only here because Google's translator runs an inline script (in a frame it
  // creates) that changes with every Google release. The site itself never injects HTML or runs
  // inline code, and scripts can still only come from this site and Google's translator.
  'script-src': ["'self'", "'unsafe-inline'", 'https://translate.google.com', 'https://translate.googleapis.com', 'https://translate-pa.googleapis.com', 'https://www.gstatic.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://www.gstatic.com', 'https://translate.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https://www.gstatic.com', 'https://www.google.com', 'https://translate.google.com', 'https://translate.googleapis.com', 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://translate.googleapis.com', 'https://translate-pa.googleapis.com'],
  'frame-src': ["'self'", 'https://translate.google.com', 'https://translate.googleapis.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};

// The same policy as one header string (used by tests and for vercel.json)
export const cspHeader = Object.entries(cspDirectives)
  .map(([name, values]) => `${name} ${values.join(' ')}`)
  .join('; ');
