import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, Clock, MapPin, Users, ArrowUpRight } from 'lucide-react';
import { careersContent, openPositions } from '../data/careersData';
import { fetchJobs } from '../lib/applications';
import JobApplicationModal from './JobApplicationModal';
import './CareersPage.css';

export default function CareersPage() {
  const [applyingFor, setApplyingFor] = useState(null);
  const closeForm = useCallback(() => setApplyingFor(null), []);
  // null while loading; jobs come from the admin panel (falls back to the starter list offline)
  const [jobs, setJobs] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchJobs()
      .then((list) => !cancelled && setJobs(list))
      .catch(() => !cancelled && setJobs(openPositions));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="careers"
      className="section careers-page reveal-blur-section"
      aria-label="Careers at Cybervex Digital"
    >
      <div className="container">
        <header className="careers-page__header">
          <h1 className="careers-page__title">{careersContent.heading}</h1>
          <p className="careers-page__intro">{careersContent.intro}</p>
          <p className="careers-page__count">
            <span className="careers-page__dot" aria-hidden="true" />
            {jobs === null
              ? 'Loading open positions…'
              : `${jobs.length} open ${jobs.length === 1 ? 'position' : 'positions'}`}
          </p>
        </header>

        {jobs?.length === 0 && (
          <p className="careers-page__empty">
            There are no open positions right now. Check back soon, or send your CV and we&apos;ll keep it on file.
          </p>
        )}

        <ul className="careers-list">
          {(jobs || []).map((job) => (
            <li key={job.id} className="job-card">
              <div className="job-card__content">
                <h2 className="job-card__title">{job.title}</h2>

                <ul className="job-card__meta" aria-label="Job details">
                  <li className="job-card__meta-item">
                    <Users size={14} aria-hidden="true" />
                    {job.department}
                  </li>
                  <li className="job-card__meta-item">
                    <Clock size={14} aria-hidden="true" />
                    {job.type}
                  </li>
                  <li className="job-card__meta-item">
                    <MapPin size={14} aria-hidden="true" />
                    {job.location}
                  </li>
                  <li className="job-card__meta-item">
                    <Briefcase size={14} aria-hidden="true" />
                    {job.experience}
                  </li>
                </ul>

                <p className="job-card__summary">{job.summary}</p>

                {job.skills?.length > 0 && (
                  <ul className="job-card__skills" aria-label="Key skills">
                    {job.skills.map((skill) => (
                      <li key={skill} className="job-card__skill">
                        {skill}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="job-card__action">
                <button
                  type="button"
                  onClick={() => setApplyingFor(job)}
                  className="job-card__apply"
                  aria-label={`Apply for ${job.title}`}
                  aria-haspopup="dialog"
                >
                  Apply
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <p className="careers-page__note">
          Don't see your role? Send your CV to{' '}
          <a href={`mailto:${careersContent.applyEmail}`} className="careers-page__email">
            {careersContent.applyEmail}
          </a>
        </p>
      </div>

      {applyingFor && <JobApplicationModal job={applyingFor} onClose={closeForm} />}
    </section>
  );
}
