import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LogOut, RefreshCw, Search, FileText, Trash2, Mail, Phone, MapPin, Loader2, Lock, Briefcase, MessageSquare, Reply,
  Users, Plus, Pencil, Eye, EyeOff, FolderKanban, ImagePlus,
} from 'lucide-react';
import {
  getAdmin, signIn, signOut, fetchApplications, resumeUrl, updateApplicationStatus, deleteApplication,
  fetchMessages, updateMessageStatus, deleteMessage, fetchAdminJobs, createJob, updateJob, deleteJob,
  fetchAdminProjects, createProject, updateProject, deleteProject, MAX_IMAGE_BYTES,
} from '../lib/applications';
import { jobTypes } from '../data/careersData';
import './AdminPage.css';

const STATUSES = ['new', 'reviewed', 'shortlisted', 'rejected'];
const MESSAGE_STATUSES = ['new', 'read', 'replied'];

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function LoginForm({ onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSignedIn(await signIn(email.trim(), password));
    } catch (err) {
      setError(err.status === 0 ? 'Cannot reach the server. Is it running?' : err.message);
      setBusy(false);
    }
  };

  return (
    <form className="admin-login" onSubmit={handleSubmit}>
      <Lock size={28} className="admin-login__icon" aria-hidden="true" />
      <h1 className="admin-login__title">Admin login</h1>
      <p className="admin-login__note">Sign in to view job applications.</p>
      <label className="admin-field">
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
      </label>
      <label className="admin-field">
        <span>Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
        {busy ? <Loader2 size={17} className="admin-spin" aria-hidden="true" /> : null}
        Sign in
      </button>
    </form>
  );
}

const label = (s) => s[0].toUpperCase() + s.slice(1);

// Loads one admin list and reloads it when the header's Refresh button is pressed
function useAdminList(fetcher, reloadKey, onSignedOut, onCount) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetcher());
    } catch (err) {
      if (err.status === 401) onSignedOut();
      else setError('Could not load this list. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [fetcher, onSignedOut]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  useEffect(() => {
    onCount(items.length);
  }, [items.length, onCount]);

  return { items, setItems, loading, error, setError, load };
}

function SearchAndStatus({ query, setQuery, placeholder, status, setStatus, statuses }) {
  return (
    <div className="admin-filters">
      <label className="admin-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
      </label>
      <select
        className="admin-select"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        {statuses.map((s) => <option key={s} value={s}>{label(s)}</option>)}
      </select>
    </div>
  );
}

function ApplicationsPanel({ reloadKey, onSignedOut, onCount }) {
  const { items: applications, setItems: setApplications, loading, error, setError, load } =
    useAdminList(fetchApplications, reloadKey, onSignedOut, onCount);
  const [jobFilter, setJobFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((a) =>
      (jobFilter === 'all' || a.job_id === jobFilter) &&
      (statusFilter === 'all' || a.status === statusFilter) &&
      (!q || [a.full_name, a.email, a.phone, a.city].some((v) => v?.toLowerCase().includes(q)))
    );
  }, [applications, jobFilter, statusFilter, query]);

  // One tab per job that has applications (also covers jobs that were later deleted)
  const jobTabs = useMemo(() => {
    const tabs = new Map();
    applications.forEach((a) => {
      const tab = tabs.get(a.job_id) || { id: a.job_id, title: a.job_title, count: 0 };
      tab.count += 1;
      tabs.set(a.job_id, tab);
    });
    return [{ id: 'all', title: 'All', count: applications.length }, ...tabs.values()];
  }, [applications]);

  const changeStatus = async (application, status) => {
    setApplications((list) => list.map((a) => (a.id === application.id ? { ...a, status } : a)));
    try {
      await updateApplicationStatus(application.id, status);
    } catch {
      setError('Could not update the status.');
      load();
    }
  };

  const remove = async (application) => {
    if (!window.confirm(`Delete the application from ${application.full_name}? This also deletes their resume.`)) return;
    try {
      await deleteApplication(application);
      setApplications((list) => list.filter((a) => a.id !== application.id));
    } catch {
      setError('Could not delete this application.');
    }
  };

  return (
    <>
      <div className="admin-tabs" role="tablist" aria-label="Filter by position">
        {jobTabs.map((job) => (
          <button
            key={job.id}
            type="button"
            role="tab"
            aria-selected={jobFilter === job.id}
            className={`admin-tab ${jobFilter === job.id ? 'admin-tab--active' : ''}`}
            onClick={() => setJobFilter(job.id)}
          >
            {job.title}
            <span className="admin-tab__count">{job.count}</span>
          </button>
        ))}
      </div>

      <SearchAndStatus
        query={query}
        setQuery={setQuery}
        placeholder="Search name, email, phone or city"
        status={statusFilter}
        setStatus={setStatusFilter}
        statuses={STATUSES}
      />

      {error && <p className="admin-error" role="alert">{error}</p>}

      {loading && !applications.length ? (
        <p className="admin-empty"><Loader2 size={18} className="admin-spin" aria-hidden="true" /> Loading applications…</p>
      ) : !visible.length ? (
        <p className="admin-empty">{applications.length ? 'No applications match these filters.' : 'No applications yet.'}</p>
      ) : (
        <ul className="admin-list">
          {visible.map((a) => (
            <li key={a.id} className="admin-app">
              <div className="admin-app__main">
                <div className="admin-app__top">
                  <h2 className="admin-app__name">{a.full_name}</h2>
                  <span className="admin-app__job">{a.job_title}</span>
                </div>
                <ul className="admin-app__details">
                  <li><Mail size={14} aria-hidden="true" /><a href={`mailto:${a.email}`}>{a.email}</a></li>
                  <li><Phone size={14} aria-hidden="true" /><a href={`tel:${a.phone.replace(/[^\d+]/g, '')}`}>{a.phone}</a></li>
                  <li><MapPin size={14} aria-hidden="true" />{a.city}</li>
                </ul>
                <p className="admin-app__date">Applied {formatDate(a.created_at)}</p>
              </div>
              <div className="admin-app__side">
                <a
                  href={resumeUrl(a.id)}
                  download={a.resume_name}
                  className="admin-btn admin-btn--primary"
                  title={a.resume_name}
                >
                  <FileText size={16} aria-hidden="true" />
                  Download resume
                </a>
                <select
                  className={`admin-select admin-status admin-status--${a.status}`}
                  value={a.status}
                  onChange={(e) => changeStatus(a, e.target.value)}
                  aria-label={`Status for ${a.full_name}`}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                </select>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={() => remove(a)}
                  aria-label={`Delete application from ${a.full_name}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const replyLink = (m) =>
  `mailto:${m.email}?subject=${encodeURIComponent('Re: your message to Cybervex Digital')}&body=${encodeURIComponent(
    `Hi ${m.name.split(' ')[0]},\n\n\n\nCybervex Digital\n\n> ${m.message.replace(/\n/g, '\n> ')}`
  )}`;

function MessagesPanel({ reloadKey, onSignedOut, onCount }) {
  const { items: messages, setItems: setMessages, loading, error, setError, load } =
    useAdminList(fetchMessages, reloadKey, onSignedOut, onCount);
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages.filter((m) =>
      (statusFilter === 'all' || m.status === statusFilter) &&
      (!q || [m.name, m.email, m.phone, m.message].some((v) => v?.toLowerCase().includes(q)))
    );
  }, [messages, statusFilter, query]);

  const changeStatus = async (message, status) => {
    setMessages((list) => list.map((m) => (m.id === message.id ? { ...m, status } : m)));
    try {
      await updateMessageStatus(message.id, status);
    } catch {
      setError('Could not update the status.');
      load();
    }
  };

  const remove = async (message) => {
    if (!window.confirm(`Delete the message from ${message.name}?`)) return;
    try {
      await deleteMessage(message);
      setMessages((list) => list.filter((m) => m.id !== message.id));
    } catch {
      setError('Could not delete this message.');
    }
  };

  return (
    <>
      <SearchAndStatus
        query={query}
        setQuery={setQuery}
        placeholder="Search name, email, phone or message"
        status={statusFilter}
        setStatus={setStatusFilter}
        statuses={MESSAGE_STATUSES}
      />

      {error && <p className="admin-error" role="alert">{error}</p>}

      {loading && !messages.length ? (
        <p className="admin-empty"><Loader2 size={18} className="admin-spin" aria-hidden="true" /> Loading messages…</p>
      ) : !visible.length ? (
        <p className="admin-empty">{messages.length ? 'No messages match these filters.' : 'No messages yet.'}</p>
      ) : (
        <ul className="admin-list">
          {visible.map((m) => (
            <li key={m.id} className="admin-app admin-msg">
              <div className="admin-app__main">
                <div className="admin-app__top">
                  <h2 className="admin-app__name">{m.name}</h2>
                  {m.status === 'new' && <span className="admin-app__job">New</span>}
                </div>
                <ul className="admin-app__details">
                  <li><Mail size={14} aria-hidden="true" /><a href={`mailto:${m.email}`}>{m.email}</a></li>
                  {m.phone && (
                    <li><Phone size={14} aria-hidden="true" /><a href={`tel:${m.phone.replace(/[^\d+]/g, '')}`}>{m.phone}</a></li>
                  )}
                </ul>
                <p className="admin-msg__text">{m.message}</p>
                <p className="admin-app__date">Received {formatDate(m.created_at)}</p>
              </div>
              <div className="admin-app__side">
                <a
                  href={replyLink(m)}
                  className="admin-btn admin-btn--primary"
                  onClick={() => m.status !== 'replied' && changeStatus(m, 'replied')}
                >
                  <Reply size={16} aria-hidden="true" />
                  Reply
                </a>
                <select
                  className={`admin-select admin-status admin-status--${m.status}`}
                  value={m.status}
                  onChange={(e) => changeStatus(m, e.target.value)}
                  aria-label={`Status for message from ${m.name}`}
                >
                  {MESSAGE_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                </select>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={() => remove(m)}
                  aria-label={`Delete message from ${m.name}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const EMPTY_JOB = {
  title: '',
  department: '',
  type: jobTypes[0],
  location: '',
  experience: '',
  summary: '',
  skills: '',
  active: true,
};

// Create / edit form shown over the Jobs list
function JobEditor({ job, onSaved, onClose }) {
  const [values, setValues] = useState(() =>
    job ? { ...job, skills: (job.skills || []).join(', ') } : EMPTY_JOB
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      title: values.title,
      department: values.department,
      type: values.type,
      location: values.location,
      experience: values.experience,
      summary: values.summary,
      skills: values.skills.split(',').map((s) => s.trim()).filter(Boolean),
      active: values.active,
    };
    try {
      const saved = job ? await updateJob(job.id, payload) : await createJob(payload);
      onSaved(saved, Boolean(job));
    } catch (err) {
      setError(err.status === 0 ? 'Cannot reach the server.' : err.message);
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="presentation">
      <form
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-editor-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="job-editor-title" className="admin-modal__title">{job ? 'Edit job' : 'Post a new job'}</h2>

        <div className="admin-modal__grid">
          <label className="admin-field admin-field--full">
            <span>Job title</span>
            <input value={values.title} onChange={set('title')} maxLength={80} placeholder="e.g. Graphic Designer" required autoFocus />
          </label>
          <label className="admin-field">
            <span>Department</span>
            <input value={values.department} onChange={set('department')} maxLength={60} placeholder="e.g. Creative" required />
          </label>
          <label className="admin-field">
            <span>Job type</span>
            <select className="admin-select" value={values.type} onChange={set('type')}>
              {jobTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="admin-field">
            <span>Location</span>
            <input value={values.location} onChange={set('location')} maxLength={60} placeholder="e.g. On-site / Hybrid" required />
          </label>
          <label className="admin-field">
            <span>Experience</span>
            <input value={values.experience} onChange={set('experience')} maxLength={40} placeholder="e.g. 1–3 years" required />
          </label>
          <label className="admin-field admin-field--full">
            <span>Description <em>{values.summary.length}/600</em></span>
            <textarea value={values.summary} onChange={set('summary')} maxLength={600} rows={4} placeholder="What the person will do in this role" required />
          </label>
          <label className="admin-field admin-field--full">
            <span>Skills <em>comma separated, up to 8</em></span>
            <input value={values.skills} onChange={set('skills')} placeholder="e.g. Figma, Branding, Adobe Illustrator" />
          </label>
          <label className="admin-check admin-field--full">
            <input type="checkbox" checked={values.active} onChange={set('active')} />
            <span>Show this job on the Careers page</span>
          </label>
        </div>

        {error && <p className="admin-error" role="alert">{error}</p>}

        <div className="admin-modal__actions">
          <button type="button" className="admin-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving && <Loader2 size={16} className="admin-spin" aria-hidden="true" />}
            {job ? 'Save changes' : 'Post job'}
          </button>
        </div>
      </form>
    </div>
  );
}

function JobsPanel({ reloadKey, onSignedOut, onCount }) {
  const { items: jobs, setItems: setJobs, loading, error, setError } =
    useAdminList(fetchAdminJobs, reloadKey, onSignedOut, onCount);
  const [editing, setEditing] = useState(null); // null = closed, {} = new job, job = edit
  const closeEditor = useCallback(() => setEditing(null), []);

  const handleSaved = (saved, isEdit) => {
    setJobs((list) => (isEdit ? list.map((j) => (j.id === saved.id ? saved : j)) : [...list, saved]));
    setEditing(null);
  };

  const toggleVisible = async (job) => {
    const next = { ...job, active: !job.active };
    setJobs((list) => list.map((j) => (j.id === job.id ? next : j)));
    try {
      await updateJob(job.id, next);
    } catch {
      setError('Could not change this job.');
      setJobs((list) => list.map((j) => (j.id === job.id ? job : j)));
    }
  };

  const remove = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? It will be removed from the Careers page. Applications already received are kept.`)) return;
    try {
      await deleteJob(job);
      setJobs((list) => list.filter((j) => j.id !== job.id));
    } catch {
      setError('Could not delete this job.');
    }
  };

  return (
    <>
      <div className="admin-jobs__bar">
        <p className="admin-jobs__note">
          {jobs.filter((j) => j.active).length} shown on the Careers page · {jobs.filter((j) => !j.active).length} hidden
        </p>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => setEditing({})}>
          <Plus size={16} aria-hidden="true" />
          Post a job
        </button>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}

      {loading && !jobs.length ? (
        <p className="admin-empty"><Loader2 size={18} className="admin-spin" aria-hidden="true" /> Loading jobs…</p>
      ) : !jobs.length ? (
        <p className="admin-empty">No jobs yet. Use “Post a job” to add one.</p>
      ) : (
        <ul className="admin-list">
          {jobs.map((job) => (
            <li key={job.id} className={`admin-app admin-job ${job.active ? '' : 'admin-job--hidden'}`}>
              <div className="admin-app__main">
                <div className="admin-app__top">
                  <h2 className="admin-app__name">{job.title}</h2>
                  <span className={`admin-job__badge ${job.active ? 'admin-job__badge--live' : ''}`}>
                    {job.active ? 'On website' : 'Hidden'}
                  </span>
                </div>
                <p className="admin-job__meta">
                  {[job.department, job.type, job.location, job.experience].join(' · ')}
                </p>
                <p className="admin-job__summary">{job.summary}</p>
                {job.skills.length > 0 && (
                  <ul className="admin-job__skills">
                    {job.skills.map((skill) => <li key={skill}>{skill}</li>)}
                  </ul>
                )}
              </div>
              <div className="admin-app__side">
                <button type="button" className="admin-btn" onClick={() => setEditing(job)}>
                  <Pencil size={16} aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => toggleVisible(job)}
                  aria-label={job.active ? `Hide ${job.title} from the website` : `Show ${job.title} on the website`}
                >
                  {job.active ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  {job.active ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={() => remove(job)}
                  aria-label={`Delete ${job.title}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <JobEditor job={editing.id ? editing : null} onSaved={handleSaved} onClose={closeEditor} />
      )}
    </>
  );
}

const EMPTY_PROJECT = { title: '', description: '', active: true, featured: false };
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Form values for a saved project
const projectValues = (p) => ({ title: p.title, description: p.description, active: p.active, featured: p.featured });

// Create / edit form shown over the Projects list
function ProjectEditor({ project, onSaved, onClose }) {
  const [values, setValues] = useState(() =>
    project ? projectValues(project) : EMPTY_PROJECT
  );
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(project?.image || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Free the local preview of a picked image
  useEffect(() => () => preview.startsWith('blob:') && URL.revokeObjectURL(preview), [preview]);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [key]: value }));
  };

  const pickImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setError('The image must be a JPG, PNG or WebP file.');
    if (file.size > MAX_IMAGE_BYTES) return setError('The image is larger than 5 MB.');
    setError('');
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!project && !imageFile) return setError('Please add a project image.');
    setSaving(true);
    setError('');
    try {
      const saved = project
        ? await updateProject(project.id, values, imageFile)
        : await createProject(values, imageFile);
      onSaved(saved, Boolean(project));
    } catch (err) {
      setError(err.status === 0 ? 'Cannot reach the server.' : err.message);
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose} role="presentation">
      <form
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-editor-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 id="project-editor-title" className="admin-modal__title">{project ? 'Edit project' : 'Post a new project'}</h2>

        <div className="admin-modal__grid">
          <label className="admin-field admin-field--full">
            <span>Project title</span>
            <input value={values.title} onChange={set('title')} maxLength={80} placeholder="e.g. Nova Banking App" required autoFocus />
          </label>
          <label className="admin-field admin-field--full">
            <span>Image <em>JPG, PNG or WebP, up to 5 MB · landscape works best</em></span>
            <div className="admin-image-pick">
              {preview ? (
                <img src={preview} alt="" className="admin-image-pick__preview" />
              ) : (
                <span className="admin-image-pick__empty"><ImagePlus size={22} aria-hidden="true" /></span>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickImage} />
            </div>
          </label>
          <label className="admin-field admin-field--full">
            <span>Description <em>{values.description.length}/400</em></span>
            <textarea value={values.description} onChange={set('description')} maxLength={400} rows={3} placeholder="A short line about the project" required />
          </label>
          <label className="admin-check admin-field--full">
            <input type="checkbox" checked={values.active} onChange={set('active')} />
            <span>Show this project on the website</span>
          </label>
          <label className="admin-check admin-field--full">
            <input type="checkbox" checked={values.featured} onChange={set('featured')} />
            <span>Feature on the home page <em className="admin-check__hint">(also needs to be shown on the website)</em></span>
          </label>
        </div>

        {error && <p className="admin-error" role="alert">{error}</p>}

        <div className="admin-modal__actions">
          <button type="button" className="admin-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving && <Loader2 size={16} className="admin-spin" aria-hidden="true" />}
            {project ? 'Save changes' : 'Post project'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ProjectsPanel({ reloadKey, onSignedOut, onCount }) {
  const { items: projects, setItems: setProjects, loading, error, setError } =
    useAdminList(fetchAdminProjects, reloadKey, onSignedOut, onCount);
  const [editing, setEditing] = useState(null); // null = closed, {} = new project, project = edit
  const closeEditor = useCallback(() => setEditing(null), []);

  const handleSaved = (saved, isEdit) => {
    setProjects((list) => (isEdit ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved]));
    setEditing(null);
  };

  const toggleVisible = async (project) => {
    const next = { ...project, active: !project.active };
    setProjects((list) => list.map((p) => (p.id === project.id ? next : p)));
    try {
      await updateProject(project.id, projectValues(next));
    } catch {
      setError('Could not change this project.');
      setProjects((list) => list.map((p) => (p.id === project.id ? project : p)));
    }
  };

  const remove = async (project) => {
    if (!window.confirm(`Delete "${project.title}"? It will be removed from the website.`)) return;
    try {
      await deleteProject(project);
      setProjects((list) => list.filter((p) => p.id !== project.id));
    } catch {
      setError('Could not delete this project.');
    }
  };

  return (
    <>
      <div className="admin-jobs__bar">
        <p className="admin-jobs__note">
          {projects.filter((p) => p.active).length} shown on the website · {projects.filter((p) => !p.active).length} hidden ·{' '}
          {projects.filter((p) => p.active && p.featured).length} on the home page
        </p>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => setEditing({})}>
          <Plus size={16} aria-hidden="true" />
          Post a project
        </button>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}

      {loading && !projects.length ? (
        <p className="admin-empty"><Loader2 size={18} className="admin-spin" aria-hidden="true" /> Loading projects…</p>
      ) : !projects.length ? (
        <p className="admin-empty">No projects yet. Use “Post a project” to add one.</p>
      ) : (
        <ul className="admin-list">
          {projects.map((project) => (
            <li key={project.id} className={`admin-app admin-job admin-project ${project.active ? '' : 'admin-job--hidden'}`}>
              <img src={project.image} alt="" className="admin-project__thumb" loading="lazy" />
              <div className="admin-app__main">
                <div className="admin-app__top">
                  <h2 className="admin-app__name">{project.title}</h2>
                  <span className={`admin-job__badge ${project.active ? 'admin-job__badge--live' : ''}`}>
                    {project.active ? 'On website' : 'Hidden'}
                  </span>
                  {project.featured && <span className="admin-job__badge admin-job__badge--featured">Featured on home</span>}
                </div>
                <p className="admin-job__summary">{project.description}</p>
              </div>
              <div className="admin-app__side">
                <button type="button" className="admin-btn" onClick={() => setEditing(project)}>
                  <Pencil size={16} aria-hidden="true" />
                  Edit
                </button>
                <button
                  type="button"
                  className="admin-btn"
                  onClick={() => toggleVisible(project)}
                  aria-label={project.active ? `Hide ${project.title} from the website` : `Show ${project.title} on the website`}
                >
                  {project.active ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  {project.active ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={() => remove(project)}
                  aria-label={`Delete ${project.title}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ProjectEditor project={editing.id ? editing : null} onSaved={handleSaved} onClose={closeEditor} />
      )}
    </>
  );
}

const SECTIONS = [
  { id: 'applications', title: 'Job applications', icon: Users },
  { id: 'jobs', title: 'Jobs', icon: Briefcase },
  { id: 'projects', title: 'Projects', icon: FolderKanban },
  { id: 'messages', title: 'Contact messages', icon: MessageSquare },
];

function Dashboard({ admin, onSignedOut }) {
  const [section, setSection] = useState('applications');
  const [reloadKey, setReloadKey] = useState(0);
  const [counts, setCounts] = useState({});
  const setApplicationsCount = useCallback((n) => setCounts((c) => ({ ...c, applications: n })), []);
  const setMessagesCount = useCallback((n) => setCounts((c) => ({ ...c, messages: n })), []);
  const setJobsCount = useCallback((n) => setCounts((c) => ({ ...c, jobs: n })), []);
  const setProjectsCount = useCallback((n) => setCounts((c) => ({ ...c, projects: n })), []);

  return (
    <div className="admin-dash">
      <header className="admin-dash__header">
        <div>
          <h1 className="admin-dash__title">Admin panel</h1>
          <p className="admin-dash__sub">Signed in as {admin.email}</p>
        </div>
        <div className="admin-dash__actions">
          <button type="button" className="admin-btn" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
          <button type="button" className="admin-btn" onClick={() => signOut().finally(onSignedOut)}>
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <nav className="admin-sections" aria-label="Admin sections">
        {SECTIONS.map(({ id, title, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`admin-section ${section === id ? 'admin-section--active' : ''}`}
            aria-pressed={section === id}
            onClick={() => setSection(id)}
          >
            <Icon size={18} aria-hidden="true" />
            {title}
            <span className="admin-section__count">{counts[id] ?? '–'}</span>
          </button>
        ))}
      </nav>

      {/* All sections stay mounted so each count is always up to date */}
      <div hidden={section !== 'applications'}>
        <ApplicationsPanel reloadKey={reloadKey} onSignedOut={onSignedOut} onCount={setApplicationsCount} />
      </div>
      <div hidden={section !== 'jobs'}>
        <JobsPanel reloadKey={reloadKey} onSignedOut={onSignedOut} onCount={setJobsCount} />
      </div>
      <div hidden={section !== 'projects'}>
        <ProjectsPanel reloadKey={reloadKey} onSignedOut={onSignedOut} onCount={setProjectsCount} />
      </div>
      <div hidden={section !== 'messages'}>
        <MessagesPanel reloadKey={reloadKey} onSignedOut={onSignedOut} onCount={setMessagesCount} />
      </div>
    </div>
  );
}

export default function AdminPage() {
  // undefined = checking, null = signed out, { email } = signed in, 'offline' = server not reachable
  const [admin, setAdmin] = useState(undefined);
  const handleSignedOut = useCallback(() => setAdmin(null), []);

  useEffect(() => {
    getAdmin().then(setAdmin).catch(() => setAdmin('offline'));
  }, []);

  let content;
  if (admin === undefined) {
    content = <p className="admin-empty"><Loader2 size={18} className="admin-spin" aria-hidden="true" /> Loading…</p>;
  } else if (admin === 'offline') {
    content = (
      <div className="admin-login">
        <Lock size={28} className="admin-login__icon" aria-hidden="true" />
        <h1 className="admin-login__title">Server not running</h1>
        <p className="admin-login__note">
          Start the applications server with <code>npm run server</code> (see <code>server/README.md</code>), then refresh this page.
        </p>
      </div>
    );
  } else if (!admin) {
    content = <LoginForm onSignedIn={setAdmin} />;
  } else {
    content = <Dashboard admin={admin} onSignedOut={handleSignedOut} />;
  }

  return (
    <section className="admin-page" aria-label="Admin panel">
      <div className="container">{content}</div>
    </section>
  );
}
