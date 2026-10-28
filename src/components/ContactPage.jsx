import React, { useState } from 'react';
import { closingContent } from '../data/agencyData';
import {
  Copy,
  Check,
  Mail,
  User,
  Phone,
  MessageSquare,
  Send,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import './ContactPage.css';

const emptyForm = { name: '', email: '', phone: '', message: '' };

const validate = (values) => {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (values.phone.trim() && !/^\+?[\d\s()-]{7,20}$/.test(values.phone.trim())) {
    errors.phone = 'Please enter a valid phone number.';
  }
  if (values.message.trim().length < 10) {
    errors.message = 'Please tell us a little more (at least 10 characters).';
  }
  return errors;
};

// Pre-filled message for Gmail compose / default mail app (no backend on this site)
const buildMail = (values) => {
  const subject = `New enquiry from ${values.name.trim()}`;
  const body = [
    `Name: ${values.name.trim()}`,
    `Email: ${values.email.trim()}`,
    `Phone: ${values.phone.trim() || '—'}`,
    '',
    values.message.trim(),
  ].join('\n');
  const to = closingContent.contactEmail;
  return {
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    mailto: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  };
};

const fields = [
  { name: 'name', label: 'Full name', type: 'text', icon: User, placeholder: 'Your name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'you@gmail.com', autoComplete: 'email' },
  { name: 'phone', label: 'Contact number', type: 'tel', icon: Phone, placeholder: 'Your phone number', autoComplete: 'tel', optional: true },
];

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [sentMail, setSentMail] = useState(null);

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(closingContent.contactEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus();
      return;
    }
    const mail = buildMail(values);
    window.open(mail.gmail, '_blank', 'noopener,noreferrer');
    setSentMail(mail);
  };

  const handleReset = () => {
    setValues(emptyForm);
    setErrors({});
    setSentMail(null);
  };

  return (
    <section id="contact" className="section contact-page reveal-blur-section" aria-label="Contact Cybervex Digital">
      <div className="contact-page__glow" aria-hidden="true" />
      <div className="container">
        <div className="contact-layout">
          {/* Left: Intro & Direct Details */}
          <div className="contact-intro">
            <span className="section-label">{closingContent.label}</span>
            <h1 className="contact-heading">{closingContent.heading}</h1>
            <p className="contact-subheading">{closingContent.subheading}</p>

            <div className="contact-email-card">
              <span className="contact-email-card__icon" aria-hidden="true">
                <Mail size={18} />
              </span>
              <div className="contact-email-card__body">
                <span className="contact-email-card__label">Email us directly</span>
                <a
                  href={`mailto:${closingContent.contactEmail}`}
                  className="contact-email-card__link"
                  title="Send email to Cybervex Digital"
                >
                  {/* Only allow a line break after "@" on very narrow screens */}
                  {closingContent.contactEmail.split('@')[0]}@<wbr />
                  {closingContent.contactEmail.split('@')[1]}
                </a>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="contact-copy-btn"
                aria-label="Copy email address to clipboard"
                title="Copy email address"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="contact-form-card">
            {sentMail ? (
              <div className="contact-success" role="status">
                <span className="contact-success__icon" aria-hidden="true">
                  <CheckCircle2 size={34} />
                </span>
                <h2 className="contact-form-card__title">Your message is ready</h2>
                <p className="contact-form-card__note">
                  We opened Gmail with your details filled in. Just press <strong>Send</strong> there and
                  we&apos;ll get back to you soon.
                </p>
                <div className="contact-success__actions">
                  <a
                    href={sentMail.gmail}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-submit-btn"
                  >
                    <span>Open Gmail again</span>
                    <ArrowUpRight size={17} />
                  </a>
                  <a href={sentMail.mailto} className="contact-secondary-btn">
                    Use my default mail app
                  </a>
                </div>
                <button type="button" className="contact-reset-btn" onClick={handleReset}>
                  Send another message
                </button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit} noValidate>
                <div className="contact-form-card__header">
                  <h2 className="contact-form-card__title">Send us a message</h2>
                  <p className="contact-form-card__note">
                    Tell us about your project and we&apos;ll reply within one business day.
                  </p>
                </div>

                <div className="contact-form__grid">
                  {fields.map(({ name, label, type, icon: Icon, placeholder, autoComplete, optional }) => (
                    <div
                      key={name}
                      className={`contact-field ${name === 'name' ? 'contact-field--full' : ''} ${
                        errors[name] ? 'contact-field--error' : ''
                      }`}
                    >
                      <label htmlFor={`contact-${name}`} className="contact-field__label">
                        {label}
                        {optional && <span className="contact-field__optional">Optional</span>}
                      </label>
                      <div className="contact-field__control">
                        <Icon size={17} className="contact-field__icon" aria-hidden="true" />
                        <input
                          id={`contact-${name}`}
                          name={name}
                          type={type}
                          value={values[name]}
                          onChange={handleChange}
                          placeholder={placeholder}
                          autoComplete={autoComplete}
                          className="contact-field__input"
                          aria-invalid={Boolean(errors[name])}
                          aria-describedby={errors[name] ? `contact-${name}-error` : undefined}
                          required={!optional}
                        />
                      </div>
                      {errors[name] && (
                        <span id={`contact-${name}-error`} className="contact-field__error">
                          {errors[name]}
                        </span>
                      )}
                    </div>
                  ))}

                  <div
                    className={`contact-field contact-field--full ${
                      errors.message ? 'contact-field--error' : ''
                    }`}
                  >
                    <label htmlFor="contact-message" className="contact-field__label">
                      Message
                      <span className="contact-field__optional">{values.message.length}/1000</span>
                    </label>
                    <div className="contact-field__control contact-field__control--textarea">
                      <MessageSquare size={17} className="contact-field__icon" aria-hidden="true" />
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={5}
                        maxLength={1000}
                        value={values.message}
                        onChange={handleChange}
                        placeholder="Tell us about your goals, timeline and budget…"
                        className="contact-field__input contact-field__textarea"
                        aria-invalid={Boolean(errors.message)}
                        aria-describedby={errors.message ? 'contact-message-error' : undefined}
                        required
                      />
                    </div>
                    {errors.message && (
                      <span id="contact-message-error" className="contact-field__error">
                        {errors.message}
                      </span>
                    )}
                  </div>
                </div>

                <button type="submit" className="contact-submit-btn">
                  <span>Submit message</span>
                  <Send size={17} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
