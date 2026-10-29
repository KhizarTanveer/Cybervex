// Cybervex Digital — API server for job applications and contact messages (MongoDB).
//   • GET  /api/jobs                    public: open positions for the Careers page
//   • POST /api/applications           public: form fields + PDF resume
//   • POST /api/contact                 public: Contact page form
//   • GET  /api/projects                public: projects for the home page and Projects page
//   • /api/admin/*                      admin panel (login cookie required)
// New contact messages and applications are also emailed (server/mailer.js).
// Projects are stored in `projects` (uploaded images in GridFS `project_images`).
// Jobs are stored in `jobs`, applications in `job_applications`, resumes in GridFS
// (`resumes.files` / `resumes.chunks`) and contact messages in `contact_messages` —
// all visible in MongoDB Compass.
// In production it also serves the built website from /dist.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import { GridFSBucket, MongoClient, ObjectId } from 'mongodb';
import { cspDirectives } from './security-headers.js';
import { notifyContactMessage, notifyJobApplication } from './mailer.js';
import { openPositions as defaultJobs, jobTypes as JOB_TYPES } from '../src/data/careersData.js';
import { selectedWorkData as defaultProjects } from '../src/data/agencyData.js';

const {
  MONGODB_URI = 'mongodb://localhost:27017',
  MONGODB_DB = 'cybervex',
  ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH,
  PORT = 4000,
  NODE_ENV,
  TRUST_PROXY,
} = process.env;
const IS_PRODUCTION = NODE_ENV === 'production';

// A plain ADMIN_PASSWORD is only accepted during local development; production needs the hash
// from `npm run hash-password`.
const ADMIN_PASSWORD = IS_PRODUCTION ? undefined : process.env.ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !(ADMIN_PASSWORD_HASH || ADMIN_PASSWORD)) {
  console.warn('[server] ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not set in server/.env — admin login is disabled.');
} else if (!ADMIN_PASSWORD_HASH) {
  console.warn('[server] using a plain ADMIN_PASSWORD — run `npm run hash-password` and use ADMIN_PASSWORD_HASH instead.');
}

// Signs admin login cookies. A fixed SESSION_SECRET keeps admins logged in across restarts.
// The password is mixed in, so changing the password signs out every existing session.
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (IS_PRODUCTION && (process.env.SESSION_SECRET || '').length < 32) {
  console.warn('[server] SESSION_SECRET should be at least 32 random characters.');
}
const SIGNING_KEY = crypto
  .createHash('sha256')
  .update(`${SESSION_SECRET}:${ADMIN_PASSWORD_HASH || ADMIN_PASSWORD || ''}`)
  .digest();
const SESSION_HOURS = 12;
const COOKIE = 'cvx_admin';
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const STATUSES = ['new', 'reviewed', 'shortlisted', 'rejected'];
const MESSAGE_STATUSES = ['new', 'read', 'replied'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------- Database ------------------------------- */
const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db(MONGODB_DB);
const applications = db.collection('job_applications');
const resumes = new GridFSBucket(db, { bucketName: 'resumes' });
const messages = db.collection('contact_messages');
const jobs = db.collection('jobs');
const settings = db.collection('settings');
const projects = db.collection('projects');
const projectImages = new GridFSBucket(db, { bucketName: 'project_images' });
await applications.createIndex({ createdAt: -1 });
await applications.createIndex({ jobId: 1 });
await messages.createIndex({ createdAt: -1 });
await jobs.createIndex({ slug: 1 }, { unique: true });
await projects.createIndex({ createdAt: 1 });

// First run: copy the jobs that used to be hard-coded so the Careers page isn't empty
if ((await jobs.countDocuments()) === 0) {
  const now = Date.now();
  await jobs.insertMany(defaultJobs.map((job, i) => ({
    slug: job.id,
    title: job.title,
    department: job.department,
    type: job.type,
    location: job.location,
    experience: job.experience,
    summary: job.summary,
    skills: job.skills,
    active: true,
    createdAt: new Date(now + i),
  })));
  console.log(`[server] added ${defaultJobs.length} starter jobs`);
}
// First run: copy the projects that used to be hard-coded (their images stay in /public/images)
if ((await projects.countDocuments()) === 0) {
  const now = Date.now();
  await projects.insertMany(defaultProjects.map((project, i) => ({
    title: project.title,
    category: project.category,
    year: project.year,
    badge: project.conceptBadge,
    description: project.description,
    tags: project.tags,
    imageUrl: project.image,
    imageFileId: null,
    active: true,
    createdAt: new Date(now + i),
  })));
  console.log(`[server] added ${defaultProjects.length} starter projects`);
}
// Bumped on sign-out, which ends every admin session at once
let sessionVersion = (await settings.findOne({ _id: 'admin' }))?.sessionVersion || 1;
console.log(`[server] connected to MongoDB → ${MONGODB_DB}`);

/* ------------------------------ Helpers -------------------------------- */
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(a), sha256(b));
const sign = (data) => crypto.createHmac('sha256', SIGNING_KEY).update(data).digest('base64url');
const scrypt = promisify(crypto.scrypt);

const verifyPassword = async (password) => {
  if (password.length > 256) return false;
  if (ADMIN_PASSWORD_HASH) {
    const [scheme, salt, hash] = ADMIN_PASSWORD_HASH.split(':');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const expected = Buffer.from(hash, 'base64');
    const actual = await scrypt(password, Buffer.from(salt, 'base64'), expected.length);
    return crypto.timingSafeEqual(actual, expected);
  }
  return Boolean(ADMIN_PASSWORD) && safeEqual(password, ADMIN_PASSWORD);
};

const createToken = (email) => {
  const payload = Buffer.from(
    JSON.stringify({ email, v: sessionVersion, exp: Date.now() + SESSION_HOURS * 3600e3 })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
};

const readToken = (token) => {
  const [payload, signature] = String(token || '').split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.exp > Date.now() && data.v === sessionVersion ? data : null;
  } catch {
    return null;
  }
};

const getCookie = (req, name) => {
  const match = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

const cookieOptions = (req) => ({
  httpOnly: true,
  sameSite: 'strict',
  secure: IS_PRODUCTION || req.secure,
  path: '/api/admin',
  maxAge: SESSION_HOURS * 3600e3,
});

// Counts events per key in fixed time windows; expired entries are swept so memory stays small
const createCounter = (windowMs) => {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key);
  }, Math.min(windowMs, 5 * 60e3)).unref();
  return {
    count: (key) => {
      const entry = hits.get(key);
      return entry && entry.reset > Date.now() ? entry.count : 0;
    },
    add: (key) => {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || entry.reset <= now) hits.set(key, { count: 1, reset: now + windowMs });
      else entry.count += 1;
    },
  };
};

// At most `max` requests per IP per window
const rateLimit = (max, windowMs) => {
  const counter = createCounter(windowMs);
  return (req, res, next) => {
    counter.add(req.ip);
    if (counter.count(req.ip) > max) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    return next();
  };
};

// Failed admin sign-ins: 5 per IP, and 25 from everyone together, per 15 minutes.
// The overall cap stops guessing spread across many IPs.
const LOGIN_WINDOW = 15 * 60e3;
const MAX_FAILS_PER_IP = 5;
const MAX_FAILS_TOTAL = 25;
const failedLogins = createCounter(LOGIN_WINDOW);

// Bots fill in every field, including the hidden `cvx_hp` one people never see.
// Dropped submissions are logged so a false positive is easy to spot.
const isSpam = (req, form) => {
  if (!String(req.body?.cvx_hp || '').trim()) return false;
  console.warn(`[spam] dropped a ${form} submission from ${req.ip}`);
  return true;
};

const toClient = (doc) => ({
  id: doc._id.toString(),
  created_at: doc.createdAt,
  job_id: doc.jobId,
  job_title: doc.jobTitle,
  full_name: doc.fullName,
  email: doc.email,
  phone: doc.phone,
  city: doc.city,
  resume_name: doc.resumeName,
  status: doc.status,
});

const messageToClient = (doc) => ({
  id: doc._id.toString(),
  created_at: doc.createdAt,
  name: doc.name,
  email: doc.email,
  phone: doc.phone,
  message: doc.message,
  status: doc.status,
});

// Jobs: `id` is the readable slug used in URLs and stored on applications
const jobToClient = (doc, { admin = false } = {}) => ({
  id: doc.slug,
  title: doc.title,
  department: doc.department,
  type: doc.type,
  location: doc.location,
  experience: doc.experience,
  summary: doc.summary,
  skills: doc.skills || [],
  ...(admin && { active: doc.active, created_at: doc.createdAt }),
});

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'job';

// Validates the admin job form; returns { job } or { error }
const readJobForm = (body = {}) => {
  const text = (key) => String(body[key] ?? '').trim();
  const job = {
    title: text('title'),
    department: text('department'),
    type: text('type'),
    location: text('location'),
    experience: text('experience'),
    summary: text('summary'),
    skills: (Array.isArray(body.skills) ? body.skills : String(body.skills || '').split(','))
      .map((skill) => String(skill).trim())
      .filter(Boolean),
    active: body.active !== false,
  };
  const error =
    job.title.length < 2 || job.title.length > 80 ? 'Job title must be 2–80 characters.'
    : job.department.length < 2 || job.department.length > 60 ? 'Department must be 2–60 characters.'
    : !JOB_TYPES.includes(job.type) ? 'Please choose a job type.'
    : job.location.length < 2 || job.location.length > 60 ? 'Location must be 2–60 characters.'
    : job.experience.length < 1 || job.experience.length > 40 ? 'Experience must be 1–40 characters.'
    : job.summary.length < 20 || job.summary.length > 600 ? 'Description must be 20–600 characters.'
    : job.skills.length > 8 || job.skills.some((skill) => skill.length > 40) ? 'Use up to 8 skills, 40 characters each.'
    : null;
  return error ? { error } : { job };
};

// Projects: field names match what ProjectCard on the website expects
const projectToClient = (doc, { admin = false } = {}) => ({
  id: doc._id.toString(),
  title: doc.title,
  category: doc.category,
  year: doc.year,
  conceptBadge: doc.badge,
  description: doc.description,
  tags: doc.tags || [],
  image: doc.imageFileId ? `/api/project-images/${doc.imageFileId}` : doc.imageUrl,
  ...(admin && { active: doc.active, created_at: doc.createdAt }),
});

// Validates the admin project form (multipart, so `tags` arrives as text); returns { project } or { error }
const readProjectForm = (body = {}) => {
  const text = (key) => String(body[key] ?? '').trim();
  const project = {
    title: text('title'),
    category: text('category'),
    year: text('year'),
    badge: text('badge'),
    description: text('description'),
    tags: text('tags').split(',').map((tag) => tag.trim()).filter(Boolean),
    active: text('active') !== 'false',
  };
  const error =
    project.title.length < 2 || project.title.length > 80 ? 'Project title must be 2–80 characters.'
    : project.category.length > 80 ? 'Category must be 80 characters or less.'
    : project.year && !/^\d{4}$/.test(project.year) ? 'Year must be 4 digits, e.g. 2026.'
    : project.badge.length > 30 ? 'Badge must be 30 characters or less.'
    : project.description.length < 20 || project.description.length > 400 ? 'Description must be 20–400 characters.'
    : project.tags.length > 6 || project.tags.some((tag) => tag.length > 30) ? 'Use up to 6 tags, 30 characters each.'
    : null;
  return error ? { error } : { project };
};

// Recognise real JPG / PNG / WebP files from their first bytes
const imageType = (buffer) => {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
};

const saveProjectImage = (file, contentType) =>
  new Promise((resolve, reject) => {
    const name = path.basename(file.originalname || 'project-image').slice(0, 200);
    const stream = projectImages.openUploadStream(name, { metadata: { contentType } });
    stream.on('error', reject).on('finish', () => resolve(stream.id));
    stream.end(file.buffer);
  });

const toObjectId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);

/* -------------------------------- App ---------------------------------- */
const app = express();
// Only proxies listed in TRUST_PROXY may report the visitor's IP; otherwise anyone could fake it
// with an X-Forwarded-For header and dodge the limits. Unset = use the direct connection.
app.set('trust proxy', !TRUST_PROXY ? false : /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY);
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { ...cspDirectives, 'upgrade-insecure-requests': IS_PRODUCTION ? [] : null },
    },
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'deny' },
  })
);
app.use((req, res, next) => {
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});
app.use(express.json({ limit: '20kb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_BYTES, files: 1, fields: 10, fieldSize: 1024 },
});

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 10, fieldSize: 2048 },
});

// Public: projects shown on the home page and the Projects page
app.get('/api/projects', async (req, res) => {
  const docs = await projects.find({ active: true }).sort({ createdAt: 1 }).toArray();
  res.set('Cache-Control', 'no-store');
  res.json(docs.map((doc) => projectToClient(doc)));
});

// Public: uploaded project images (a new upload gets a new id, so they can be cached for long)
app.get('/api/project-images/:id', async (req, res) => {
  const id = toObjectId(req.params.id);
  const file = id && (await projectImages.find({ _id: id }).next());
  if (!file) return res.status(404).json({ error: 'Not found.' });
  res.set({
    'Content-Type': file.metadata?.contentType || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });
  projectImages.openDownloadStream(id)
    .on('error', () => res.destroy())
    .pipe(res);
});

// Public: open positions shown on the Careers page
app.get('/api/jobs', async (req, res) => {
  const docs = await jobs.find({ active: true }).sort({ createdAt: 1 }).toArray();
  res.set('Cache-Control', 'no-store');
  res.json(docs.map((doc) => jobToClient(doc)));
});

// Public: submit an application
app.post('/api/applications', rateLimit(10, 60 * 60e3), upload.single('resume'), async (req, res) => {
  const body = req.body || {};
  if (isSpam(req, 'job application')) return res.status(201).json({ ok: true });
  const fields = {
    jobId: String(body.jobId || ''),
    fullName: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    phone: String(body.phone || '').trim(),
    city: String(body.city || '').trim(),
  };
  const jobDoc = fields.jobId && (await jobs.findOne({ slug: fields.jobId, active: true }));
  const job = jobDoc && { id: jobDoc.slug, title: jobDoc.title };
  const digits = fields.phone.replace(/\D/g, '');
  const file = req.file;

  const problem =
    !job ? 'This position is no longer open.'
    : fields.fullName.length < 2 || fields.fullName.length > 120 ? 'Please enter your full name.'
    : !EMAIL_RE.test(fields.email) || fields.email.length > 200 ? 'Please enter a valid email address.'
    : digits.length < 7 || digits.length > 15 || /[^\d\s+\-()]/.test(fields.phone) ? 'Please enter a valid contact number.'
    : fields.city.length < 2 || fields.city.length > 80 ? 'Please enter your city.'
    : !file ? 'Please upload your resume (PDF).'
    : file.buffer.subarray(0, 5).toString() !== '%PDF-' ? 'Only PDF files are accepted.'
    : null;
  if (problem) return res.status(400).json({ error: problem });

  const resumeName = path.basename(file.originalname || 'resume.pdf').slice(0, 200);
  const resumeId = await new Promise((resolve, reject) => {
    const stream = resumes.openUploadStream(resumeName, { metadata: { contentType: 'application/pdf', jobId: job.id } });
    stream.on('error', reject).on('finish', () => resolve(stream.id));
    stream.end(file.buffer);
  });

  const application = {
    jobId: job.id,
    jobTitle: job.title,
    fullName: fields.fullName,
    email: fields.email,
    phone: fields.phone,
    city: fields.city,
    resumeFileId: resumeId,
    resumeName,
    resumeSize: file.size,
    status: 'new',
    createdAt: new Date(),
  };
  await applications.insertOne(application);

  res.status(201).json({ ok: true });
  notifyJobApplication(application, { name: resumeName, buffer: file.buffer });
});

// Public: Contact page message
app.post('/api/contact', rateLimit(10, 60 * 60e3), async (req, res) => {
  const body = req.body || {};
  if (isSpam(req, 'contact')) return res.status(201).json({ ok: true });
  const fields = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    phone: String(body.phone || '').trim(),
    message: String(body.message || '').trim(),
  };
  const problem =
    fields.name.length < 2 || fields.name.length > 120 ? 'Please enter your name.'
    : !EMAIL_RE.test(fields.email) || fields.email.length > 200 ? 'Please enter a valid email address.'
    : fields.phone && !/^\+?[\d\s()-]{7,20}$/.test(fields.phone) ? 'Please enter a valid phone number.'
    : fields.message.length < 10 ? 'Please tell us a little more (at least 10 characters).'
    : fields.message.length > 1000 ? 'Your message is too long (1000 characters max).'
    : null;
  if (problem) return res.status(400).json({ error: problem });

  await messages.insertOne({ ...fields, status: 'new', createdAt: new Date() });
  res.status(201).json({ ok: true });
  notifyContactMessage(fields);
});

/* ------------------------------ Admin API ------------------------------ */
app.post('/api/admin/login', async (req, res) => {
  if (failedLogins.count(req.ip) >= MAX_FAILS_PER_IP || failedLogins.count('*') >= MAX_FAILS_TOTAL) {
    return res.status(429).json({ error: 'Too many failed sign-ins. Please try again in 15 minutes.' });
  }
  const { email = '', password = '' } = req.body || {};
  // Both checks always run, so the response time doesn't reveal which one failed
  const emailOk = Boolean(ADMIN_EMAIL) && safeEqual(String(email).trim().toLowerCase(), ADMIN_EMAIL.trim().toLowerCase());
  const passwordOk = await verifyPassword(String(password));
  if (!emailOk || !passwordOk) {
    failedLogins.add(req.ip);
    failedLogins.add('*');
    console.warn(`[server] failed admin sign-in from ${req.ip}`);
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  res.cookie(COOKIE, createToken(ADMIN_EMAIL), cookieOptions(req));
  return res.json({ email: ADMIN_EMAIL });
});

// Signing out ends every admin session (all browsers and devices), not just this one
app.post('/api/admin/logout', async (req, res) => {
  if (readToken(getCookie(req, COOKIE))) {
    sessionVersion += 1;
    await settings.updateOne({ _id: 'admin' }, { $set: { sessionVersion } }, { upsert: true });
  }
  res.clearCookie(COOKIE, { ...cookieOptions(req), maxAge: undefined });
  res.json({ ok: true });
});

// Everything below needs a valid admin cookie
const requireAdmin = (req, res, next) => {
  const session = readToken(getCookie(req, COOKIE));
  if (!session) return res.status(401).json({ error: 'Please sign in.' });
  req.admin = session;
  return next();
};

app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ email: req.admin.email }));

app.get('/api/admin/applications', requireAdmin, async (req, res) => {
  const docs = await applications.find().sort({ createdAt: -1 }).limit(2000).toArray();
  res.json(docs.map(toClient));
});

app.get('/api/admin/applications/:id/resume', requireAdmin, async (req, res) => {
  const id = toObjectId(req.params.id);
  const doc = id && (await applications.findOne({ _id: id }));
  if (!doc) return res.status(404).json({ error: 'Not found.' });
  const safeName = doc.resumeName.replace(/[^\w.\- ]/g, '_');
  res.set({
    'Content-Type': 'application/pdf',
    // Downloaded rather than opened on the site, so a harmful PDF can't run in our pages
    'Content-Disposition': `attachment; filename="${safeName}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  resumes.openDownloadStream(doc.resumeFileId)
    .on('error', () => res.destroy())
    .pipe(res);
});

app.patch('/api/admin/applications/:id', requireAdmin, async (req, res) => {
  const id = toObjectId(req.params.id);
  const { status } = req.body || {};
  if (!id || !STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid request.' });
  const result = await applications.updateOne({ _id: id }, { $set: { status, updatedAt: new Date() } });
  if (!result.matchedCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
});

app.delete('/api/admin/applications/:id', requireAdmin, async (req, res) => {
  const id = toObjectId(req.params.id);
  const doc = id && (await applications.findOneAndDelete({ _id: id }));
  if (!doc) return res.status(404).json({ error: 'Not found.' });
  await resumes.delete(doc.resumeFileId).catch(() => {});
  res.json({ ok: true });
});

app.get('/api/admin/messages', requireAdmin, async (req, res) => {
  const docs = await messages.find().sort({ createdAt: -1 }).limit(2000).toArray();
  res.json(docs.map(messageToClient));
});

app.patch('/api/admin/messages/:id', requireAdmin, async (req, res) => {
  const id = toObjectId(req.params.id);
  const { status } = req.body || {};
  if (!id || !MESSAGE_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid request.' });
  const result = await messages.updateOne({ _id: id }, { $set: { status, updatedAt: new Date() } });
  if (!result.matchedCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
});

app.delete('/api/admin/messages/:id', requireAdmin, async (req, res) => {
  const id = toObjectId(req.params.id);
  const result = id ? await messages.deleteOne({ _id: id }) : { deletedCount: 0 };
  if (!result.deletedCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
});

// Jobs (admin): list all including hidden ones, create, edit, delete
app.get('/api/admin/jobs', requireAdmin, async (req, res) => {
  const docs = await jobs.find().sort({ createdAt: 1 }).toArray();
  res.json(docs.map((doc) => jobToClient(doc, { admin: true })));
});

app.post('/api/admin/jobs', requireAdmin, async (req, res) => {
  const { job, error } = readJobForm(req.body);
  if (error) return res.status(400).json({ error });
  // Readable, unique id such as "graphic-designer" or "graphic-designer-2"
  const base = slugify(job.title);
  let slug = base;
  for (let n = 2; await jobs.findOne({ slug }); n++) slug = `${base}-${n}`;
  const doc = { ...job, slug, createdAt: new Date() };
  await jobs.insertOne(doc);
  res.status(201).json(jobToClient(doc, { admin: true }));
});

app.put('/api/admin/jobs/:slug', requireAdmin, async (req, res) => {
  const { job, error } = readJobForm(req.body);
  if (error) return res.status(400).json({ error });
  const doc = await jobs.findOneAndUpdate(
    { slug: req.params.slug },
    { $set: { ...job, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (!doc) return res.status(404).json({ error: 'Not found.' });
  // Keep the job title on its existing applications in sync
  await applications.updateMany({ jobId: doc.slug }, { $set: { jobTitle: doc.title } });
  res.json(jobToClient(doc, { admin: true }));
});

app.delete('/api/admin/jobs/:slug', requireAdmin, async (req, res) => {
  const result = await jobs.deleteOne({ slug: req.params.slug });
  if (!result.deletedCount) return res.status(404).json({ error: 'Not found.' });
  res.json({ ok: true });
});

// Projects (admin): list all including hidden ones, create, edit, delete
app.get('/api/admin/projects', requireAdmin, async (req, res) => {
  const docs = await projects.find().sort({ createdAt: 1 }).toArray();
  res.json(docs.map((doc) => projectToClient(doc, { admin: true })));
});

app.post('/api/admin/projects', requireAdmin, uploadImage.single('image'), async (req, res) => {
  const { project, error } = readProjectForm(req.body);
  const contentType = req.file && imageType(req.file.buffer);
  const problem = error || (!req.file ? 'Please add a project image.' : !contentType ? 'The image must be a JPG, PNG or WebP file.' : null);
  if (problem) return res.status(400).json({ error: problem });
  const doc = { ...project, imageUrl: null, imageFileId: await saveProjectImage(req.file, contentType), createdAt: new Date() };
  await projects.insertOne(doc);
  res.status(201).json(projectToClient(doc, { admin: true }));
});

// The image is optional when editing; a new one replaces the old upload
app.put('/api/admin/projects/:id', requireAdmin, uploadImage.single('image'), async (req, res) => {
  const id = toObjectId(req.params.id);
  const existing = id && (await projects.findOne({ _id: id }));
  if (!existing) return res.status(404).json({ error: 'Not found.' });
  const { project, error } = readProjectForm(req.body);
  const contentType = req.file && imageType(req.file.buffer);
  const problem = error || (req.file && !contentType ? 'The image must be a JPG, PNG or WebP file.' : null);
  if (problem) return res.status(400).json({ error: problem });
  const update = { ...project, updatedAt: new Date() };
  if (req.file) Object.assign(update, { imageUrl: null, imageFileId: await saveProjectImage(req.file, contentType) });
  const doc = await projects.findOneAndUpdate({ _id: id }, { $set: update }, { returnDocument: 'after' });
  if (req.file && existing.imageFileId) await projectImages.delete(existing.imageFileId).catch(() => {});
  res.json(projectToClient(doc, { admin: true }));
});

app.delete('/api/admin/projects/:id', requireAdmin, async (req, res) => {
  const id = toObjectId(req.params.id);
  const doc = id && (await projects.findOneAndDelete({ _id: id }));
  if (!doc) return res.status(404).json({ error: 'Not found.' });
  if (doc.imageFileId) await projectImages.delete(doc.imageFileId).catch(() => {});
  res.json({ ok: true });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Upload / unexpected errors
app.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'The file is larger than 5 MB.' : 'Invalid upload.';
    return res.status(400).json({ error: message });
  }
  console.error('[server]', err);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

/* ------------------ Built website (npm run build → dist) ------------------ */
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { index: false }));
  app.get('/{*page}', (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.listen(PORT, () => console.log(`[server] listening on http://localhost:${PORT}`));
