// Talks to the API in server/index.js (MongoDB): jobs, job applications and contact messages

export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

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

// Public: send the form fields and the resume PDF
export function submitApplication(job, values, resumeFile) {
  const form = new FormData();
  form.append('jobId', job.id);
  form.append('name', values.name.trim());
  form.append('email', values.email.trim());
  form.append('phone', values.phone.trim());
  form.append('city', values.city.trim());
  form.append('resume', resumeFile, resumeFile.name);
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

// Public: Contact page form
export const submitContactMessage = (values) =>
  request('/api/contact', json('POST', {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    message: values.message.trim(),
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
