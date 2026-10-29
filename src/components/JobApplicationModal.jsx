import React, { useEffect, useRef, useState } from 'react';
import { X, User, Mail, Phone, MapPin, FileText, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { submitApplication, MAX_RESUME_BYTES } from '../lib/applications';
import { careersContent } from '../data/careersData';
import './JobApplicationModal.css';

const EMPTY = { name: '', email: '', phone: '', city: '' };

const fields = [
  { name: 'name', label: 'Full name', type: 'text', icon: User, placeholder: 'Your full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'you@gmail.com', autoComplete: 'email' },
  { name: 'phone', label: 'Contact number', type: 'tel', icon: Phone, placeholder: '03XX XXXXXXX', autoComplete: 'tel' },
  { name: 'city', label: 'City', type: 'text', icon: MapPin, placeholder: 'Your city', autoComplete: 'address-level2' },
];

const validate = (values, resume) => {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
  const digits = values.phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15 || /[^\d\s+\-()]/.test(values.phone)) {
    errors.phone = 'Please enter a valid contact number.';
  }
  if (values.city.trim().length < 2) errors.city = 'Please enter your city.';
  if (!resume) errors.resume = 'Please upload your resume (PDF).';
  return errors;
};

const formatSize = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function JobApplicationModal({ job, onClose }) {
  const [values, setValues] = useState(EMPTY);
  const [resume, setResume] = useState(null);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | failed
  const [failMessage, setFailMessage] = useState('');
  const dialogRef = useRef(null);
  const firstFieldRef = useRef(null);
  const fileInputRef = useRef(null);

  // Lock page scroll, close on Escape, focus the first field
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    firstFieldRef.current?.focus();
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isPdf) {
      setResume(null);
      setErrors((prev) => ({ ...prev, resume: 'Only PDF files are accepted.' }));
    } else if (file.size > MAX_RESUME_BYTES) {
      setResume(null);
      setErrors((prev) => ({ ...prev, resume: 'The file is larger than 5 MB.' }));
    } else {
      setResume(file);
      setErrors((prev) => ({ ...prev, resume: undefined }));
    }
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, resume);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = dialogRef.current?.querySelector('[aria-invalid="true"], .job-apply__upload--error button');
      first?.focus();
      return;
    }
    setStatus('sending');
    try {
      await submitApplication(job, values, resume);
      setStatus('sent');
    } catch (err) {
      // 400 = the server rejected a field (its message says which); otherwise a server/network problem
      setFailMessage(err.status === 400 || err.status === 429 ? err.message : '');
      setStatus('failed');
    }
  };

  return (
    <div className="job-apply-overlay" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className="job-apply"
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-apply-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="job-apply__close" onClick={onClose} aria-label="Close application form">
          <X size={20} />
        </button>

        {status === 'sent' ? (
          <div className="job-apply__done" role="status">
            <CheckCircle2 size={44} className="job-apply__done-icon" aria-hidden="true" />
            <h2 id="job-apply-title" className="job-apply__title">Application sent</h2>
            <p className="job-apply__note">
              Thank you, {values.name.trim().split(' ')[0]}. We&apos;ve received your application for{' '}
              <strong>{job.title}</strong> and will contact you if your profile is a match.
            </p>
            <button type="button" className="job-apply__submit" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <h2 id="job-apply-title" className="job-apply__title">Apply for {job.title}</h2>
            <p className="job-apply__note">Fill in your details and upload your resume. All fields are required.</p>

            <div className="job-apply__grid">
              {fields.map(({ name, label, type, icon: Icon, placeholder, autoComplete }, idx) => (
                <div key={name} className={`job-apply__field ${errors[name] ? 'job-apply__field--error' : ''}`}>
                  <label htmlFor={`apply-${name}`} className="job-apply__label">{label}</label>
                  <div className="job-apply__control">
                    <Icon size={17} className="job-apply__icon" aria-hidden="true" />
                    <input
                      ref={idx === 0 ? firstFieldRef : undefined}
                      id={`apply-${name}`}
                      name={name}
                      type={type}
                      value={values[name]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      autoComplete={autoComplete}
                      className="job-apply__input"
                      aria-invalid={Boolean(errors[name])}
                      aria-describedby={errors[name] ? `apply-${name}-error` : undefined}
                      maxLength={name === 'email' ? 200 : name === 'phone' ? 30 : 120}
                      required
                    />
                  </div>
                  {errors[name] && (
                    <span id={`apply-${name}-error`} className="job-apply__error">{errors[name]}</span>
                  )}
                </div>
              ))}

              <div className={`job-apply__field job-apply__field--full ${errors.resume ? 'job-apply__upload--error' : ''}`}>
                <span className="job-apply__label" id="apply-resume-label">Resume (PDF, max 5 MB)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFile}
                  className="job-apply__file-input"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className={`job-apply__upload ${resume ? 'job-apply__upload--ready' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  aria-labelledby="apply-resume-label"
                  aria-describedby={errors.resume ? 'apply-resume-error' : undefined}
                >
                  {resume ? (
                    <>
                      <FileText size={22} aria-hidden="true" />
                      <span className="job-apply__upload-text">
                        <span className="job-apply__file-name">{resume.name}</span>
                        <span className="job-apply__file-meta">{formatSize(resume.size)} · Click to change</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={22} aria-hidden="true" />
                      <span className="job-apply__upload-text">
                        <span className="job-apply__file-name">Upload your resume</span>
                        <span className="job-apply__file-meta">PDF only, up to 5 MB</span>
                      </span>
                    </>
                  )}
                </button>
                {errors.resume && (
                  <span id="apply-resume-error" className="job-apply__error">{errors.resume}</span>
                )}
              </div>
            </div>

            {status === 'failed' && (
              <p className="job-apply__alert" role="alert">
                {failMessage || 'Something went wrong while sending your application. Please try again.'}{' '}
                You can also email your CV to{' '}
                <a href={`mailto:${careersContent.applyEmail}?subject=${encodeURIComponent(`Job Application — ${job.title}`)}`}>
                  {careersContent.applyEmail}
                </a>
                .
              </p>
            )}

            <button type="submit" className="job-apply__submit" disabled={status === 'sending'}>
              {status === 'sending' ? (
                <>
                  <Loader2 size={18} className="job-apply__spinner" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                'Submit application'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
