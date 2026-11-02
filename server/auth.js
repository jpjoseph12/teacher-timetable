import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const COOKIE = 'tt_session';
const SESSION_DAYS = 30;
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

export function createAuth({ password, secret, dataDir }) {
  if (!password) throw new Error('APP_PASSWORD must be set');
  const key = secret || loadOrCreateSecret(dataDir);
  const passwordHash = sha256(password);
  const attempts = new Map();

  const sign = (payload) => crypto.createHmac('sha256', key).update(payload).digest('base64url');

  function issue(res, req) {
    const exp = Date.now() + SESSION_DAYS * 864e5;
    const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
    res.cookie(COOKIE, `${payload}.${sign(payload)}`, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      maxAge: SESSION_DAYS * 864e5,
      path: '/',
    });
  }

  function valid(req) {
    const raw = parseCookies(req.headers.cookie)[COOKIE];
    if (!raw) return false;
    const [payload, sig] = raw.split('.');
    if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
    try {
      return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
    } catch {
      return false;
    }
  }

  function limited(ip) {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || entry.reset < now) {
      attempts.set(ip, { count: 1, reset: now + WINDOW_MS });
      return false;
    }
    entry.count += 1;
    return entry.count > MAX_ATTEMPTS;
  }

  return {
    login(req, res) {
      if (limited(req.ip)) return res.status(429).json({ error: 'Too many attempts. Wait 15 minutes and try again.' });
      const given = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!crypto.timingSafeEqual(sha256(given), passwordHash)) {
        return res.status(401).json({ error: "That password isn't right." });
      }
      attempts.delete(req.ip);
      issue(res, req);
      res.json({ ok: true });
    },
    logout(req, res) {
      res.clearCookie(COOKIE, { path: '/' });
      res.json({ ok: true });
    },
    require(req, res, next) {
      if (valid(req)) return next();
      res.status(401).json({ error: 'Sign in to continue.' });
    },
  };
}

// The home-screen widget can't sign in, so it reads a notes-free feed with a
// long random key in its URL. Making a new key revokes the old one.
export function createWidgetKey(dataDir) {
  const file = path.join(dataDir, 'widget-key');
  let key = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim() : null;
  const rotate = () => {
    key = crypto.randomBytes(24).toString('base64url');
    fs.writeFileSync(file, key, { mode: 0o600 });
    return key;
  };
  return {
    get: () => key || rotate(),
    rotate,
    matches: (given) => Boolean(key) && typeof given === 'string' && safeEqual(given, key),
  };
}

function loadOrCreateSecret(dataDir) {
  const file = path.join(dataDir, 'session-secret');
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(file, secret, { mode: 0o600 });
  return secret;
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest();

function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header.split(';').map((p) => p.trim().split('=')).filter(([k, v]) => k && v).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]),
  );
}
