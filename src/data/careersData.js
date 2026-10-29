/**
 * Careers page text. Jobs themselves are managed in the admin panel (/admin → Jobs)
 * and stored in MongoDB; `openPositions` below is only the starter set the server
 * copies into an empty database, and what the page shows if the server can't be reached.
 */

export const careersContent = {
  heading: 'Careers',
  intro:
    'Join a team that brings digital, creative and business support together under one roof. We are looking for people who care about quality work and clear communication.',
  applyEmail: 'info@cybervexdigital.com',
};

// Job types offered in the admin panel's job form (also checked by the server)
export const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

export const openPositions = [
  {
    id: 'business-developer',
    title: 'Business Developer',
    department: 'Sales & Growth',
    type: 'Full-time',
    location: 'On-site',
    experience: '1–3 years',
    summary:
      'Find and build relationships with new clients, understand their needs, and turn them into long-term partnerships across our digital and business support services.',
    skills: ['Lead generation', 'Client meetings', 'Proposals', 'Negotiation'],
  },
  {
    id: 'hr-executive',
    title: 'HR Executive',
    department: 'Human Resources',
    type: 'Full-time',
    location: 'On-site',
    experience: '1–2 years',
    summary:
      'Manage recruitment from job posting to onboarding, keep employee records organised, and support a positive, professional workplace for the whole team.',
    skills: ['Recruitment', 'Onboarding', 'HR records', 'Employee relations'],
  },
  {
    id: 'app-developer',
    title: 'App Developer',
    department: 'Technology',
    type: 'Full-time',
    location: 'On-site / Hybrid',
    experience: '2+ years',
    summary:
      'Build and maintain fast, reliable mobile apps for our clients, from first screens to store release, working closely with our design and web teams.',
    skills: ['React Native / Flutter', 'REST APIs', 'Android & iOS', 'Git'],
  },
];

