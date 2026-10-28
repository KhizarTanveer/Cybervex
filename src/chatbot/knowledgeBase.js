/**
 * Cybervex Digital assistant — answers visitor questions from the site's own content.
 * Runs fully in the browser: services, company profile and contact details are indexed
 * once, then each question is matched by intent and by weighted keyword relevance.
 */
import { spiralServicesList, servicesCompanyIntro } from '../data/spiralServicesData';
import {
  aboutMissionContent,
  aboutVisionContent,
  aboutValuesList,
} from '../data/aboutData';
import { closingContent, whatsAppContact } from '../data/agencyData';

/* --------------------------------------------------------------------------
   Text helpers
   -------------------------------------------------------------------------- */
const STOP_WORDS = new Set(
  (
    'a an the and or but of for to in on at by with from about as is are was were be been being do does did ' +
    'i me my we our you your he she it they them this that these those what which who whom how can could ' +
    'would should will shall may might must have has had any some all more most other such no not only own ' +
    'same so than too very just also please tell know want need like get give provide offer offers service ' +
    'services help company business businesses your cybervex digital us there here hi hey hello kya ka ki ke ' +
    'hai hain mein main mujhe aap ap apka apki karte karta kar ho hota bhi chahiye chahta chahti ' +
    'work working client clients'
  ).split(' ')
);

// Common spellings and phrases mapped onto words used in the service data
const PHRASES = [
  [/e[\s-]?commerce|shopify|woocommerce|online (store|shop)/g, ' ecommerce store '],
  [/call[\s-]?cent(er|re)|cold[\s-]?call(ing)?|tele[\s-]?sales/g, ' telemarketing calling '],
  [/social[\s-]?media/g, ' social media '],
  [/web[\s-]?site|web[\s-]?page|webpage|landing[\s-]?page/g, ' website '],
  [/pitch[\s-]?deck/g, ' pitch deck presentation '],
  [/virtual[\s-]?assistant|\bva\b/g, ' virtual assistance '],
  [/\bit (support|services?|solutions?|consult\w*|infrastructure)\b/g, ' technology infrastructure $1 '],
];

const SYNONYMS = {
  site: ['website'], app: ['software', 'technology'], apps: ['software', 'technology'],
  developer: ['development', 'website'], develop: ['development'], wordpress: ['website'],
  ads: ['advertising', 'ads'], ad: ['advertising', 'ads'], advert: ['advertising'], ppc: ['advertising', 'google'],
  meta: ['facebook', 'instagram'], fb: ['facebook'], insta: ['instagram'], ig: ['instagram'],
  logo: ['logo', 'brand'], branding: ['brand'], designer: ['design'],
  hiring: ['recruitment'], hire: ['recruitment'], recruit: ['recruitment'], staff: ['recruitment'],
  job: ['recruitment'], jobs: ['recruitment'], cv: ['recruitment'], hr: ['hr', 'recruitment'],
  shaadi: ['wedding'], shadi: ['wedding'], mehndi: ['wedding', 'mehndi'], barat: ['baraat'], walima: ['walima'],
  event: ['events'], party: ['celebrations'], conference: ['conferences'],
  photo: ['photography'], photos: ['photography'], photographer: ['photography'], shoot: ['photography'],
  photoshoot: ['photography', 'shoots'], photography: ['photography', 'shoots'],
  videographer: ['videography'], reel: ['reels'], reels: ['reels', 'video'], editing: ['editing', 'video'],
  youtube: ['video', 'shorts'], tiktok: ['tiktok'],
  rank: ['seo', 'search'], ranking: ['seo', 'search'], google: ['google', 'search'],
  newsletter: ['email'], mailchimp: ['email'], hubspot: ['crm'], salesforce: ['crm'],
  influencer: ['influencer'], influencers: ['influencer'], affiliate: ['affiliate'],
  pr: ['public', 'relations', 'reputation'], reviews: ['reputation', 'review'], press: ['press', 'media'],
  dashboard: ['dashboard', 'analytics'], report: ['reporting'], reports: ['reporting'], data: ['data'],
  presentation: ['presentation'], brochure: ['brochures'], sop: ['sops'], proposal: ['proposals'],
  consultant: ['consulting'], consult: ['consulting'], advice: ['consulting'], strategy: ['strategy'],
  outsource: ['outsourcing'], outsourcing: ['outsourcing', 'bpo'], support: ['support'],
  chat: ['chat'], ticket: ['ticket'], bookkeeping: ['data'], admin: ['administrative'],
  assistant: ['assistance'], scheduling: ['scheduling'],
  retainer: ['retainers', 'monthly'], package: ['packages'], packages: ['packages'], team: ['teams', 'dedicated'],
  it: ['technology', 'it'], cloud: ['cloud'], automation: ['automation'], software: ['software'],
};

const stem = (word) => {
  if (word.length <= 4) return word;
  return word.replace(/(ations|ation|ings|ing|ers|er|ies|ied|es|ed|s)$/, '') || word;
};

const normalize = (text) => {
  let t = ` ${text.toLowerCase()} `;
  PHRASES.forEach(([pattern, replacement]) => {
    t = t.replace(pattern, replacement);
  });
  return t.replace(/[^a-z0-9\s]/g, ' ');
};

const tokenize = (text) =>
  normalize(text)
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));

const expandQuery = (text) => {
  const words = tokenize(text);
  const expanded = new Set();
  words.forEach((w) => {
    expanded.add(stem(w));
    (SYNONYMS[w] || []).forEach((s) => expanded.add(stem(s)));
  });
  return [...expanded];
};

const hasAny = (text, patterns) => patterns.some((p) => p.test(text));

/* --------------------------------------------------------------------------
   Service index (weighted bag of words + IDF)
   -------------------------------------------------------------------------- */
const serviceDetailLines = (service) => [
  ...service.points,
  ...(service.subgroups || []).flatMap((g) => [g.title, ...g.items]),
];

const index = spiralServicesList.map((service) => {
  const weights = new Map();
  const add = (text, weight) => {
    tokenize(text).forEach((w) => {
      const s = stem(w);
      weights.set(s, (weights.get(s) || 0) + weight);
    });
  };
  add(service.title, 6);
  add(service.id.replace(/-/g, ' '), 5);
  add(service.shortCategory, 3);
  add(service.description, 2);
  service.highlights.forEach((h) => add(h, 2));
  serviceDetailLines(service).forEach((line) => add(line, 1));
  if (service.notes) add(service.notes, 1);
  return { service, weights };
});

const docFrequency = new Map();
index.forEach(({ weights }) => {
  weights.forEach((_, term) => docFrequency.set(term, (docFrequency.get(term) || 0) + 1));
});
const idf = (term) => Math.log(1 + index.length / (docFrequency.get(term) || index.length));

const rankServices = (terms) =>
  index
    .map(({ service, weights }) => {
      let score = 0;
      terms.forEach((term) => {
        const w = weights.get(term);
        if (w) score += Math.min(w, 8) * idf(term);
      });
      return { service, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

/* --------------------------------------------------------------------------
   Intents
   -------------------------------------------------------------------------- */
const INTENTS = {
  greeting: [/^\s*(hi+|hello+|hey+|salam|assalam[ou]* ?alaikum|aoa|good (morning|afternoon|evening))\b/],
  thanks: [/\b(thanks?|thank you|thx|shukriya|jazakallah)\b/],
  bye: [/\b(bye|goodbye|see you|allah hafiz|khuda hafiz)\b/],
  // Asking for Cybervex's own contact details (not e.g. "email marketing")
  contact: [
    /\b(contact|reach|email|call|message|text) (you|us|your team|the team)\b/,
    /\byour (email|e-mail|number|phone|whatsapp|address|office|location)\b/,
    /\b(whatsapp|whats app|phone number|contact number|contact details|email address|get in touch|talk to (someone|a human|your team))\b/,
    /\bhow (can|do) i (contact|reach|email|call|message)\b/,
    /\b(where are you|where is your office|located|rabta|number do|baat kar)\b/,
  ],
  pricing: [/\b(price|pricing|prices|cost|costs|charge|charges|fee|fees|rate|rates|budget|quote|quotation|how much|qeemat|kitne|kitna|paise|rupees|pkr|usd|\$)/],
  timeline: [/\b(how long|timeline|turnaround|deadline|delivery time|kitne din|kab tak|time frame)\b/],
  list: [
    /\b(what (do|can) you (do|offer)|your services|all services|list|services do you|which services|what services|categories|kya kya|kya karte)\b/,
  ],
  about: [/\b(who are you|about (you|cybervex|the company)|your company|mission|vision|values|why choose|why cybervex|experience)\b/],
  international: [/\b(international|abroad|outside pakistan|other countries|worldwide|globally|uk|usa|uae|dubai|remote)\b/],
};

const matchIntent = (text, name) => hasAny(text, INTENTS[name]);

/* --------------------------------------------------------------------------
   Reply builders — every reply is { text, bullets?, actions? }
   actions: { type: 'ask' | 'whatsapp' | 'navigate' | 'email', label, value }
   -------------------------------------------------------------------------- */
const whatsAppAction = (label = 'Chat on WhatsApp', message) => ({ type: 'whatsapp', label, value: message });

const relatedAsks = (services) =>
  services.map((s) => ({ type: 'ask', label: s.title, value: `Tell me about ${s.title}` }));

const serviceReply = (service, terms, related) => {
  const lines = serviceDetailLines(service);
  const relevant = lines.filter((line) => tokenize(line).some((w) => terms.includes(stem(w))));
  const bullets = [...new Set([...relevant, ...service.highlights])].slice(0, 6);
  const extra = service.notes ? `\n\n${service.notes}` : '';
  return {
    text: `**${service.title}**\n${service.description}${extra}\n\nWhat this includes:`,
    bullets,
    actions: [
      whatsAppAction('Discuss this on WhatsApp',`Hi Cybervex Digital! I'm interested in your ${service.title} service.`),
      ...relatedAsks(related),
    ],
  };
};

const listReply = () => ({
  text: `We offer **${spiralServicesList.length} services** under one roof — ${servicesCompanyIntro.tagline}. Ask me about any of them:`,
  bullets: spiralServicesList.map((s) => `${s.number}. ${s.title}`),
  actions: [
    { type: 'ask', label: 'Website development', value: 'Tell me about website development' },
    { type: 'ask', label: 'Social media', value: 'Tell me about social media management' },
    { type: 'ask', label: 'Pricing', value: 'How much do your services cost?' },
  ],
});

const contactReply = () => ({
  text: "You can reach the Cybervex Digital team directly — we're happy to discuss your project:",
  bullets: [`WhatsApp: ${whatsAppContact.display}`, `Email: ${closingContent.contactEmail}`, 'Or send us a message from the Contact page'],
  actions: [
    whatsAppAction(),
    { type: 'email', label: 'Email us', value: closingContent.contactEmail },
    { type: 'navigate', label: 'Open Contact page', value: '/contact' },
  ],
});

const pricingReply = (service) => ({
  text:
    `${service ? `Pricing for **${service.title}** ` : 'Our pricing '}depends on your scope of work, required resources, deliverables and duration — every package is tailored to your goals and budget.\n\n` +
    'You can choose individual services, project-based work, monthly packages or a dedicated team. Share your requirements and we\'ll send you a custom quote.',
  actions: [
    whatsAppAction('Get a quote on WhatsApp', `Hi Cybervex Digital! I'd like a quote${service ? ` for ${service.title}` : ''}.`),
    { type: 'navigate', label: 'Contact form', value: '/contact' },
  ],
});

const aboutReply = () => ({
  text:
    `**Cybervex Digital** — ${servicesCompanyIntro.tagline}.\n\n${servicesCompanyIntro.about.split('\n\n')[0]}\n\n` +
    `**Our mission:** ${aboutMissionContent.paragraphs[0]}\n\n**Our vision:** ${aboutVisionContent.paragraphs[0]}`,
  bullets: servicesCompanyIntro.valuePillars.map((p) => `${p.title} — ${p.description}`),
  actions: [
    { type: 'navigate', label: 'About us page', value: '/about' },
    { type: 'ask', label: 'Our values', value: 'What are your values?' },
  ],
});

const valuesReply = () => ({
  text: 'The principles behind our work:',
  bullets: aboutValuesList.map((v) => `${v.heading} — ${v.content}`),
  actions: [{ type: 'ask', label: 'What services do you offer?', value: 'What services do you offer?' }],
});

const timelineReply = (service) => ({
  text:
    `Timelines depend on the scope of ${service ? `your **${service.title}** project` : 'the project'} — we agree on deliverables and a schedule with you before work starts. ` +
    'Message us your requirements and we\'ll share a realistic timeline.',
  actions: [whatsAppAction('Ask about timelines', `Hi Cybervex Digital! How long would ${service ? service.title : 'my project'} take?`)],
});

const internationalReply = () => ({
  text: `Yes — we aim to serve clients locally and internationally, and most of our services can be delivered remotely. ${aboutVisionContent.paragraphs[0]}`,
  actions: [whatsAppAction()],
});

const fallbackReply = () => ({
  text:
    "I'm not sure I understood that. I can answer questions about our 23 services, pricing, timelines and how to reach us. " +
    'For anything else, our team will reply on WhatsApp.',
  actions: [
    { type: 'ask', label: 'What services do you offer?', value: 'What services do you offer?' },
    whatsAppAction('Ask our team on WhatsApp'),
  ],
});

export const welcomeMessage = {
  text: "Hi! I'm the **Cybervex Digital assistant**. Ask me anything about our services — websites, SEO, social media, ads, branding, events, BPO and more.",
  actions: [
    { type: 'ask', label: 'What services do you offer?', value: 'What services do you offer?' },
    { type: 'ask', label: 'Website development', value: 'Do you build websites?' },
    { type: 'ask', label: 'Pricing', value: 'How much do your services cost?' },
    { type: 'ask', label: 'Contact', value: 'How can I contact you?' },
  ],
};

/* --------------------------------------------------------------------------
   Main entry
   -------------------------------------------------------------------------- */
export function answerQuestion(question) {
  const text = question.toLowerCase().trim();
  if (!text) return fallbackReply();

  const terms = expandQuery(text);
  const ranked = rankServices(terms);
  const top = ranked[0];
  const strongMatch = top && top.score >= 2.2 ? top.service : null;
  const related = ranked
    .slice(1, 3)
    .filter((r) => strongMatch && r.score >= top.score * 0.55)
    .map((r) => r.service);

  if (matchIntent(text, 'pricing')) return pricingReply(strongMatch);
  if (matchIntent(text, 'timeline')) return timelineReply(strongMatch);
  if (matchIntent(text, 'contact')) return contactReply();
  if (/\bvalues?\b|principles/.test(text) && !strongMatch) return valuesReply();
  if (matchIntent(text, 'about') && !strongMatch) return aboutReply();
  if (matchIntent(text, 'international') && !strongMatch) return internationalReply();
  if (matchIntent(text, 'list') && !strongMatch) return listReply();
  if (strongMatch) return serviceReply(strongMatch, terms, related);
  if (matchIntent(text, 'thanks')) {
    return { text: "You're welcome! Anything else you'd like to know about our services?", actions: [whatsAppAction()] };
  }
  if (matchIntent(text, 'bye')) return { text: 'Thanks for visiting Cybervex Digital — have a great day!' };
  if (matchIntent(text, 'greeting')) return welcomeMessage;
  if (/\bservices?\b/.test(text)) return listReply();
  return fallbackReply();
}
