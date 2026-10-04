# CareerELO

CareerELO keeps Global Career ELO separate from role-specific application analysis.

## Public-launch readiness

The policy pages under `/?page=privacy`, `/?page=terms`, `/?page=cookies`, and `/?page=accessibility` are pre-launch drafts, not legal advice. The operator and privacy contact are filled in. Supabase London and Microsoft Outlook SMTP are planned selections, but the Supabase project has not been created and Outlook SMTP has not been tested. Verify the live provider accounts, service terms, processing/transfer locations, lawful bases, and database backup expiry before launch. The privacy page does not publish a home address; check whether your circumstances require a different business-contact disclosure.

**Public Career ELO profile publishing is disabled by default. Keep `PUBLIC_CAREER_PROFILES_ENABLED` and `VITE_PUBLIC_CAREER_PROFILES_ENABLED` false until a persistent database, verified email delivery, production origin, secrets, Terms acceptance, and end-to-end account/profile deletion checks are configured and verified in the deployed environment.**

The service is configured for adults aged 18 or over. It is not yet a complete compliance certification or a substitute for an appropriate legal, privacy, accessibility, and security review.

## Local development

Requirements: Node.js 20 or later and npm.

```sh
npm install
npm run dev
```

The frontend runs at `http://localhost:5173`; the API runs at `http://localhost:4000`.

## Deploy with GitHub and Vercel

1. Push this repository to GitHub.
2. In Vercel, import the GitHub repository as a new project. Keep the project root set to the repository root.
3. Create a Supabase PostgreSQL project in the selected London, UK region, if available on your chosen plan. Record its actual region and backup/retention settings. If another region is used, update the Privacy Policy’s transfer disclosures. Copy the database connection URI from Supabase and follow its PostgreSQL SSL instructions.
4. Add these environment variables in the Vercel project settings for every environment you deploy:
   - `DATABASE_URL`: a PostgreSQL connection URL for a persistent database.
   - `DATABASE_SSL`: `true` if your PostgreSQL provider requires SSL; otherwise `false`.
   - `CRON_SECRET`: a unique, high-entropy secret used by Vercel to authenticate the daily retention-cleanup task.
   - `RATE_LIMIT_SECRET`: a different random secret of at least 32 characters for keyed IP pseudonymisation and rate limiting.
   - `AUTH_SESSION_SECRET`: another unique random secret of at least 32 characters for signing HttpOnly sessions.
   - `SITE_URL`: the exact public HTTPS origin, such as `https://your-domain.example`, without a path.
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM`: credentials and verified sender details for an SMTP email provider. The usual Outlook submission endpoint is `smtp-mail.outlook.com`, port `587`, STARTTLS (`SMTP_SECURE=false`), with the full mailbox as `SMTP_USER` and `CareerELO@outlook.com` as `MAIL_FROM`; verify these settings and SMTP AUTH support for this specific mailbox with Microsoft before relying on them. Use only credentials Microsoft supports for SMTP, never your ordinary mailbox password where another authentication method is required. If the mailbox cannot send via SMTP, use a transactional email provider and update the Privacy Policy.
   - `PUBLIC_CAREER_PROFILES_ENABLED=true` and `VITE_PUBLIC_CAREER_PROFILES_ENABLED=true` only after all preceding setup and end-to-end sign-in, update, and deletion checks pass. The `VITE_` setting is public build configuration, never a secret.
5. Deploy with public career profiles disabled. Vercel uses `vercel.json` to build the Vite frontend into `frontend/dist` and routes `/api/*` requests to the Express API function in `api/[...path].js`.
6. Verify the deployed frontend/API, database persistence, scheduled retention cleanup, Terms acceptance, magic-link delivery, profile update/removal, backup settings, security headers, and throttling. Only enable public profiles after those checks pass.

Generate each of `CRON_SECRET`, `RATE_LIMIT_SECRET`, and `AUTH_SESSION_SECRET` independently (for example, with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`), then add the values directly to Vercel Environment Variables. Never commit them or place them in any `VITE_` variable. Configure the SMTP sender with your email provider and use its verified sending domain. Do not send real credentials in chat or commit them; set them directly in Vercel’s encrypted environment-variable settings.

The database is required for reliable production persistence. Without it, the app uses in-memory storage, which is suitable only for local development and is not durable across serverless function instances. The database schema is created automatically when the API first accesses it. Application benchmark rows contain role, score, accepted Terms version, and timestamp and are cleaned up by a daily Vercel cron; the next application analysis also triggers cleanup if the scheduled task was unavailable. Configure `CRON_SECRET`, `RATE_LIMIT_SECRET`, and `AUTH_SESSION_SECRET` in Vercel and verify the cron succeeds after deployment. Application analysis is limited to 10 requests per client IP per fixed hour; email-link requests are limited to five per IP and address per hour. Only keyed HMACs of IP and email identifiers are stored in the rate-limit table, and those rows expire after 48 hours.

Vercel automatically redeploys the project when new changes are pushed to the connected GitHub branch.

## Legal, privacy, and data operations

- Name the controller and provide a monitored privacy contact in the privacy and terms pages. For this individual/sole-trader student project, do not publish a home address unless your circumstances or another legal obligation require it. Before launch, identify the actual Vercel, Supabase, Outlook/SMTP, and other provider services, locations, contracts, retention periods, and transfer safeguards.
- Confirm and document the UK GDPR lawful basis for each processing purpose. The policy text contains proposed bases that require operator review.
- Keep CareerELO for adults 18+ unless a separate assessment and child-safety programme is completed.
- The optional public-profile account feature sets a strictly necessary HttpOnly session cookie. Do not add analytics, advertising, external AI processing, or third-party embeds without reviewing the cookie notice, privacy policy, consent requirements, and processor terms first.
- Signed-in users can delete their email account and public career profile in the interface. Confirm provider backup expiry and any copied/indexed public-profile data; deletion from the active database cannot remove third-party copies.
- Anonymous application benchmark rows cannot be associated with a requester once stored; they contain no username or CV text and are removed after 12 months by the retention task.
- Rate limiting stores keyed HMACs of client IP and email identifiers for up to 48 hours to enforce limits of 10 application analyses per IP per hour and five email-link requests per IP/address per hour; it does not store raw values in the application database.
- Keep database credentials server-side in Vercel Environment Variables. Never put secrets in a `VITE_` variable, client bundle, commit, or issue.

## Copyright and third-party licences

The current frontend uses CSS gradients and system-font fallbacks; it does not intentionally bundle stock photography, commercial font files, or third-party icon packs. Use original work or assets with a licence that permits your intended commercial/public use. Keep the asset, author, source, licence, and attribution/notice requirements in a maintained asset register.

The source and npm dependencies have their own licences. The current lockfile inventory declares MIT (213 packages), MIT-0 (1), ISC (13), Apache-2.0 (2), BSD-2-Clause (1), BSD-3-Clause (2), 0BSD (1), and CC-BY-4.0 (1, `caniuse-lite`); preserve required notices and attribution and re-run the inventory when dependencies change. No GPL/AGPL/LGPL dependency is currently declared, but review every direct and transitive dependency before distribution. Bump `TERMS_VERSION` in `backend/src/server.js` whenever the Terms of Use materially change. **This repository has no root `LICENSE` file:** choose and add a licence for your own code before presenting it as open source; without one, others do not automatically have permission to reuse it. Third-party dependency licences do not grant rights to your original source. Obtain commercial permission for proprietary assets. Do not copy CVs, job ads, logos, university marks, company marks, templates, or online images into demos without permission. Use CSS, original illustrations, or properly licensed public-domain/CC0 assets as safer alternatives.

## Security and deployment checklist

- [ ] Confirm privacy lawful bases, actual providers/regions, transfer safeguards, contact process, retention, and backup periods; review the policies against the deployed setup.
- [ ] Keep `PUBLIC_CAREER_PROFILES_ENABLED` and `VITE_PUBLIC_CAREER_PROFILES_ENABLED` unset/false until verified SMTP, signed sessions, database persistence, request origin, and account/profile deletion are configured and verified end-to-end.
- [ ] Set a persistent PostgreSQL `DATABASE_URL`; use `DATABASE_SSL=true` when required. Restrict database network access and credentials; test restore and deletion.
- [ ] Use HTTPS only. `vercel.json` configures CSP, HSTS, clickjacking/content-type/referrer protections, and disabled camera/microphone/location.
- [ ] Keep API endpoints same-origin; do not re-enable wildcard CORS. Configure Vercel/platform edge rate limiting and abuse controls as an additional layer for public analysis. Authenticated state-changing routes require the configured exact `SITE_URL` Origin and use a `SameSite=Strict` HttpOnly session cookie; retain and test these protections.
- [ ] Maintain JSON request limits and field-length validation. Keep SQL parameterized. React escapes rendered text; never render user-supplied CV/job text as HTML or use `dangerouslySetInnerHTML`.
- [ ] Do not log request bodies, CVs, job descriptions, tokens, or database URLs. Review Vercel and database provider logging/retention controls.
- [ ] Run `npm audit` and a third-party licence inventory; review/patch advisories and record licence notices. Enable GitHub secret scanning and Dependabot where available.
- [ ] Before enabling public profile writes, verify magic-link sign-up/sign-in, protected profile updates, account/profile deletion, username conflicts, session expiry, CSRF origin rejection, email deliverability, and abuse handling. Publish a way to request access/correction and report abuse.
- [ ] Test required Terms acceptance, publication controls, under-18 rejection, oversized/malformed requests, SQL-injection strings, XSS strings, CORS, headers, authenticated retention cleanup, and that application requests never persist CV text or username.
- [ ] Do not use scores as automated hiring decisions. Show small-sample limitations and no-guarantee language anywhere results are presented.

## SEO checklist

- [ ] Replace generic metadata with the final public domain, accurate page titles/descriptions, and social preview metadata.
- [ ] Add a canonical domain, `robots.txt`, and sitemap only after legal placeholders are complete and public pages are ready to index.
- [ ] Ensure privacy, terms, cookies, accessibility, and contact links are visible and crawlable.
- [ ] Use descriptive headings, meaningful link names, mobile layouts, and non-misleading score/percentile labels.
- [ ] Do not put CV text, usernames intended to be private, or personal profile data in URLs, page titles, or analytics.

## Accessibility checklist

- [ ] Test keyboard-only use, visible focus, labels, error announcements, skip navigation, zoom/reflow, and screen-reader reading order.
- [ ] Verify text/control contrast against WCAG 2.2 AA and do not convey score meaning by colour alone.
- [ ] Provide text alternatives for informative images and accessible summaries for charts.
- [ ] Test common desktop and mobile screen readers and publish an accurate statement of known limitations and an accessible feedback contact.

## Post-deployment monitoring

- [ ] Check `/api/health`, the production frontend, all policy pages, CSP/HSTS headers, and HTTPS redirects after each deployment.
- [ ] Monitor Vercel function errors/latency, database health/capacity, dependency/security alerts, and backup/restore success without capturing submitted content.
- [ ] Verify scheduled/triggered retention cleanup, profile deletion requests, provider backup expiry, and access to production secrets.
- [ ] Re-test accessibility and mobile layouts after UI changes; review score wording, percentile sample sizes, and public content for accuracy.
- [ ] Maintain an incident-response contact and process for personal-data breaches, including assessment and ICO/user notification where legally required.
