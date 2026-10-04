import { useMemo } from 'react';
import { COUNTRIES } from '../data/countries';
import {
  CAREER_ROLES,
  EDUCATION_LEVELS,
  EMPLOYERS,
  EXPERIENCE_LEVELS,
  ROLE_KEYWORDS,
  SKILL_OPTIONS,
  UNIVERSITIES
} from '../data/careerOptions';

function suggestionsForJobDescription(text, currentRole) {
  const normalized = String(text || '').toLowerCase();
  return ROLE_KEYWORDS
    .filter(({ role, keywords }) => role !== currentRole && keywords.some((keyword) => normalized.includes(keyword)))
    .map(({ role }) => role)
    .filter((role, index, roles) => roles.indexOf(role) === index)
    .slice(0, 3);
}

export default function CVUpload({
  form,
  authAccount,
  authEmail,
  authBusy,
  authMessage,
  authError,
  hasCareerProfile,
  loading,
  error,
  onChange,
  onSkillsChange,
  onRoleSelect,
  onSubmit,
  onAuthEmailChange,
  onRequestSignInLink,
  onSignOut,
  onDeleteAccount,
  onDeleteCareerProfile
}) {
  const skills = Array.isArray(form.skills) ? form.skills : String(form.skills || '').split(',').map((item) => item.trim()).filter(Boolean);
  const suggestedSkills = useMemo(() => {
    const cv = String(form.cvText || '').toLowerCase();
    return SKILL_OPTIONS.filter((skill) =>
      cv.includes(skill.toLowerCase()) && !skills.includes(skill)
    ).slice(0, 5);
  }, [form.cvText, skills]);
  const suggestedRoles = suggestionsForJobDescription(form.jobDescription, form.role);

  const toggleSkill = (skill) => {
    const next = skills.includes(skill)
      ? skills.filter((selected) => selected !== skill)
      : [...skills, skill];
    onSkillsChange(next);
  };

  return (
    <section className="panel">
      <form onSubmit={onSubmit} className="cv-form">
        <section className="form-section" aria-labelledby="personal-profile-heading">
          <div className="form-section-heading">
            <span className="section-number">01</span>
            <div>
              <h2 id="personal-profile-heading">Personal profile</h2>
              <p>A username is only needed if you choose to publish a public career profile.</p>
            </div>
          </div>
          {import.meta.env.VITE_PUBLIC_CAREER_PROFILES_ENABLED === 'true' ? (
            <div className="auth-panel" aria-live="polite">
              {authAccount ? (
                <>
                  <p>Signed in as <strong>{authAccount.username}</strong>.</p>
                  <div className="button-row">
                    <button type="button" className="secondary-button" onClick={onSignOut} disabled={authBusy}>Sign out</button>
                    {hasCareerProfile ? (
                      <button type="button" className="danger-button" onClick={onDeleteCareerProfile} disabled={authBusy}>Remove public profile</button>
                    ) : null}
                    <button type="button" className="danger-button" onClick={onDeleteAccount} disabled={authBusy}>Delete account and profile</button>
                  </div>
                  {hasCareerProfile ? null : <p className="field-help">Your account has no public Career ELO profile. Publish one using the separate consent and update button below.</p>}
                </>
              ) : (
                <>
                  <p>Verify your email to create or manage a public career profile. Application analysis does not require an account.</p>
                  <div className="field-grid">
                    <label className="field">
                      <span>Email for sign-in link</span>
                      <input
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={authEmail}
                        onChange={(event) => onAuthEmailChange(event.target.value)}
                      />
                    </label>
                    <label className="field">
                      <span>Desired public username</span>
                      <input
                        name="username"
                        type="text"
                        autoComplete="nickname"
                        maxLength={40}
                        pattern="[A-Za-z0-9._-]{3,40}"
                        value={form.username || ''}
                        onChange={onChange}
                      />
                    </label>
                  </div>
                  <button type="button" className="secondary-button" onClick={onRequestSignInLink} disabled={authBusy}>
                    {authBusy ? 'Sending…' : 'Email me a sign-in link'}
                  </button>
                </>
              )}
              {authMessage ? <p className="field-help" role="status">{authMessage}</p> : null}
              {authError ? <p className="error-message" role="alert">{authError}</p> : null}
            </div>
          ) : null}
          <div className="field-grid">
            {import.meta.env.VITE_PUBLIC_CAREER_PROFILES_ENABLED !== 'true' ? (
              <label className="field">
                <span>Username</span>
                <input name="username" type="text" autoComplete="nickname" maxLength={40} value={form.username || ''} onChange={onChange} />
              </label>
            ) : null}

            <label className="field">
              <span>Country</span>
              <select name="country" value={form.country || ''} onChange={onChange}>
                <option value="">Choose a country</option>
                {COUNTRIES.map(({ code, name }) => <option value={name} key={code}>{name}</option>)}
              </select>
              <small className="field-help">Suggested from your browser language settings; optional and only published with your career profile.</small>
            </label>

            <label className="field">
              <span>Age group <span className="optional-label">Optional</span></span>
              <select name="ageGroup" value={form.ageGroup || ''} onChange={onChange}>
                <option value="">Prefer not to say</option>
                <option value="18-20">18–20</option>
                <option value="21-25">21–25</option>
                <option value="26-30">26–30</option>
                <option value="31-35">31–35</option>
                <option value="36+">36+</option>
              </select>
            </label>
          </div>
        </section>

        <section className="form-section" aria-labelledby="career-profile-heading">
          <div className="form-section-heading">
            <span className="section-number">02</span>
            <div>
              <h2 id="career-profile-heading">Career profile</h2>
              <p>Choose the role and career stage you are targeting.</p>
            </div>
          </div>
          <div className="field-grid">
            <label className="field">
              <span>Target role</span>
              <select name="role" value={form.role} onChange={onChange}>
                {CAREER_ROLES.map((role) => <option key={role}>{role}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Experience level</span>
              <select name="experienceLevel" value={form.experienceLevel || 'Student'} onChange={onChange}>
                {EXPERIENCE_LEVELS.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Highest education</span>
              <select name="education" value={form.education} onChange={onChange}>
                {EDUCATION_LEVELS.map((level) => <option key={level}>{level}</option>)}
              </select>
            </label>
          </div>

          {suggestedRoles.length ? (
            <div className="suggestion-block">
              <span className="suggestion-label">Suggested from your job description</span>
              <div className="suggestion-chips">
                {suggestedRoles.map((role) => (
                  <button type="button" className="suggestion-chip" key={role} onClick={() => onRoleSelect(role)}>
                    Use {role}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="form-section" aria-labelledby="skills-evidence-heading">
          <div className="form-section-heading">
            <span className="section-number">03</span>
            <div>
              <h2 id="skills-evidence-heading">Skills &amp; evidence</h2>
              <p>Select skills for either analysis. Optional credential details are used only for a career-profile update.</p>
            </div>
          </div>
          <div className="field-grid">
            <p className="field-help field-wide">
              Be honest about your experience, skills, and achievements. Accurate details produce the most useful benchmark; inflated claims can distort your application percentile.
            </p>
            <div className="field field-wide">
              <span id="skills-label">Top skills <span className="optional-label">Choose up to 12</span></span>
              <details className="skill-picker">
                <summary aria-labelledby="skills-label">
                  {skills.length ? `${skills.length} skills selected · ${skills.slice(0, 4).join(', ')}${skills.length > 4 ? '…' : ''}` : 'Choose skills'}
                </summary>
                <div className="skill-picker-options">
                  {SKILL_OPTIONS.map((skill) => (
                    <label className="skill-option" key={skill}>
                      <input
                        type="checkbox"
                        checked={skills.includes(skill)}
                        disabled={!skills.includes(skill) && skills.length >= 12}
                        onChange={() => toggleSkill(skill)}
                      />
                      <span>{skill}</span>
                    </label>
                  ))}
                </div>
              </details>
              {suggestedSkills.length ? (
                <div className="suggestion-block">
                  <span className="suggestion-label">Found in your CV</span>
                  <div className="suggestion-chips">
                    {suggestedSkills.map((skill) => (
                      <button type="button" className="suggestion-chip" key={skill} onClick={() => onSkillsChange([...skills, skill].slice(0, 12))}>
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <label className="field field-wide">
              <span>Credentials &amp; project details <span className="optional-label">Optional · self-reported</span></span>
              <textarea
                name="credentialEvidence"
                value={form.credentialEvidence || ''}
                onChange={onChange}
                rows={3}
                placeholder="Certifications, awards, GitHub projects, or other relevant details"
              />
              <small className="field-help">Do not include contact details, home address, date of birth, government identifiers, health details, or other sensitive personal information.</small>
            </label>

            <label className="field field-wide">
              <span>Portfolio or project link <span className="optional-label">Optional</span></span>
              <input name="portfolioUrl" type="url" autoComplete="url" value={form.portfolioUrl || ''} onChange={onChange} />
            </label>
          </div>

          <details className="cohort-details">
            <summary>Optional university and employer comparisons</summary>
            <p className="field-help">Used only to compare within a matching self-reported group. Choose Other to leave that comparison blank.</p>
            <div className="field-grid">
              <label className="field">
                <span>University</span>
                <select name="university" value={form.university || ''} onChange={onChange}>
                  <option value="">Not specified</option>
                  {UNIVERSITIES.map((university) => <option key={university}>{university}</option>)}
                </select>
              </label>
              <label className="field">
                <span>Employer</span>
                <select name="company" value={form.company || ''} onChange={onChange}>
                  <option value="">Not specified</option>
                  {EMPLOYERS.map((company) => <option key={company}>{company}</option>)}
                </select>
              </label>
            </div>
          </details>
        </section>

        <section className="form-section" aria-labelledby="cv-content-heading">
          <div className="form-section-heading">
            <span className="section-number">04</span>
            <div>
              <h2 id="cv-content-heading">CV &amp; job description</h2>
              <p>We use both to calculate role alignment and application competitiveness.</p>
            </div>
          </div>
          <div className="field-grid">
            <label className="field field-wide">
              <span>CV content</span>
              <textarea
                name="cvText"
                value={form.cvText}
                onChange={onChange}
                rows={8}
                required
                maxLength={30000}
                placeholder="Paste relevant experience, projects, skills, and results (maximum 30,000 characters). Remove contact details, home address, date of birth, and sensitive information first."
              />
            </label>

            <label className="field field-wide">
              <span>Target job description <span className="optional-label">Optional, improves JD-fit</span></span>
              <textarea
                name="jobDescription"
                value={form.jobDescription}
                onChange={onChange}
                rows={6}
                maxLength={20000}
                placeholder="Paste the internship or role description you are targeting."
              />
            </label>
          </div>
        </section>

        <div className="button-row">
          <button type="submit" name="analysisType" value="application" disabled={loading}>
            {loading ? 'Processing…' : 'Analyze this application'}
          </button>
          {import.meta.env.VITE_PUBLIC_CAREER_PROFILES_ENABLED === 'true' && authAccount ? (
            <button type="submit" name="analysisType" value="career" className="secondary-button" disabled={loading}>
              {loading ? 'Processing…' : 'Update Global Career ELO'}
            </button>
          ) : null}
        </div>
        <label className="consent-option">
          <input
            name="termsAcceptance"
            type="checkbox"
            checked={Boolean(form.termsAcceptance)}
            onChange={onChange}
          />
          <span>
            I have read and agree to the <a href="/?page=terms" target="_blank" rel="noreferrer">Terms of Use</a>. The <a href="/?page=privacy" target="_blank" rel="noreferrer">Privacy Policy</a> explains how my information is handled.
          </span>
        </label>
        <label className="consent-option">
          <input
            name="adultConfirmation"
            type="checkbox"
            checked={Boolean(form.adultConfirmation)}
            onChange={onChange}
          />
          <span>I confirm that I am 18 or older.</span>
        </label>
        <label className="consent-option">
          <input
            name="publicationConsent"
            type="checkbox"
            checked={Boolean(form.publicationConsent)}
            onChange={onChange}
          />
          <span>
            Only required to update Global Career ELO: I agree that my username, Career ELO, career level, score history, signals, and selected comparison groups will appear on public profile and leaderboard pages until I remove my public profile. My email is used for account ownership and is not shown publicly.
          </span>
        </label>
        <p className="field-help">
          Updating Career ELO is a separate action. It ignores the target role and job description; application analysis never changes your Career ELO.
        </p>

        {error ? <p className="error-message">{error}</p> : null}
      </form>
    </section>
  );
}
