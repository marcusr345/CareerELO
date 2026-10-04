const LEGAL_OPERATOR = 'Marcus Russell';
const PRIVACY_CONTACT = 'CareerELO@outlook.com';

const pages = {
  privacy: {
    title: 'Privacy Policy',
    updated: '4 October 2026',
    intro: 'This is a pre-launch draft. The operator and privacy contact are identified below. The listed infrastructure providers are planned selections only; verify the live accounts, processing regions, contracts, transfer safeguards, and retention settings before launch.',
    sections: [
      {
        title: 'Who is responsible for your information?',
        paragraphs: [
          `${LEGAL_OPERATOR}, operating CareerELO as an individual/sole trader, is the data controller. Contact: ${PRIVACY_CONTACT}. This contact is monitored for privacy requests. A home address is not published here; confirm any other applicable business-contact disclosure requirements before launch.`,
          'CareerELO is intended for people aged 18 or over. It is a student project and is not currently an employment agency or recruiter.'
        ]
      },
      {
        title: 'What information is processed?',
        paragraphs: ['Only provide information needed for a benchmark. The information depends on which action you choose.'],
        bullets: [
          'Application analysis: CV text or career summary, target role, optional job description, selected skills, education, and experience. The request is processed to return your role-fit score, percentile, CV health indicator, skill gaps, and recommendations.',
          'Career account: email address used for one-time sign-in links and account ownership, plus the username you choose. Email addresses are not displayed publicly. One-time authentication tokens are stored as hashes and expire after 15 minutes.',
          'Terms acceptance: the version and acceptance timestamp are stored with a career account, or with the anonymous application benchmark record, to record acceptance of the Terms of Use.',
          'Career profile: CV text and career details are processed to calculate Career ELO, experience, skills, education, optional credential/project details, and optional country, age group, university, and employer comparison fields. A timestamp is stored when you explicitly agree to publish or update your profile. The CV text is used to calculate the profile but is not saved in the CareerELO profile database.',
          'Public career profile: if you separately choose to publish/update it, your username associated with an email-verified account, Career ELO, career level, score history, selected comparison fields, and career signal metrics may be publicly available through the profile and leaderboard pages. Email verification confirms access to the email inbox; it does not verify real-world identity. Your email address is not shown publicly.',
          'Application benchmark pool: CareerELO stores only the target role, calculated application score, Terms version, and timestamp for up to 12 months. It does not store the CV text, job description, username, or contact details with that benchmark.',
          'Security rate limiting: keyed HMACs of client IP and email identifiers are held for up to 48 hours to enforce request limits; the raw values are not stored in this rate-limit table. Hosting, database, and email providers may separately process IP address, request time, browser/device details, and operational logs.',
          'Planned providers (not yet configured or verified): Vercel for hosting, Supabase PostgreSQL with a planned London, UK region, and Microsoft Outlook using the CareerELO@outlook.com mailbox for sign-in email. Confirm the actual provider accounts, service terms, data-processing terms, processing locations, and applicable privacy notices before launch; update this notice if the live setup differs.'
        ]
      },
      {
        title: 'Information you should not submit',
        paragraphs: [
          'Remove phone numbers, personal email addresses, home addresses, exact dates of birth, passport or national identity numbers, financial details, account credentials, and any information not needed to describe your professional experience.',
          'Do not submit special-category or highly sensitive information, including health or disability details, ethnicity, political or religious views, trade-union membership, sexual life or orientation, biometric or genetic data, or criminal-offence information. CareerELO is not designed to assess those details.'
        ]
      },
      {
        title: 'Why we use information and our lawful bases',
        bullets: [
          'To provide a benchmark you request and return results: the operator must confirm and document the applicable UK GDPR lawful basis before launch. The proposed basis is taking steps at your request to provide the service; do not rely on this wording without checking that it fits the actual service and terms.',
          'To provide verified email sign-in and maintain your account: the operator must confirm and document the applicable UK GDPR lawful basis before launch.',
          'To create a public career profile and display the username and selected comparison details: your separate, affirmative publication choice is the proposed consent basis. You can use application analysis without creating or publishing a profile.',
          'To protect, maintain, and troubleshoot the service: the operator may rely on legitimate interests where those interests are not overridden by your rights, and must document that assessment.',
          'To comply with legal obligations: processing is limited to what the applicable obligation requires.'
        ]
      },
      {
        title: 'How the benchmarks work',
        paragraphs: [
          'CareerELO uses an automated, rule-based model. Global Career ELO is calculated from career-profile information and is separate from job applications and job descriptions. Application analysis is role-specific and does not use or change ELO.',
          'The model is experimental, may be incomplete or inaccurate, and is not independently verified. It does not make hiring decisions or produce a guaranteed employment outcome. Small comparison pools can make percentiles unstable.'
        ]
      },
      {
        title: 'Who receives information?',
        paragraphs: [
          'CareerELO does not sell CV content or provide application text to employers or recruiters. CV and job-description text is sent to CareerELO’s hosting/API service for processing and is not stored in the CareerELO scoring database. Public profile information is visible to anyone who visits the applicable profile or leaderboard.',
          'Hosting, database, and configured SMTP/email processors may handle information on CareerELO’s behalf. The email provider receives your address and the one-time sign-in link when you request access. Before launch, list each processor, its purpose, processing location, contract, retention period, and privacy notice. Do not add analytics, advertising, AI, or other processors without updating this policy and assessing the legal requirements first.'
        ]
      },
      {
        title: 'International transfers',
        paragraphs: [
          'The intended database region is London, UK. Vercel and Microsoft may process data in other locations depending on the selected plans and services. Before launch, verify every processing location and confirm the applicable UK transfer mechanism and safeguards, such as UK adequacy regulations or an approved transfer agreement and risk assessment. Do not launch until these details have been checked against the actual provider configurations.'
        ]
      },
      {
        title: 'Retention and deletion',
        bullets: [
          'CV text, job-description text, and application details are processed for the request and are not intentionally retained in the application scoring database. Infrastructure logs may be retained by providers under their own configured periods; confirm and state those periods before launch.',
          'Anonymous application benchmark records (role, score, timestamp) are removed after 12 months by the scheduled daily retention task. If that task is unavailable, the next application benchmark request also triggers cleanup. Because no username or CV is attached, CareerELO cannot identify or selectively remove an individual benchmark after it has been stored.',
          'Career account and profile information remains until you remove your public profile or delete your account using the signed-in account controls, or contact the privacy address below. Removing a profile deletes its public ELO data while retaining the email account. Account deletion removes both the account and its public career profile from the active database. Confirm the actual database backup schedule and expiry in the selected Supabase plan before launch, and state the maximum period here; deleted records may remain in backups until that provider retention period ends.',
          'Unused sign-in links expire after 15 minutes and are deleted during scheduled cleanup. Security rate-limit hashes are deleted after 48 hours.',
          'Career-account Terms acceptance records are deleted when the account is deleted. Anonymous benchmark records, including their Terms version and timestamp, expire after 12 months.',
          'Limited records may be retained where the law requires it or to establish, exercise, or defend legal claims. They will be restricted and deleted when no longer needed.'
        ]
      },
      {
        title: 'Your UK GDPR rights',
        paragraphs: [
          `You may request access, correction, erasure, restriction, or (where applicable) portability, object to processing based on legitimate interests, and withdraw consent to public display. You can delete your account and profile using the signed-in account controls. For other requests, email ${PRIVACY_CONTACT}; the operator may ask you to sign in to verify control. Do not email a CV, password, identity document, or special-category information.`,
          'We aim to respond within one month. You can complain to the Information Commissioner’s Office at https://ico.org.uk/make-a-complaint/.'
        ]
      },
      {
        title: 'Children and automated decisions',
        paragraphs: [
          'CareerELO is limited to adults aged 18 or over. If you believe a child’s information has been submitted, contact the privacy contact above so the operator can restrict and delete it.',
          'CareerELO does not make decisions about hiring, employment, or access to services that have legal or similarly significant effects. Do not use its score as the sole basis for a decision about a person.'
        ]
      },
      {
        title: 'Security and policy changes',
        paragraphs: [
          'CareerELO uses reasonable technical and organisational measures, including request-size limits, parameterised database queries, access controls provided by its vendors, and transport/security headers. No internet service can promise absolute security. The operator must maintain incident-response procedures and processor agreements.',
          'This policy should be updated when data practices, providers, retention, or purposes change. The publication date above must reflect the current version.'
        ]
      }
    ]
  },
  terms: {
    title: 'Terms of Use',
    updated: '4 October 2026',
    intro: `These pre-launch draft terms govern use of CareerELO, operated by ${LEGAL_OPERATOR}. Review them for the live service and applicable law before launch.`,
    sections: [
      {
        title: 'About the service',
        paragraphs: [
          'CareerELO provides experimental career benchmarking and CV-improvement information. It is not a recruitment agency, employer, legal adviser, educational institution, or accredited assessment provider.',
          'The service has two independent parts: public Global Career ELO profiles and private, role-specific application analysis. Application scores and recommendations do not affect Global Career ELO. Public profile publishing is only available when enabled by the operator.'
        ]
      },
      {
        title: 'Eligibility and your responsibilities',
        bullets: [
          'Before submitting a CV analysis or requesting a career-profile sign-in link, you must actively accept these Terms of Use using the checkbox provided.',
          'You must be at least 18 years old.',
          'Provide accurate information and only content you are entitled to submit. Do not impersonate another person or use a username that you do not control.',
          'Do not include sensitive personal information, contact details, account credentials, confidential employer information, or another person’s CV in CV text unless you have a lawful reason and authority.',
          'Do not use the service to harass, discriminate against, profile unlawfully, make employment decisions, probe or attack the service, or upload malware.',
          'Keep a copy of your own CV and other material. CareerELO is not a document-storage service.'
        ]
      },
      {
        title: 'Public career profiles',
        paragraphs: [
          'Application analysis does not publish your email, username, or score. Updating Global Career ELO requires email sign-in and a separate affirmative public-display choice. If you make that choice, your username, Career ELO, history, and selected comparison details may appear on public profile and leaderboard pages and may be indexed or copied by others. Email verification confirms access to an inbox, not real-world identity.',
          'Your account email is used for one-time sign-in links and is not displayed publicly. While signed in, you can remove the public profile but retain your account, or delete both. Removal cannot recall copies or search-engine caches already made by third parties.'
        ]
      },
      {
        title: 'Scoring, accuracy, and no guarantee',
        paragraphs: [
          'Scores, percentiles, career levels, keyword matches, and suggestions are model outputs based on the information supplied and the available comparison pool. They may be wrong, incomplete, biased, or affected by a small or unrepresentative sample. Submitted claims are not independently verified.',
          'A score is an informational estimate, not a hiring decision, professional qualification, prediction of success, or guarantee of an interview, job, salary, or promotion. Use your own judgement and seek qualified advice where appropriate.'
        ]
      },
      {
        title: 'Your content and intellectual property',
        paragraphs: [
          'You retain rights in content you submit. You permit CareerELO to process it only as needed to provide the feature you choose and operate the service. Application text is not saved in the scoring database; an anonymous role/score/Terms-version/timestamp benchmark may be retained for up to 12 months. By selecting the Terms acceptance checkbox before use, you agree to these Terms with the CareerELO operator, subject to applicable law and your non-excludable rights.',
          'CareerELO’s original code, branding, and materials remain owned by their respective rights holders. Open-source components are provided under their own licences. You must not copy or reuse third-party content without permission.'
        ]
      },
      {
        title: 'Fees',
        paragraphs: [
          'The current student-project version does not offer paid features or take payments. If paid features are introduced, clear pricing, contract terms, and any applicable cancellation or refund rights will be shown before you purchase.'
        ]
      },
      {
        title: 'Availability, suspension, and changes',
        paragraphs: [
          'CareerELO is a student project and may change, be unavailable, or be discontinued. The operator may suspend access to protect users, comply with law, or address abuse. Material term changes should be dated and communicated before they apply where required.'
        ]
      },
      {
        title: 'Liability and consumer rights',
        paragraphs: [
          'Nothing in these terms limits liability where it would be unlawful to do so, including liability for death or personal injury caused by negligence, fraud, or fraudulent misrepresentation, or any consumer right that cannot legally be excluded.',
          'Subject to those mandatory rights, CareerELO is provided for general information and the operator is not responsible for decisions made solely from a score or for third-party copies of public profile information. Any limitation must be reviewed for fairness and enforceability under UK consumer law before launch.'
        ]
      },
      {
        title: 'Contact and governing law',
        paragraphs: [
          `Questions or complaints: ${PRIVACY_CONTACT}. These draft terms are intended to use the law of England and Wales, with any mandatory consumer protections in the country where you live preserved. Confirm the appropriate governing law, contact disclosures, and dispute process with a qualified adviser.`
        ]
      }
    ]
  },
  cookies: {
    title: 'Cookie Notice',
    updated: '4 October 2026',
    intro: 'CareerELO does not use analytics or advertising cookies. If you sign in to manage a public career profile, it sets one strictly necessary, HttpOnly session cookie so the account feature works.',
    sections: [
      {
        title: 'Cookies and similar technologies',
        paragraphs: [
          'Cookies are small files stored by a website in your browser. The optional email-authenticated profile feature uses a first-party session cookie for up to seven days. It is HttpOnly, uses SameSite=Strict, and is Secure on the production HTTPS site. It is used only to keep you signed in and is cleared when you sign out or delete your account. Application analysis does not require sign-in and does not use this cookie.',
          'CareerELO does not intentionally use analytics, advertising, or preference cookies. Confirm whether the final hosting configuration or selected providers use additional technologies before launch.',
          'If analytics, advertising, embedded content, or other non-essential storage is added, update this notice and obtain any required consent before setting or reading it. Provide a way to withdraw consent and do not treat continued browsing as consent.'
        ]
      },
      {
        title: 'Managing cookies',
        paragraphs: [
          `You can manage or clear cookies in your browser settings. Blocking strictly necessary provider technologies may affect site availability. Contact the operator at ${PRIVACY_CONTACT} with questions.`
        ]
      }
    ]
  },
  accessibility: {
    title: 'Accessibility Statement',
    updated: '4 October 2026',
    intro: 'CareerELO aims to be usable by as many people as possible. This is a student project; a full accessibility audit has not yet been completed.',
    sections: [
      {
        title: 'Our accessibility goal',
        paragraphs: [
          'We aim to meet WCAG 2.2 AA for the website and to support keyboard navigation, visible focus, meaningful headings and labels, screen-reader names, zoom/reflow, and sufficient text and control contrast. We have not yet independently verified conformance.'
        ]
      },
      {
        title: 'Known limitations and feedback',
        paragraphs: [
          'The score visualisations and dynamically updated results may need additional screen-reader testing. Some colours, focus states, small text, or mobile layouts may not yet meet the target. We will prioritise reported barriers.',
          `To report an accessibility problem or request information in another format, contact ${PRIVACY_CONTACT}. Include the page and a brief description; do not send health or other sensitive information. We aim to acknowledge requests within five working days.`
        ]
      },
      {
        title: 'Enforcement procedure',
        paragraphs: [
          'If you are not satisfied with our response, you may use the relevant equality or accessibility complaint route for your circumstances. The operator should confirm applicable UK accessibility obligations before launch, including whether any public-sector rules apply.'
        ]
      }
    ]
  }
};

export default function LegalPages({ page }) {
  const content = pages[page];
  if (!content) return null;

  return (
    <main className="legal-page" id="main-content">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <p className="legal-draft-notice">
        Draft for a student project. Replace every bracketed item, verify the actual data practices and service providers, and obtain appropriate legal review before public launch.
      </p>
      <a className="legal-home-link" href="/">Back to CareerELO</a>
      <h1>{content.title}</h1>
      <p className="legal-updated">Last updated: {content.updated}</p>
      <p className="legal-intro">{content.intro}</p>
      {content.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.bullets ? (
            <ul>
              {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
          ) : null}
        </section>
      ))}
    </main>
  );
}
