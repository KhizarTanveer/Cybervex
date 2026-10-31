// SEO metadata for every page. Used in two places:
//   • at build time (vite.config.js) to write each page's own HTML file with its tags, so search
//     engines and link previews (WhatsApp, LinkedIn, Facebook) see the right title without JavaScript;
//   • in the browser (lib/seoHead.js) to update the tags when moving between pages.
// Keep every title and description unique, and only describe what the page really shows.

export const SITE_URL = 'https://www.cybervexdigital.com';
export const SITE_NAME = 'Cybervex Digital';

// 1200 × 630 preview image for social links
export const DEFAULT_IMAGE = {
  url: `${SITE_URL}/images/og-cybervex.jpg`,
  width: 1200,
  height: 630,
  alt: 'Cybervex Digital — digital marketing and business solutions',
};

export const pageSeo = {
  '/': {
    title: 'Digital Marketing & BPO Agency | Cybervex Digital',
    description:
      'Cybervex Digital provides digital marketing, SEO, website development, BPO and business support services to help startups and growing businesses scale.',
  },
  '/about': {
    title: 'About Cybervex Digital | Marketing & Business Support Team',
    description:
      'Meet Cybervex Digital: one team for digital marketing, technology, creative work and business support. Learn about our mission, vision and core values.',
  },
  '/projects': {
    title: 'Projects: Web Development, SEO & Google Ads | Cybervex',
    description:
      'See recent Cybervex Digital client work, from website development and SEO to Google Ads campaigns and local SEO that help businesses reach more customers.',
  },
  '/careers': {
    title: 'Careers at Cybervex Digital | Open Jobs, Apply Online',
    description:
      'Explore open roles at Cybervex Digital across business development, HR and app development. Read each job and apply online with your CV in a few minutes.',
  },
  '/contact': {
    title: 'Contact Cybervex Digital | Get a Quote for Your Project',
    description:
      'Tell us about your project. Contact Cybervex Digital by form, email or WhatsApp about digital marketing, web development or business support services.',
  },
  '/terms': {
    title: 'Terms & Conditions | Cybervex Digital',
    description:
      'The terms for using the Cybervex Digital website: enquiries and proposals, client agreements, payments, intellectual property, liability and governing law.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Cybervex Digital',
    description:
      'How Cybervex Digital collects, uses, shares and protects personal information from website visitors, clients and job applicants, and the rights you have.',
  },
  '/cookies-policy': {
    title: 'Cookie Policy | Cybervex Digital',
    description:
      'What cookies the Cybervex Digital website may use, including necessary, analytics, functional and marketing cookies, and how to manage your preferences.',
  },
};

// Private admin panel: never indexed, no canonical
export const adminSeo = {
  title: `Admin — ${SITE_NAME}`,
  description: '',
  robots: 'noindex, nofollow',
};

export const canonicalUrl = (path) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`);
