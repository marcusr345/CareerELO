import express from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

import {
  scoreCv,
  buildInsights,
  getRoleProfile,
  computeJdFit,
  computeSkillHeatmap,
  computeImpactDensity,
  calculateGlobalElo,
  calculatePercentile,
  calculateCareerEloHistory,
  buildPrestigeTitles
} from './scoring.js';
import {
  getCareerProfile,
  getCareerProfiles,
  saveCareerProfile,
  getCareerAccountByEmail,
  saveCareerMagicLink,
  consumeCareerMagicLink,
  deleteCareerAccountAndProfile,
  deleteCareerProfile,
  getApplicationBenchmarks,
  saveApplicationBenchmark,
  cleanupExpiredApplicationBenchmarks,
  consumeApplicationRateLimit,
  cleanupExpiredApplicationRateLimits
} from './db.js';
import {
  buildRoleSwitchSimulation,
  computeCvHealthScore,
  normalizeUsername
} from './progression.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const TERMS_VERSION = 'terms-v1';
export default app;

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});
app.use(express.json({ limit: '2mb' }));

function normalizeAttribute(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function isAuthConfigured() {
  try {
    const siteUrl = new URL(process.env.SITE_URL);
    const validSiteUrl = siteUrl.pathname === '/' && !siteUrl.search && !siteUrl.hash &&
      !siteUrl.username && !siteUrl.password &&
      (process.env.VERCEL !== '1' || siteUrl.protocol === 'https:');
    return Boolean(
      validSiteUrl &&
      process.env.AUTH_SESSION_SECRET && process.env.AUTH_SESSION_SECRET.length >= 32 &&
      process.env.RATE_LIMIT_SECRET && process.env.RATE_LIMIT_SECRET.length >= 32 &&
      process.env.SMTP_HOST && process.env.SMTP_USER &&
      process.env.SMTP_PASS && process.env.MAIL_FROM &&
      (process.env.VERCEL !== '1' || process.env.DATABASE_URL)
    );
  } catch {
    return false;
  }
}

function signSession(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', process.env.AUTH_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function readSession(req) {
  const cookies = String(req.headers.cookie || '').split(';').map((entry) => entry.trim());
  const sessionCookie = cookies.find((entry) => entry.startsWith('careereelo_session='));
  if (!sessionCookie || !process.env.AUTH_SESSION_SECRET) return null;
  let value;
  try {
    value = decodeURIComponent(sessionCookie.slice('careereelo_session='.length));
  } catch {
    return null;
  }
  const [encodedPayload, signature] = value.split('.');
  if (!encodedPayload || !signature) return null;
  const expected = Buffer.from(createHmac('sha256', process.env.AUTH_SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url'));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload.username || !payload.email || payload.exp <= Date.now()) return null;
    return { username: payload.username, email: payload.email };
  } catch {
    return null;
  }
}

function setSessionCookie(res, account) {
  const session = signSession({
    username: account.username,
    email: account.email,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000
  });
  res.setHeader('Set-Cookie', [
    `careereelo_session=${encodeURIComponent(session)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    `Max-Age=${SESSION_TTL_SECONDS}`,
    ...(process.env.VERCEL === '1' ? ['Secure'] : [])
  ].join('; '));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', [
    'careereelo_session=',
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    'Max-Age=0',
    ...(process.env.VERCEL === '1' ? ['Secure'] : [])
  ].join('; '));
}

function originIsAllowed(req) {
  const origin = req.get('origin');
  if (!origin) return false;
  try {
    const requestOrigin = new URL(origin);
    const siteOrigin = new URL(process.env.SITE_URL);
    return requestOrigin.origin === siteOrigin.origin;
  } catch {
    return false;
  }
}

async function requireAccount(req, res) {
  if (!originIsAllowed(req)) {
    res.status(403).json({ error: 'Request origin is not allowed.' });
    return null;
  }
  const account = readSession(req);
  if (!account) {
    res.status(401).json({ error: 'Sign in to manage your career profile.' });
    return null;
  }
  try {
    const currentAccount = await getCareerAccountByEmail(account.email);
    if (!currentAccount || currentAccount.username !== account.username) {
      clearSessionCookie(res);
      res.status(401).json({ error: 'Sign in to manage your career profile.' });
      return null;
    }
    return currentAccount;
  } catch (error) {
    console.error('Account verification failed:', error.message);
    res.status(500).json({ error: 'Unable to verify your account.' });
    return null;
  }
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function makeRateLimitHash(value) {
  return createHmac('sha256', process.env.RATE_LIMIT_SECRET || 'careereelo-local-rate-limit')
    .update(value)
    .digest('hex');
}

function getClientIp(req) {
  const candidate = req.get('x-real-ip') || req.get('x-forwarded-for')?.split(',')[0]?.trim();
  return isIP(candidate || '') ? candidate : req.socket.remoteAddress || 'unknown';
}

async function sendMagicLink(email, token) {
  const appUrl = new URL(process.env.SITE_URL);
  if (process.env.VERCEL === '1' && appUrl.protocol !== 'https:') {
    throw new Error('SITE_URL must use HTTPS in production.');
  }
  const link = `${appUrl.origin}/#magic-link=${encodeURIComponent(token)}`;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    disableFileAccess: true,
    disableUrlAccess: true
  });
  try {
    await transport.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Your CareerELO sign-in link',
      text: `Use this one-time link to sign in to CareerELO. It expires in 15 minutes:\n\n${link}\n\nIf you did not request it, you can ignore this email.`,
      html: `<p>Use this one-time link to sign in to CareerELO. It expires in 15 minutes.</p><p><a href="${link}">Sign in to CareerELO</a></p><p>If you did not request it, you can ignore this email.</p>`
    });
  } finally {
    transport.close();
  }
}

async function enforceRateLimit(res, key, maximum, windowMs) {
  const limit = await consumeApplicationRateLimit(makeRateLimitHash(key), maximum, windowMs);
  res.setHeader('RateLimit-Limit', String(maximum));
  res.setHeader('RateLimit-Remaining', String(limit.remaining));
  res.setHeader('RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + limit.retryAfterSeconds));
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfterSeconds));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return false;
  }
  return true;
}

function getCareerPercentiles(profile, profiles) {
  const peers = profiles.filter((row) =>
    String(row.username || '').toLowerCase() !== String(profile.username || '').toLowerCase()
  );
  const globalRows = [...peers, profile];
  const global = calculatePercentile(profile.generalElo, globalRows, 'generalElo');
  const segment = (field, value) => {
    if (!value) return { percentile: null, sampleSize: 0 };
    const rows = globalRows.filter((row) =>
      String(row[field] || '').toLowerCase() === String(value).toLowerCase()
    );
    return calculatePercentile(profile.generalElo, rows, 'generalElo');
  };
  return {
    global,
    country: segment('country', profile.country),
    ageGroup: segment('ageGroup', profile.ageGroup),
    university: segment('university', profile.university),
    company: segment('company', profile.company)
  };
}

function requirePublicCareerProfiles(res) {
  if (process.env.PUBLIC_CAREER_PROFILES_ENABLED === 'true') return true;
  res.status(503).json({ error: 'Public career profiles are currently disabled.' });
  return false;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'careereelo-api' });
});

app.get('/api/auth/session', async (req, res) => {
  const session = readSession(req);
  if (!session || !isAuthConfigured()) return res.json({ authenticated: false });
  try {
    const account = await getCareerAccountByEmail(session.email);
    if (!account || account.username !== session.username) {
      clearSessionCookie(res);
      return res.json({ authenticated: false });
    }
    return res.json({ authenticated: true, username: account.username, email: account.email });
  } catch (error) {
    console.error('Session lookup failed:', error.message);
    return res.status(500).json({ error: 'Unable to check sign-in status.' });
  }
});

app.post('/api/auth/request-link', async (req, res) => {
  if (process.env.PUBLIC_CAREER_PROFILES_ENABLED !== 'true') {
    return res.status(503).json({ error: 'Public career profiles are currently disabled.' });
  }
  if (!isAuthConfigured()) {
    return res.status(503).json({ error: 'Email sign-in is not configured yet.' });
  }
  if (!originIsAllowed(req)) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }
  if (req.body?.adultConfirmation !== true) {
    return res.status(400).json({ error: 'Confirm that you are 18 or older to create or access a career-profile account.' });
  }
  if (req.body?.termsAcceptance !== true) {
    return res.status(400).json({ error: 'Accept the Terms of Use before requesting a sign-in link.' });
  }
  const email = String(req.body?.email || '').trim().toLowerCase();
  const username = String(req.body?.username || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^[a-z0-9._-]{3,40}$/.test(username)) {
    return res.status(400).json({ error: 'Enter a valid email address and a username of 3–40 letters, numbers, dots, underscores, or hyphens.' });
  }

  try {
    if (!await enforceRateLimit(res, `auth-ip:${getClientIp(req)}`, 5, 60 * 60 * 1000) ||
      !await enforceRateLimit(res, `auth-email:${email}`, 5, 60 * 60 * 1000)) return;
    const token = randomBytes(32).toString('base64url');
    await saveCareerMagicLink({
      tokenHash: hashToken(token),
      email,
      username,
      termsVersion: TERMS_VERSION,
      expiresAt: Date.now() + MAGIC_LINK_TTL_MS
    });
    try {
      await sendMagicLink(email, token);
    } catch (error) {
      console.error('Magic-link delivery failed:', error.message);
      return res.status(503).json({ error: 'Unable to send a sign-in email right now. Please try again later.' });
    }
    return res.json({ ok: true, message: 'If sign-in is available for this email, a link has been sent. Check your inbox.' });
  } catch (error) {
    console.error('Magic-link request failed:', error.message);
    return res.status(500).json({ error: 'Unable to request a sign-in link.' });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  if (process.env.PUBLIC_CAREER_PROFILES_ENABLED !== 'true') {
    return res.status(503).json({ error: 'Public career profiles are currently disabled.' });
  }
  if (!isAuthConfigured()) {
    return res.status(503).json({ error: 'Email sign-in is not configured yet.' });
  }
  if (!originIsAllowed(req)) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }
  const token = String(req.body?.token || '');
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
    return res.status(400).json({ error: 'This sign-in link is invalid or has expired. Request a new one.' });
  }
  try {
    if (!await enforceRateLimit(res, `auth-verify-ip:${getClientIp(req)}`, 20, 60 * 60 * 1000)) return;
    const account = await consumeCareerMagicLink(hashToken(token));
    if (!account) {
      return res.status(400).json({ error: 'This sign-in link is invalid, expired, or the username is already in use. Request a new link and choose another username if needed.' });
    }
    setSessionCookie(res, account);
    return res.json({ ok: true, username: account.username });
  } catch (error) {
    console.error('Magic-link verification failed:', error.message);
    return res.status(500).json({ error: 'Unable to complete sign-in.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  if (!originIsAllowed(req)) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }
  clearSessionCookie(res);
  return res.json({ ok: true });
});

app.delete('/api/account', async (req, res) => {
  const account = await requireAccount(req, res);
  if (!account) return;
  try {
    const deleted = await deleteCareerAccountAndProfile(account.username);
    clearSessionCookie(res);
    return res.json({ ok: true, deleted });
  } catch (error) {
    console.error('Career account deletion failed:', error.message);
    return res.status(500).json({ error: 'Unable to delete the account right now. Please try again.' });
  }
});

app.delete('/api/career-profile', async (req, res) => {
  const account = await requireAccount(req, res);
  if (!account) return;
  try {
    const deleted = await deleteCareerProfile(account.username);
    return res.json({ ok: true, deleted });
  } catch (error) {
    console.error('Career profile deletion failed:', error.message);
    return res.status(500).json({ error: 'Unable to remove your public career profile right now.' });
  }
});

app.get('/api/retention-cleanup', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const authorization = req.get('authorization') || '';
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  const received = Buffer.from(authorization);
  if (!secret || expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return res.status(secret ? 401 : 503).json({ error: 'Retention cleanup is unavailable.' });
  }

  try {
    const deleted = await cleanupExpiredApplicationBenchmarks();
    await cleanupExpiredApplicationRateLimits();
    return res.json({ ok: true, deleted });
  } catch (error) {
    console.error('Application benchmark retention cleanup failed:', error.message);
    return res.status(500).json({ error: 'Retention cleanup failed.' });
  }
});

app.get('/api/percentile', async (req, res) => {
  if (!requirePublicCareerProfiles(res)) return;
  const generalElo = Number(req.query.generalElo ?? req.query.globalElo);

  try {
    if (!Number.isFinite(generalElo)) {
      return res.status(400).json({ error: 'A valid Global Career ELO is required.' });
    }
    const profiles = await getCareerProfiles();
    const general = calculatePercentile(generalElo, profiles, 'generalElo');
    return res.json({
      generalElo,
      generalPercentile: general.percentile,
      generalSampleSize: general.sampleSize
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to calculate percentile.' });
  }
});

app.get('/api/elo-history', async (req, res) => {
  if (!requirePublicCareerProfiles(res)) return;
  try {
    if (req.query.username) {
      const username = normalizeUsername(req.query.username);
      const profile = await getCareerProfile(username);
      return res.json({
        username,
        generalHistory: profile?.generalEloHistory || []
      });
    }
    const profiles = await getCareerProfiles();
    return res.json({
      history: profiles.flatMap((profile) => profile.generalEloHistory.map((point) => ({
        ...point,
        username: profile.username
      }))).slice(-8)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load ELO history.' });
  }
});

app.get('/api/leaderboards', async (req, res) => {
  if (!requirePublicCareerProfiles(res)) return;
  try {
    const dimension = String(req.query.dimension || 'global');
    const fieldByDimension = {
      global: null,
      country: 'country',
      university: 'university',
      company: 'company',
      ageGroup: 'ageGroup'
    };
    const allowedDimensions = new Set(Object.keys(fieldByDimension));
    if (!allowedDimensions.has(dimension)) {
      return res.status(400).json({ error: 'Invalid leaderboard dimension.' });
    }
    const value = String(req.query.value || '').slice(0, 255);
    const search = String(req.query.search || '').slice(0, 80);
    const sort = String(req.query.sort || 'generalElo');
    const allowedSorts = new Set(['globalElo', 'generalElo']);
    if (!allowedSorts.has(sort)) return res.status(400).json({ error: 'Invalid leaderboard sort.' });
    const page = Math.min(100000, Math.max(1, Number.parseInt(req.query.page, 10) || 1));
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const field = fieldByDimension[dimension];
    const profiles = await getCareerProfiles();
    const ranked = profiles
      .filter((profile) => !field || !value || String(profile[field] || '').toLowerCase() === value.toLowerCase())
      .filter((profile) => !search || profile.username.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => Number(b.generalElo || 0) - Number(a.generalElo || 0))
      .map((profile, index) => ({
        rank: index + 1,
        username: profile.username,
        generalElo: profile.generalElo,
        globalElo: profile.generalElo,
        prestigeTitles: profile.prestigeTitles || [],
        country: profile.country || '',
        university: profile.university || '',
        company: profile.company || '',
        ageGroup: profile.ageGroup || ''
      }));
    const filtered = ranked.slice((page - 1) * limit, page * limit);

    return res.json({
      global: ranked.slice(0, 8),
      byRole: {},
      entries: filtered,
      page,
      limit,
      total: ranked.length,
      sampleSize: ranked.length,
      dimension,
      value,
      sort: 'generalElo'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load leaderboards.' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  if (!requirePublicCareerProfiles(res)) return;
  try {
    const leaderboard = (await getCareerProfiles())
      .sort((a, b) => Number(b.generalElo || 0) - Number(a.generalElo || 0))
      .slice(0, 8)
      .map((profile, index) => ({
        rank: index + 1,
        username: profile.username,
        generalElo: profile.generalElo,
        globalElo: profile.generalElo,
        prestigeTitles: profile.prestigeTitles || []
      }));
    return res.json({ leaderboard });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load leaderboard.' });
  }
});

app.get('/api/progression', async (req, res) => {
  if (!requirePublicCareerProfiles(res)) return;
  try {
    const username = normalizeUsername(req.query.username || req.query.user || 'student');
    const profile = await getCareerProfile(username);
    return res.json({
      ok: true,
      username,
      progression: profile ? {
        generalElo: profile.generalElo,
        generalEloHistory: profile.generalEloHistory,
        careerLevel: profile.careerLevel,
        prestigeTitles: profile.prestigeTitles,
        updatedAt: profile.updatedAt
      } : null
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load progression.' });
  }
});

app.get('/api/profile/:username', async (req, res) => {
  if (!requirePublicCareerProfiles(res)) return;
  try {
    const username = normalizeUsername(req.params.username);
    const record = await getCareerProfile(username);
    if (!record) return res.status(404).json({ error: 'Career profile not found.' });
    const percentiles = getCareerPercentiles(record, await getCareerProfiles());
    return res.json({
      ok: true,
      profile: {
        username,
        generalElo: record.generalElo,
        careerLevel: record.careerLevel,
        country: record.country,
        ageGroup: record.ageGroup,
        university: record.university,
        company: record.company,
        percentiles,
        generalPercentile: percentiles.global.percentile,
        prestigeTitles: record.prestigeTitles,
        generalHistory: record.generalEloHistory,
        metrics: record.metrics,
        updatedAt: record.updatedAt
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load career profile.' });
  }
});

app.post('/api/jd-fit', async (req, res) => {
  try {
    const { cvText = '', jobDescription = '', role = 'Software Engineer', adultConfirmation, termsAcceptance } = req.body || {};
    if (termsAcceptance !== true || adultConfirmation !== true) {
      return res.status(400).json({ error: 'Accept the Terms of Use and confirm you are 18 or older before analyzing CV text.' });
    }
    if (typeof cvText !== 'string' || cvText.length > 30000 ||
      typeof jobDescription !== 'string' || jobDescription.length > 20000 ||
      typeof role !== 'string' || role.length > 100) {
      return res.status(400).json({ error: 'CV text, job description, or role is too long.' });
    }
    if (!await enforceRateLimit(res, `application-ip:${getClientIp(req)}`, 10, 60 * 60 * 1000)) return;
    const profile = getRoleProfile(role);
    const result = computeJdFit(cvText, jobDescription, profile.skills);
    return res.json({ ok: true, result });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to calculate JD-fit.' });
  }
});

app.post('/api/role-simulator', (req, res) => {
  try {
    const { currentRole, targetRole, currentScore, percentile, jdFit, roleMatch, skillHeatmap, username } = req.body || {};
    const result = buildRoleSwitchSimulation({
      currentRole,
      targetRole,
      currentScore: Number(currentScore || 50),
      percentile: Number(percentile || 50),
      jdFit: Number(jdFit || 0),
      roleMatch: Number(roleMatch || 0),
      skillHeatmap: skillHeatmap || { missing: [] },
      eloHistory: []
    });

    return res.json({ ok: true, username: normalizeUsername(username), result });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to simulate role switch.' });
  }
});

app.post('/api/ai-coach', (req, res) => {
  try {
    const { role, percentile, jdFit, roleMatch, skillHeatmap, applicationScore, impactDensity } = req.body || {};
    const advice = {
      headline: `${role || 'Career'} focus: accelerate your early-career edge`,
      suggestions: [
        jdFit < 70 ? 'Increase JD-fit by matching the language used in the job description and removing generic terms.' : 'Keep your JD-fit strong by preserving the strongest role keywords.',
        roleMatch < 70 ? 'Surface more role-specific skills and proof points higher in the CV.' : 'Keep your role match visible and easy to scan.',
        impactDensity < 20 ? 'Add measurable achievements with clear numbers and business outcomes.' : 'Continue to reinforce impact with outcome-led bullet points.',
        (skillHeatmap?.missing || []).length ? `Prioritise ${(skillHeatmap.missing || []).slice(0, 2).join(', ')} to close the next skill gap.` : 'Your profile is solid; focus on compounding a few high-impact wins.'
      ],
      summary: `Your application score is ${applicationScore || 0}/100. Keep building measurable evidence and role alignment to strengthen your application.`,
      nextAction: 'Add one measurable achievement and one missing role keyword before your next submission.',
      estimatedScoreGain: Math.min(20, 5 + Math.max(0, 70 - Number(jdFit || 0)) * 0.2)
    };

    return res.json({ ok: true, advice });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to generate coach advice.' });
  }
});

app.post('/api/trajectory', (req, res) => {
  try {
    const { role, experience = 0, applicationScore = 0 } = req.body || {};
    const profile = getRoleProfile(role);
    const nextRole = {
      nextTitle: `${role} Senior`,
      adjacentRoles: ['Lead', 'Manager', 'Specialist'],
      growthSignal: 'healthy'
    };

    const prediction = {
      role,
      roleEmphasis: profile.emphasis,
      nextTitle: nextRole.nextTitle,
      adjacentRoles: nextRole.adjacentRoles,
      growthSignal: nextRole.growthSignal,
      competitiveness: applicationScore >= 75 ? 'High' : applicationScore >= 50 ? 'Moderate' : 'Developing'
    };

    return res.json({ ok: true, prediction });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to predict trajectory.' });
  }
});

app.post('/api/career-profile', async (req, res) => {
  try {
    if (process.env.PUBLIC_CAREER_PROFILES_ENABLED !== 'true') {
      return res.status(503).json({ error: 'Public career profiles are currently disabled.' });
    }
    if (!isAuthConfigured()) {
      return res.status(503).json({ error: 'Secure career-profile sign-in is not configured yet.' });
    }
    const account = await requireAccount(req, res);
    if (!account) return;
    const {
      cvText,
      skills,
      experience,
      careerTitle,
      education,
      certifications,
      country,
      ageGroup,
      university,
      company,
      publicationConsent,
      adultConfirmation,
      termsAcceptance
    } = req.body || {};

    if (publicationConsent !== true || adultConfirmation !== true || termsAcceptance !== true) {
      return res.status(400).json({ error: 'Accept the Terms of Use, confirm you are 18 or older, and agree to publish this career profile before continuing.' });
    }
    if (typeof cvText !== 'string' || !cvText.trim() || cvText.length > 30000) {
      return res.status(400).json({ error: 'Enter CV content up to 30,000 characters.' });
    }
    if (String(skills || '').length > 2000 || String(certifications || '').length > 2000) {
      return res.status(400).json({ error: 'Skills or certifications are too long.' });
    }

    const normalizedUsername = account.username;
    const safeAgeGroup = ['18-20', '21-25', '26-30', '31-35', '36+'].includes(String(ageGroup || ''))
      ? String(ageGroup)
      : null;
    const generalEloResult = calculateGlobalElo({
      cvText,
      skills,
      experience,
      title: careerTitle,
      impactDensity: computeImpactDensity(cvText),
      education,
      certifications
    });
    const previous = await getCareerProfile(normalizedUsername);
    const generalEloHistory = previous
      ? calculateCareerEloHistory(generalEloResult.elo, previous.generalEloHistory)
      : [{ timestamp: new Date().toISOString(), elo: generalEloResult.elo, delta: 0 }];
    const candidate = {
      username: normalizedUsername,
      generalElo: generalEloResult.elo,
      country: normalizeAttribute(country, 120) || null,
      ageGroup: safeAgeGroup,
      university: normalizeAttribute(university, 255) || null,
      company: normalizeAttribute(company, 255) || null
    };
    const percentiles = getCareerPercentiles(candidate, await getCareerProfiles());
    const prestigeTitles = buildPrestigeTitles({
      globalPercentile: percentiles.global.percentile,
      ageGroupPercentile: percentiles.ageGroup.percentile,
      globalSampleSize: percentiles.global.sampleSize,
      ageGroupSampleSize: percentiles.ageGroup.sampleSize,
      ageGroup: candidate.ageGroup
    });
    const profile = await saveCareerProfile({
      ...candidate,
      careerLevel: generalEloResult.level,
      generalEloHistory,
      prestigeTitles,
      metrics: { globalEloSignals: generalEloResult.signals }
    });

    return res.json({
      ok: true,
      profile: {
        username: profile.username,
        generalElo: profile.generalElo,
        globalElo: profile.generalElo,
        careerLevel: profile.careerLevel,
        generalEloRange: generalEloResult.range,
        generalEloSignals: generalEloResult.signals,
        generalEloHistory: profile.generalEloHistory,
        generalPercentile: percentiles.global.percentile,
        countryPercentile: percentiles.country.percentile,
        ageGroupPercentile: percentiles.ageGroup.percentile,
        universityPercentile: percentiles.university.percentile,
        companyPercentile: percentiles.company.percentile,
        percentileSamples: {
          global: percentiles.global.sampleSize,
          country: percentiles.country.sampleSize,
          ageGroup: percentiles.ageGroup.sampleSize,
          university: percentiles.university.sampleSize,
          company: percentiles.company.sampleSize
        },
        prestigeTitles: profile.prestigeTitles,
        country: profile.country,
        ageGroup: profile.ageGroup,
        university: profile.university,
        company: profile.company,
        updatedAt: profile.updatedAt
      }
    });
  } catch (error) {
    console.error('Career profile update failed:', error.message);
    return res.status(500).json({ error: 'Unable to update the career profile. Please try again.' });
  }
});

app.post('/api/upload-cv', async (req, res) => {
  try {
    if (process.env.VERCEL === '1' &&
      (!process.env.RATE_LIMIT_SECRET || process.env.RATE_LIMIT_SECRET.length < 32)) {
      return res.status(503).json({ error: 'Application analysis is temporarily unavailable.' });
    }
    if (!await enforceRateLimit(res, `application-ip:${getClientIp(req)}`, 10, 60 * 60 * 1000)) return;

    const {
      cvText,
      jobDescription = '',
      role,
      experience,
      skills,
      education,
      adultConfirmation,
      termsAcceptance
    } = req.body || {};

    if (termsAcceptance !== true) {
      return res.status(400).json({ error: 'Accept the Terms of Use before analyzing an application.' });
    }
    if (adultConfirmation !== true) {
      return res.status(400).json({ error: 'You must confirm that you are 18 or older to use CareerELO.' });
    }
    if (typeof cvText !== 'string' || !cvText.trim() || cvText.length > 30000 ||
      typeof jobDescription !== 'string' || jobDescription.length > 20000 ||
      typeof role !== 'string' || role.length > 100) {
      return res.status(400).json({ error: 'CV text is required (up to 30,000 characters); job description must be up to 20,000 characters and role up to 100 characters.' });
    }
    if (String(skills || '').length > 2000) {
      return res.status(400).json({ error: 'Skills selection is too long.' });
    }
    if (!role) {
      return res.status(400).json({ error: 'CV text and target role are required.' });
    }

    try {
      getRoleProfile(role);
    } catch {
      return res.status(400).json({ error: 'Choose a supported target role.' });
    }

    const scored = scoreCv({
      cvText,
      role,
      experience,
      skills,
      education,
      jobDescription
    });
    const benchmarks = await getApplicationBenchmarks(role);
    const rolePeers = [...benchmarks, { role, score: scored.applicationScore }];
    const percentile = calculatePercentile(scored.applicationScore, rolePeers, 'score');
    await saveApplicationBenchmark(role, scored.applicationScore, TERMS_VERSION);
    const cvHealthScore = computeCvHealthScore({
      percentile: percentile.percentile,
      roleMatch: scored.roleMatch,
      jdFit: scored.jdFit.fitScore,
      impactDensity: scored.impactDensity,
      score: scored.applicationScore,
      completeness: Math.min(100, (cvText.length > 500 ? 40 : 20) + (skills ? 25 : 0) + (jobDescription ? 35 : 0))
    });
    const insights = buildInsights({
      role,
      score: scored.applicationScore,
      percentile: percentile.percentile,
      roleMatch: scored.roleMatch,
      emphasis: scored.emphasis,
      jdFit: scored.jdFit,
      skillHeatmap: scored.skillHeatmap
    });

    return res.json({
      ok: true,
      result: {
        ...scored,
        percentile: percentile.percentile,
        applicationPercentile: percentile.percentile,
        percentileSamples: { role: percentile.sampleSize },
        percentileBand: insights.percentileBand,
        cvHealthScore,
        insights: insights.bullets,
        summary: insights.summary,
        roleEmphasis: scored.emphasis,
        missingKeywords: scored.jdFit.missing,
        recommendations: insights.bullets
      }
    });
  } catch (error) {
    console.error('Application analysis failed:', error.message);
    return res.status(500).json({ error: 'Unable to complete application analysis. Please try again.' });
  }
});

app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request is too large. Shorten the text and try again.' });
  }
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error('Unhandled API error:', error.message);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`CareerELO API running on http://localhost:${PORT}`);
  });
}
