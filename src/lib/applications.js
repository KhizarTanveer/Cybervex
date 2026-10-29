// Talks to the API in server/index.js (MongoDB): jobs, job applications, contact messages and projects

export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // project images

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, { credentials: 'same-origin', ...options });
  } catch {
    throw new ApiError('network', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Request failed', res.status);
  return data;
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Public: send the form fields and the resume PDF (`trap` is the hidden spam-trap field)
export function submitApplication(job, values, resumeFile, trap = '') {
  const form = new FormData();
  form.append('jobId', job.id);
  form.append('name', values.name.trim());
  form.append('email', values.email.trim());
  form.append('phone', values.phone.trim());
  form.append('city', values.city.trim());
  form.append('resume', resumeFile, resumeFile.name);
  form.append('cvx_hp', trap);
  return request('/api/applications', { method: 'POST', body: form });
}

/* ---------------------------- Admin panel ---------------------------- */

// Returns { email } when logged in, null otherwise
export async function getAdmin() {
  try {
    return await request('/api/admin/me');
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
}

export const signIn = (email, password) => request('/api/admin/login', json('POST', { email, password }));

export const signOut = () => request('/api/admin/logout', { method: 'POST' });

export const fetchApplications = () => request('/api/admin/applications');

export const resumeUrl = (id) => `/api/admin/applications/${encodeURIComponent(id)}/resume`;

export const updateApplicationStatus = (id, status) =>
  request(`/api/admin/applications/${encodeURIComponent(id)}`, json('PATCH', { status }));

export const deleteApplication = (application) =>
  request(`/api/admin/applications/${encodeURIComponent(application.id)}`, { method: 'DELETE' });

/* -------------------------- Contact messages -------------------------- */

// Public: Contact page form (`trap` is the hidden spam-trap field)
export const submitContactMessage = (values, trap = '') =>
  request('/api/contact', json('POST', {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    message: values.message.trim(),
    cvx_hp: trap,
  }));

export const fetchMessages = () => request('/api/admin/messages');

export const updateMessageStatus = (id, status) =>
  request(`/api/admin/messages/${encodeURIComponent(id)}`, json('PATCH', { status }));

export const deleteMessage = (message) =>
  request(`/api/admin/messages/${encodeURIComponent(message.id)}`, { method: 'DELETE' });

/* -------------------------------- Jobs -------------------------------- */

// Public: open positions for the Careers page
export const fetchJobs = () => request('/api/jobs');

export const fetchAdminJobs = () => request('/api/admin/jobs');

export const createJob = (job) => request('/api/admin/jobs', json('POST', job));

export const updateJob = (id, job) => request(`/api/admin/jobs/${encodeURIComponent(id)}`, json('PUT', job));

export const deleteJob = (job) => request(`/api/admin/jobs/${encodeURIComponent(job.id)}`, { method: 'DELETE' });

/* ------------------------------ Projects ------------------------------ */

// Public: projects for the home page and the Projects page
export const fetchProjects = () => request('/api/projects');

export const fetchAdminProjects = () => request('/api/admin/projects');

// Sent as a form so the image file can go with it; `imageFile` is optional when editing
const projectForm = (project, imageFile) => {
  const form = new FormData();
  ['title', 'category', 'year', 'badge', 'description', 'tags'].forEach((key) => form.append(key, project[key] ?? ''));
  form.append('active', String(project.active));
  if (imageFile) form.append('image', imageFile, imageFile.name);
  return form;
};

export const createProject = (project, imageFile) =>
  request('/api/admin/projects', { method: 'POST', body: projectForm(project, imageFile) });

export const updateProject = (id, project, imageFile) =>
  request(`/api/admin/projects/${encodeURIComponent(id)}`, { method: 'PUT', body: projectForm(project, imageFile) });

export const deleteProject = (project) =>
  request(`/api/admin/projects/${encodeURIComponent(project.id)}`, { method: 'DELETE' });
