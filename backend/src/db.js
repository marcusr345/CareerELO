import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const memoryCareerProfiles = new Map();
const memoryApplicationBenchmarks = [];
const memoryApplicationRateLimits = new Map();
const memoryAccountsByEmail = new Map();
const memoryAccountsByUsername = new Map();
const memoryMagicLinks = new Map();

if (process.env.VERCEL === '1' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be configured for persistent CareerELO deployments on Vercel.');
}

const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false
  })
  : null;

let schemaPromise = null;

async function ensureTables() {
  if (!pool) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS career_profiles (
        username VARCHAR(80) PRIMARY KEY,
        general_elo INTEGER NOT NULL,
        general_elo_history JSONB NOT NULL DEFAULT '[]'::jsonb,
        country VARCHAR(120),
        age_group VARCHAR(40),
        university VARCHAR(255),
        company VARCHAR(255),
        career_level VARCHAR(80),
        prestige_titles JSONB NOT NULL DEFAULT '[]'::jsonb,
        metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
        publication_consent_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      ALTER TABLE career_profiles
      ADD COLUMN IF NOT EXISTS publication_consent_at TIMESTAMPTZ
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS application_benchmarks (
        id SERIAL PRIMARY KEY,
        role VARCHAR(255) NOT NULL,
        score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
        terms_version VARCHAR(40),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      ALTER TABLE application_benchmarks
      ADD COLUMN IF NOT EXISTS terms_version VARCHAR(40)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS application_benchmarks_role_created_idx
        ON application_benchmarks (role, created_at DESC)
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS application_rate_limits (
        key_hash CHAR(64) NOT NULL,
        window_start TIMESTAMPTZ NOT NULL,
        request_count INTEGER NOT NULL,
        PRIMARY KEY (key_hash, window_start)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS career_accounts (
        username VARCHAR(40) PRIMARY KEY,
        email VARCHAR(254) NOT NULL UNIQUE,
        terms_version VARCHAR(40),
        terms_accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      ALTER TABLE career_accounts
      ADD COLUMN IF NOT EXISTS terms_version VARCHAR(40),
      ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS career_magic_links (
        token_hash CHAR(64) PRIMARY KEY,
        email VARCHAR(254) NOT NULL,
        requested_username VARCHAR(40) NOT NULL,
        terms_version VARCHAR(40) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL
      )
    `);
    await pool.query(`
      ALTER TABLE career_magic_links
      ADD COLUMN IF NOT EXISTS terms_version VARCHAR(40)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS career_magic_links_expiry_idx
        ON career_magic_links (expires_at)
    `);
  })();

  try {
    await schemaPromise;
  } catch (error) {
    schemaPromise = null;
    throw error;
  }
}

function normalizeCareerProfile(row) {
  if (!row) return null;
  return {
    username: row.username,
    generalElo: Number(row.generalElo ?? row.general_elo),
    generalEloHistory: row.generalEloHistory ?? row.general_elo_history ?? [],
    country: row.country || null,
    ageGroup: row.ageGroup ?? row.age_group ?? null,
    university: row.university || null,
    company: row.company || null,
    careerLevel: row.careerLevel ?? row.career_level ?? null,
    prestigeTitles: row.prestigeTitles ?? row.prestige_titles ?? [],
    metrics: row.metrics || {},
    publicationConsentAt: row.publicationConsentAt ?? row.publication_consent_at ?? null,
    updatedAt: row.updatedAt ?? row.updated_at
  };
}

export async function saveCareerProfile(profile) {
  const normalized = {
    username: profile.username || 'student',
    generalElo: Number(profile.generalElo),
    generalEloHistory: profile.generalEloHistory || [],
    country: profile.country || null,
    ageGroup: profile.ageGroup || null,
    university: profile.university || null,
    company: profile.company || null,
    careerLevel: profile.careerLevel || null,
    prestigeTitles: profile.prestigeTitles || [],
    metrics: profile.metrics || {},
    publicationConsentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!pool) {
    memoryCareerProfiles.set(normalized.username.toLowerCase(), normalized);
    return normalized;
  }

  await ensureTables();
  const result = await pool.query(`
    INSERT INTO career_profiles (
      username, general_elo, general_elo_history, country, age_group, university,
      company, career_level, prestige_titles, metrics, publication_consent_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
    ON CONFLICT (username) DO UPDATE SET
      general_elo = EXCLUDED.general_elo,
      general_elo_history = EXCLUDED.general_elo_history,
      country = EXCLUDED.country,
      age_group = EXCLUDED.age_group,
      university = EXCLUDED.university,
      company = EXCLUDED.company,
      career_level = EXCLUDED.career_level,
      prestige_titles = EXCLUDED.prestige_titles,
      metrics = EXCLUDED.metrics,
      publication_consent_at = EXCLUDED.publication_consent_at,
      updated_at = NOW()
    RETURNING *
  `, [
    normalized.username,
    normalized.generalElo,
    JSON.stringify(normalized.generalEloHistory),
    normalized.country,
    normalized.ageGroup,
    normalized.university,
    normalized.company,
    normalized.careerLevel,
    JSON.stringify(normalized.prestigeTitles),
    JSON.stringify(normalized.metrics),
    normalized.publicationConsentAt
  ]);

  return normalizeCareerProfile(result.rows[0]);
}

export async function getCareerProfile(username) {
  const normalizedUsername = String(username || 'student').trim().toLowerCase();
  if (!pool) {
    if (!memoryAccountsByUsername.has(normalizedUsername)) return null;
    return memoryCareerProfiles.get(normalizedUsername) || null;
  }

  await ensureTables();
  const result = await pool.query(
    `SELECT profile.* FROM career_profiles profile
      INNER JOIN career_accounts account ON LOWER(account.username) = LOWER(profile.username)
      WHERE LOWER(profile.username) = $1`,
    [normalizedUsername]
  );
  return normalizeCareerProfile(result.rows[0]);
}

export async function getCareerProfiles() {
  if (!pool) {
    return [...memoryCareerProfiles.entries()]
      .filter(([username]) => memoryAccountsByUsername.has(username))
      .map(([, profile]) => profile);
  }

  await ensureTables();
  const result = await pool.query(`
    SELECT profile.* FROM career_profiles profile
    INNER JOIN career_accounts account ON LOWER(account.username) = LOWER(profile.username)
    ORDER BY profile.general_elo DESC, profile.updated_at ASC
  `);
  return result.rows.map(normalizeCareerProfile);
}

export async function getCareerAccountByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!pool) return memoryAccountsByEmail.get(normalizedEmail) || null;

  await ensureTables();
  const result = await pool.query(
    'SELECT username, email FROM career_accounts WHERE email = $1',
    [normalizedEmail]
  );
  return result.rows[0] || null;
}

export async function saveCareerMagicLink({ tokenHash, email, username, termsVersion, expiresAt }) {
  const record = {
    tokenHash,
    email: String(email || '').trim().toLowerCase(),
    username: String(username || '').trim(),
    termsVersion,
    expiresAt: new Date(expiresAt).toISOString()
  };
  if (!pool) {
    memoryMagicLinks.set(record.tokenHash, record);
    return;
  }

  await ensureTables();
  await pool.query(`
    INSERT INTO career_magic_links (token_hash, email, requested_username, terms_version, expires_at)
    VALUES ($1, $2, $3, $4, $5)
  `, [record.tokenHash, record.email, record.username, record.termsVersion, record.expiresAt]);
}

export async function consumeCareerMagicLink(tokenHash) {
  if (!pool) {
    const magicLink = memoryMagicLinks.get(tokenHash);
    if (!magicLink || new Date(magicLink.expiresAt).getTime() <= Date.now()) {
      memoryMagicLinks.delete(tokenHash);
      return null;
    }
    memoryMagicLinks.delete(tokenHash);
    const existingAccount = memoryAccountsByEmail.get(magicLink.email);
    if (existingAccount) {
      existingAccount.termsVersion = magicLink.termsVersion;
      existingAccount.termsAcceptedAt = new Date().toISOString();
      return existingAccount;
    }
    const usernameKey = magicLink.username.toLowerCase();
    if (memoryAccountsByUsername.has(usernameKey) || memoryCareerProfiles.has(usernameKey)) return null;
    const account = {
      username: magicLink.username,
      email: magicLink.email,
      termsVersion: magicLink.termsVersion,
      termsAcceptedAt: new Date().toISOString()
    };
    memoryAccountsByEmail.set(account.email, account);
    memoryAccountsByUsername.set(usernameKey, account);
    return account;
  }

  await ensureTables();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const linkResult = await client.query(`
      SELECT email, requested_username, terms_version
      FROM career_magic_links
      WHERE token_hash = $1 AND expires_at > NOW()
      FOR UPDATE
    `, [tokenHash]);
    const link = linkResult.rows[0];
    if (!link) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [link.email]);
    const accountResult = await client.query(
      'SELECT username, email FROM career_accounts WHERE email = $1 FOR UPDATE',
      [link.email]
    );
    if (accountResult.rows[0]) {
      await client.query(
        'UPDATE career_accounts SET terms_version = $2, terms_accepted_at = NOW() WHERE email = $1',
        [link.email, link.terms_version]
      );
      await client.query('DELETE FROM career_magic_links WHERE token_hash = $1', [tokenHash]);
      await client.query('COMMIT');
      return { ...accountResult.rows[0], termsVersion: link.terms_version };
    }

    const legacyProfile = await client.query(
      'SELECT 1 FROM career_profiles WHERE LOWER(username) = LOWER($1)',
      [link.requested_username]
    );
    if (legacyProfile.rowCount) {
      await client.query('ROLLBACK');
      return null;
    }

    const insertResult = await client.query(`
      INSERT INTO career_accounts (username, email, terms_version, terms_accepted_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT DO NOTHING
      RETURNING username, email
    `, [link.requested_username, link.email, link.terms_version]);
    if (!insertResult.rows[0]) {
      await client.query('ROLLBACK');
      return null;
    }
    await client.query('DELETE FROM career_magic_links WHERE token_hash = $1', [tokenHash]);
    await client.query('COMMIT');
    return { ...insertResult.rows[0], termsVersion: link.terms_version };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteCareerAccountAndProfile(username) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  if (!pool) {
    const account = memoryAccountsByUsername.get(normalizedUsername);
    if (!account) return false;
    memoryAccountsByUsername.delete(normalizedUsername);
    memoryAccountsByEmail.delete(account.email);
    memoryCareerProfiles.delete(normalizedUsername);
    return true;
  }

  await ensureTables();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const emailResult = await client.query(
      'SELECT email FROM career_accounts WHERE LOWER(username) = $1 FOR UPDATE',
      [normalizedUsername]
    );
    const accountResult = await client.query(
      'DELETE FROM career_accounts WHERE LOWER(username) = $1 RETURNING username',
      [normalizedUsername]
    );
    await client.query(
      'DELETE FROM career_profiles WHERE LOWER(username) = $1',
      [normalizedUsername]
    );
    if (emailResult.rows[0]) {
      await client.query(
        'DELETE FROM career_magic_links WHERE email = $1',
        [emailResult.rows[0].email]
      );
    }
    await client.query('COMMIT');
    return accountResult.rowCount > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteCareerProfile(username) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  if (!pool) return memoryCareerProfiles.delete(normalizedUsername);

  await ensureTables();
  const result = await pool.query(
    'DELETE FROM career_profiles WHERE LOWER(username) = $1',
    [normalizedUsername]
  );
  return result.rowCount > 0;
}

export async function saveApplicationBenchmark(role, score, termsVersion) {
  const normalized = {
    role: String(role || '').trim(),
    score: Number(score),
    termsVersion,
    createdAt: new Date().toISOString()
  };
  if (!normalized.role || !Number.isFinite(normalized.score) || normalized.score < 0 || normalized.score > 100) {
    throw new Error('Invalid application benchmark.');
  }

  if (!pool) {
    memoryApplicationBenchmarks.push(normalized);
    return normalized;
  }

  await ensureTables();
  const result = await pool.query(`
    INSERT INTO application_benchmarks (role, score, terms_version)
    VALUES ($1, $2, $3)
    RETURNING role, score, terms_version AS "termsVersion", created_at AS "createdAt"
  `, [normalized.role, normalized.score, normalized.termsVersion]);
  return result.rows[0];
}

export async function getApplicationBenchmarks(role) {
  await cleanupExpiredApplicationBenchmarks();
  await cleanupExpiredApplicationRateLimits();
  if (!pool) {
    return memoryApplicationBenchmarks.filter((entry) => !role || entry.role === role);
  }

  await ensureTables();
  const result = role
    ? await pool.query('SELECT role, score, created_at AS "createdAt" FROM application_benchmarks WHERE role = $1', [role])
    : await pool.query('SELECT role, score, created_at AS "createdAt" FROM application_benchmarks');
  return result.rows;
}

export async function cleanupExpiredApplicationBenchmarks() {
  if (!pool) {
    const retainedAfter = Date.now() - 365 * 24 * 60 * 60 * 1000;
    let removed = 0;
    for (let index = memoryApplicationBenchmarks.length - 1; index >= 0; index -= 1) {
      if (new Date(memoryApplicationBenchmarks[index].createdAt).getTime() < retainedAfter) {
        memoryApplicationBenchmarks.splice(index, 1);
        removed += 1;
      }
    }
    return removed;
  }

  await ensureTables();
  const result = await pool.query("DELETE FROM application_benchmarks WHERE created_at < NOW() - INTERVAL '12 months'");
  return result.rowCount || 0;
}

export async function consumeApplicationRateLimit(keyHash, maxRequests, windowMs) {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const windowEnd = windowStart + windowMs;

  if (!pool) {
    const key = `${keyHash}:${windowStart}`;
    const requestCount = (memoryApplicationRateLimits.get(key) || 0) + 1;
    memoryApplicationRateLimits.set(key, requestCount);
    for (const [entryKey] of memoryApplicationRateLimits) {
      const entryWindow = Number(entryKey.slice(entryKey.lastIndexOf(':') + 1));
      if (entryWindow < windowStart - windowMs) memoryApplicationRateLimits.delete(entryKey);
    }
    return {
      allowed: requestCount <= maxRequests,
      remaining: Math.max(0, maxRequests - requestCount),
      retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - now) / 1000))
    };
  }

  await ensureTables();
  const result = await pool.query(`
    INSERT INTO application_rate_limits (key_hash, window_start, request_count)
    VALUES ($1, $2, 1)
    ON CONFLICT (key_hash, window_start)
    DO UPDATE SET request_count = application_rate_limits.request_count + 1
    RETURNING request_count
  `, [keyHash, new Date(windowStart).toISOString()]);
  const requestCount = Number(result.rows[0].request_count);
  return {
    allowed: requestCount <= maxRequests,
    remaining: Math.max(0, maxRequests - requestCount),
    retryAfterSeconds: Math.max(1, Math.ceil((windowEnd - now) / 1000))
  };
}

export async function cleanupExpiredApplicationRateLimits() {
  if (!pool) {
    const retainAfter = Date.now() - 48 * 60 * 60 * 1000;
    for (const [key] of memoryApplicationRateLimits) {
      const windowStart = Number(key.slice(key.lastIndexOf(':') + 1));
      if (windowStart < retainAfter) memoryApplicationRateLimits.delete(key);
    }
    for (const [tokenHash, link] of memoryMagicLinks) {
      if (new Date(link.expiresAt).getTime() < Date.now()) memoryMagicLinks.delete(tokenHash);
    }
    return;
  }

  await ensureTables();
  await pool.query("DELETE FROM application_rate_limits WHERE window_start < NOW() - INTERVAL '48 hours'");
  await pool.query('DELETE FROM career_magic_links WHERE expires_at < NOW()');
}
