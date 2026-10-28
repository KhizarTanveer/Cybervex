/**
 * Cybervex Digital — Agency Content Data
 * Strictly adheres to project specification:
 * - Official logo & monochrome aesthetic
 * - 5 core services
 * - 4 conceptual project demos (explicitly marked as concepts)
 * - Minimal text-based contact placeholder (no CTA button)
 */

export const navLinks = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

// Nav entries that open dedicated pages instead of scrolling to a home section
export const pageRoutes = {
  '#about': '/about',
  '#projects': '/projects',
  '#contact': '/contact',
};

export const heroContent = {
  label: 'Digital Agency / Engineered for Excellence',
  headline: 'We turn ideas into digital experiences.',
  description:
    'Cybervex Digital operates at the convergence of disciplined strategy, refined aesthetics, and modern web architecture. We partner with ambitious visionaries to engineer digital platforms that leave an indelible impression.',
  metrics: [
    { value: '05', label: 'Core Disciplines' },
    { value: '100%', label: 'Monochrome Precision' },
    { value: '0.1s', label: 'Optimal Performance' },
  ],
};

export const agencyIntro = {
  label: 'About Cybervex Digital',
  heading: 'Built for ideas. Designed for impact.',
  leadText:
    'We believe digital craft is not merely about ornamentation; it is the art of translating raw ambition into purposeful, high-velocity experiences.',
  bodyParagraph:
    'From bespoke digital platforms to architectural brand systems, our workflow unites design rigor with technological depth. Every interface we build is calibrated for clarity, structural balance, and seamless interaction.',
  pillars: [
    {
      title: 'Strategic Rigor',
      description: 'Grounding every interface design in foundational intent, user clarity, and technological longevity.',
    },
    {
      title: 'Architectural Craft',
      description: 'Employing clean engineering paradigms to deliver lightweight, responsive, and resilient codebases.',
    },
    {
      title: 'Timeless Aesthetic',
      description: 'Championing a refined monochrome visual philosophy that transcends ephemeral trends.',
    },
  ],
};

export const servicesData = [
  {
    number: '01',
    title: 'Web Development',
    summary:
      'High-performance web applications and responsive architectures built with precision code and modern web standards.',
    deliverables: ['Custom Web Architecture', 'React & Next.js Platforms', 'Component Design Systems', 'Speed & Accessibility Optimization'],
  },
  {
    number: '02',
    title: 'UI/UX Design',
    summary:
      'Intuitive user interfaces and deliberate design systems engineered for effortless user journeys and tactile digital immersion.',
    deliverables: ['Interactive Wireframing', 'Design Systems & Tokens', 'High-Fidelity Prototyping', 'Usability & Journey Mapping'],
  },
  {
    number: '03',
    title: 'Branding & Graphic Design',
    summary:
      'Definitive visual identities, editorial typography, and disciplined brand guidelines crafted to establish enduring brand equity.',
    deliverables: ['Monogram & Logo Systems', 'Editorial Typography Systems', 'Digital Brand Guidelines', 'Asset & Collateral Design'],
  },
  {
    number: '04',
    title: 'Digital Marketing',
    summary:
      'Targeted positioning strategies, content distribution frameworks, and quantitative campaign execution for modern brands.',
    deliverables: ['Brand Positioning Strategy', 'Search & Discoverability', 'Content Distribution', 'Performance Analytics'],
  },
  {
    number: '05',
    title: 'AI Creative Solutions',
    summary:
      'Integration of modern machine intelligence, generative visual pipelines, and bespoke automated workflows into creative operations.',
    deliverables: ['Generative Asset Pipelines', 'Automated Content Systems', 'Intelligent Workflow Architecture', 'Next-Gen Interface Integration'],
  },
];

export const selectedWorkData = [
  {
    id: 'concept-apex',
    title: 'Apex Global Financial Infrastructure',
    category: 'Web Development / UI Architecture',
    year: '2026',
    isConcept: true,
    conceptBadge: 'Concept Prototype',
    image: '/images/project-apex.jpg',
    description:
      'An exploratory institutional fintech dashboard architecture exploring ultra-low latency data presentation and high-density typography.',
    tags: ['Fintech Concept', 'React Architecture', 'Data Density'],
  },
  {
    id: 'concept-aura',
    title: 'Aura Spatial Computing Interface',
    category: 'UI/UX Exploration / Ambient Systems',
    year: '2026',
    isConcept: true,
    conceptBadge: 'Concept Prototype',
    image: '/images/project-aura.jpg',
    description:
      'An avant-garde interaction model studying spatial typography, monochrome layering, and micro-gestural interface controls.',
    tags: ['Spatial Systems', 'Interface Exploration', 'Ambient UI'],
  },
  {
    id: 'concept-veloce',
    title: 'Veloce Hypercar Digital Configurator',
    category: 'Branding & Web Experience',
    year: '2026',
    isConcept: true,
    conceptBadge: 'Concept Prototype',
    image: '/images/project-veloce.jpg',
    description:
      'A minimalist automotive showcase and interactive 3D configurator concept celebrating aerodynamic form and tactile material finishes.',
    tags: ['Automotive Concept', 'Interactive 3D', 'Editorial Craft'],
  },
  {
    id: 'concept-kinetics',
    title: 'Kinetics Creative Studio Operating Engine',
    category: 'AI Creative Solutions / System',
    year: '2026',
    isConcept: true,
    conceptBadge: 'Concept Prototype',
    image: '/images/project-kinetics.jpg',
    description:
      'A speculative generative motion studio workflow linking algorithmic art generation with distributed rendering pipelines.',
    tags: ['Generative Media', 'Applied AI', 'Studio Engine'],
  },
];

export const closingContent = {
  label: 'Direct Channel',
  heading: 'Have an idea in mind?',
  subheading:
    'We collaborate with select founders, brands, and digital teams worldwide. Reach out directly to initiate dialogue on your next venture.',
  contactEmail: 'info@cybervexdigital.com',
};

export const footerData = {
  copyright: '© 2026 Cybervex Digital. All rights reserved.',
  tagline: 'We turn ideas into digital experiences.',
  socials: [
    { name: 'Instagram', url: 'https://www.instagram.com/cybervexdigital' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/company/cybervex-digital' },
    { name: 'Threads', url: 'https://www.threads.com/@cybervexdigital' },
    { name: 'Facebook', url: 'https://www.facebook.com/cybervexdigital' },
    { name: 'Gmail', url: 'https://mail.google.com/mail/?view=cm&fs=1&to=info@cybervexdigital.com' },
  ],
};
