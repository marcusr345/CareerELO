import { useEffect, useState } from 'react';
import axios from 'axios';
import CVUpload from './components/CVUpload';
import ResultsCard from './components/ResultsCard';
import GlobalPrestigePanel from './components/GlobalPrestigePanel';
import LegalPages from './components/LegalPages';
import { detectCountryFromBrowser } from './data/countries';

const defaultForm = {
  username: '',
  role: 'Software Engineer',
  careerTitle: 'Student',
  experienceLevel: 'Student',
  experience: '0',
  country: detectCountryFromBrowser(),
  ageGroup: '',
  university: '',
  company: '',
  skills: [],
  education: "Bachelor's",
  location: 'Remote',
  credentialEvidence: '',
  portfolioUrl: '',
  cvText: '',
  jobDescription: '',
  termsAcceptance: false,
  adultConfirmation: false,
  publicationConsent: false
};

const EXPERIENCE_YEARS = {
  Student: 0,
  Graduate: 0,
  Junior: 2,
  Mid: 5,
  Senior: 8
};

const CAREER_TITLES = {
  Student: 'Student',
  Graduate: 'Graduate',
  Junior: 'Junior',
  Mid: 'Mid-level',
  Senior: 'Senior'
};

const CAREER_PROFILES_ENABLED = import.meta.env.VITE_PUBLIC_CAREER_PROFILES_ENABLED === 'true';

export default function App() {
  const legalPage = new URLSearchParams(window.location.search).get('page');
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [careerResult, setCareerResult] = useState(null);
  const [leaderboards, setLeaderboards] = useState({ global: [], byRole: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authAccount, setAuthAccount] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [magicLinkToken, setMagicLinkToken] = useState('');
  const [hasCareerProfile, setHasCareerProfile] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('magic-link');
    if (token) {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      setMagicLinkToken(token);
    }
    const initializeAuth = async () => {
      if (token) return;
      try {
        const response = await axios.get('/api/auth/session');
        if (response.data?.authenticated) {
          setAuthAccount({ username: response.data.username, email: response.data.email });
          setForm((current) => ({ ...current, username: response.data.username }));
          const profileResponse = await axios.get(`/api/profile/${encodeURIComponent(response.data.username)}`);
          setHasCareerProfile(Boolean(profileResponse.data?.profile));
        }
      } catch {
        setAuthError('Unable to check your sign-in status. Refresh and try again.');
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (legalPage || !CAREER_PROFILES_ENABLED) return undefined;
    const loadLeaderboards = async () => {
      try {
        const response = await axios.get('/api/leaderboards');
        setLeaderboards(response.data || { global: [], byRole: {} });
      } catch (err) {
        setLeaderboards({ global: [], byRole: {} });
      }
    };

    loadLeaderboards();
    return undefined;
  }, [legalPage]);

  const requestSignInLink = async () => {
    setAuthBusy(true);
    setAuthError('');
    setAuthMessage('');
    if (!form.adultConfirmation) {
      setAuthError('Confirm that you are 18 or older before requesting a career-profile sign-in link.');
      setAuthBusy(false);
      return;
    }
    if (!form.termsAcceptance) {
      setAuthError('Accept the Terms of Use before requesting a career-profile sign-in link.');
      setAuthBusy(false);
      return;
    }
    try {
      const response = await axios.post('/api/auth/request-link', {
        email: authEmail,
        username: form.username,
        adultConfirmation: form.adultConfirmation,
        termsAcceptance: form.termsAcceptance
      });
      setAuthMessage(response.data.message || 'Check your email for a sign-in link.');
    } catch (authRequestError) {
      setAuthError(authRequestError.response?.data?.error || 'Unable to send a sign-in link.');
    } finally {
      setAuthBusy(false);
    }
  };

  const completeMagicSignIn = async () => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const response = await axios.post('/api/auth/verify', { token: magicLinkToken });
      setAuthAccount({ username: response.data.username });
      setForm((current) => ({ ...current, username: response.data.username }));
      const profileResponse = await axios.get(`/api/profile/${encodeURIComponent(response.data.username)}`);
      setHasCareerProfile(Boolean(profileResponse.data?.profile));
      setMagicLinkToken('');
      setAuthMessage('Your email is verified and you are signed in.');
    } catch (authRequestError) {
      setAuthError(authRequestError.response?.data?.error || 'Unable to verify this sign-in link.');
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    setAuthBusy(true);
    setAuthError('');
    try {
      await axios.post('/api/auth/logout');
      setAuthAccount(null);
      setHasCareerProfile(false);
      setAuthMessage('You have signed out.');
    } catch (authRequestError) {
      setAuthError(authRequestError.response?.data?.error || 'Unable to sign out.');
    } finally {
      setAuthBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete your CareerELO account and public career profile? This cannot be undone.')) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      await axios.delete('/api/account');
      setAuthAccount(null);
      setCareerResult(null);
      setHasCareerProfile(false);
      setAuthMessage('Your account and public career profile have been deleted.');
    } catch (authRequestError) {
      setAuthError(authRequestError.response?.data?.error || 'Unable to delete your account.');
    } finally {
      setAuthBusy(false);
    }
  };

  const deleteCareerProfile = async () => {
    if (!window.confirm('Remove your public Career ELO profile? Your sign-in account will remain.')) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      await axios.delete('/api/career-profile');
      setCareerResult(null);
      setHasCareerProfile(false);
      setAuthMessage('Your public career profile has been removed. Your sign-in account remains active.');
    } catch (authRequestError) {
      setAuthError(authRequestError.response?.data?.error || 'Unable to remove your public profile.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      if (name === 'experienceLevel') {
        return {
          ...prev,
          experienceLevel: value,
          experience: String(EXPERIENCE_YEARS[value] ?? 0),
          careerTitle: CAREER_TITLES[value] || 'Student'
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSkillsChange = (skills) => {
    setForm((prev) => ({ ...prev, skills }));
  };

  const handleRoleSelect = (role) => {
    setForm((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitter = event.nativeEvent.submitter;
      const isCareerUpdate = submitter?.value === 'career';
      if (!form.termsAcceptance) {
        setError('Accept the Terms of Use before continuing.');
        return;
      }
      if (!form.adultConfirmation) {
        setError('Confirm that you are 18 or older to continue.');
        return;
      }

      if (isCareerUpdate) {
        if (!form.publicationConsent) {
          setError('Agree to public career-profile display before updating Global Career ELO.');
          return;
        }
        if (!form.username.trim()) {
          setError('Choose a username for your public career profile.');
          return;
        }
        const response = await axios.post('/api/career-profile', {
          cvText: form.cvText,
          skills: form.skills.join(', '),
          experience: Number(form.experience) || 0,
          careerTitle: form.careerTitle,
          education: form.education,
          certifications: form.credentialEvidence,
          country: form.country,
          ageGroup: form.ageGroup,
          university: form.university === 'Other' ? '' : form.university,
          company: form.company === 'Other' ? '' : form.company,
          publicationConsent: form.publicationConsent,
          adultConfirmation: form.adultConfirmation,
          termsAcceptance: form.termsAcceptance
        });
        setCareerResult(response.data.profile);
        setHasCareerProfile(true);
        const leaderboardResponse = await axios.get('/api/leaderboards');
        setLeaderboards(leaderboardResponse.data || { global: [], byRole: {} });
      } else {
        const response = await axios.post('/api/upload-cv', {
          cvText: form.cvText,
          jobDescription: form.jobDescription,
          role: form.role,
          experience: Number(form.experience) || 0,
          skills: form.skills.join(', '),
          education: form.education,
          termsAcceptance: form.termsAcceptance,
          adultConfirmation: form.adultConfirmation
        });
        setResult(response.data.result || response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to analyze the CV.');
    } finally {
      setLoading(false);
    }
  };

  if (legalPage) {
    return (
      <div className="app-shell">
        <LegalPages page={legalPage} />
        <footer className="site-footer">
          <nav aria-label="Legal and accessibility">
            <a href="/?page=privacy">Privacy</a>
            <a href="/?page=terms">Terms</a>
            <a href="/?page=cookies">Cookies</a>
            <a href="/?page=accessibility">Accessibility</a>
          </nav>
        </footer>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="hero">
        <div className="hero-top">
          <div>
            <div className="eyebrow">CareerELO</div>
            <h1>Benchmark your career and applications separately.</h1>
          </div>
          <span className="pill">Career ELO · application analysis</span>
        </div>
        <p className="subtitle">
          Global Career ELO ranks your overall career profile. Application percentiles and recommendations assess one target role separately and never change your ELO. Honest details make both results more useful.
        </p>
      </header>

      <main className="main-grid" id="main-content">
        {magicLinkToken ? (
          <div className="panel auth-panel">
            <p>Click below to complete your CareerELO sign-in.</p>
            <button type="button" onClick={completeMagicSignIn} disabled={authBusy}>
              {authBusy ? 'Verifying…' : 'Complete email sign-in'}
            </button>
          </div>
        ) : null}
        <CVUpload
          form={form}
          authAccount={authAccount}
          authEmail={authEmail}
          authBusy={authBusy}
          authMessage={authMessage}
          authError={authError}
          hasCareerProfile={hasCareerProfile}
          loading={loading}
          error={error}
          onChange={handleChange}
          onSkillsChange={handleSkillsChange}
          onRoleSelect={handleRoleSelect}
          onSubmit={handleSubmit}
          onAuthEmailChange={setAuthEmail}
          onRequestSignInLink={requestSignInLink}
          onSignOut={signOut}
          onDeleteAccount={deleteAccount}
          onDeleteCareerProfile={deleteCareerProfile}
        />

        <ResultsCard result={result} />
      </main>
      {!CAREER_PROFILES_ENABLED ? (
        <p className="field-help">
          Public Career ELO profiles are disabled in this deployment until email sign-in, database, and security configuration are completed. Application analysis remains available.
        </p>
      ) : null}
      {careerResult ? (
        <GlobalPrestigePanel result={careerResult} leaderboards={leaderboards} />
      ) : null}
      <footer className="site-footer">
        <span>CareerELO provides informational benchmarks, not hiring decisions or guarantees.</span>
        <nav aria-label="Legal and accessibility">
          <a href="/">Home</a>
          <a href="/?page=privacy">Privacy</a>
          <a href="/?page=terms">Terms</a>
          <a href="/?page=cookies">Cookies</a>
          <a href="/?page=accessibility">Accessibility</a>
        </nav>
      </footer>
    </div>
  );
}
