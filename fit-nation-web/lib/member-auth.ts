import {z} from 'zod';

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const requestSchema = z.object({email: emailSchema}).strict();
const verifySchema = z.object({challengeId: z.string().uuid(), code: z.string().regex(/^\d{6}$/)}).strict();
const CODE_LIFETIME = 10 * 60_000;
const SESSION_LIFETIME = 7 * 24 * 60 * 60_000;
const SESSION_COOKIE = 'fn_member_session';
const CHALLENGE_COOKIE = 'fn_login_challenge';
const encoder = new TextEncoder();

type Config = {
  db?: D1Database;
  secret?: string;
  enabled: boolean;
  sendCode?: (email: string, code: string, siteOrigin: string) => Promise<void>;
  now?: () => number;
};
type Challenge = {id: string; email: string; code_hash: string; browser_hash: string; expires_at: number; attempts: number; used_at: number | null};

class AuthError extends Error {
  status: number;
  retryAfter?: number;
  constructor(message: string, status = 400, retryAfter?: number) {super(message); this.status = status; this.retryAfter = retryAfter;}
}
function json(value: unknown, status = 200, retryAfter?: number) {
  const headers = new Headers({'Cache-Control': 'no-store', 'Pragma': 'no-cache'});
  if (retryAfter) headers.set('Retry-After', String(retryAfter));
  return Response.json(value, {status, headers});
}
function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
}
function randomCode() {
  const values = new Uint32Array(1);
  do {crypto.getRandomValues(values);} while (values[0] >= 4_294_000_000);
  return String(values[0] % 1_000_000).padStart(6, '0');
}
async function hash(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function keyedHash(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
}
function equalHash(a: string, b: string) {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}
function cookieName(request: Request, name: string) {return new URL(request.url).protocol === 'https:' ? `__Host-${name}` : name;}
function cookie(request: Request, name: string) {
  name = cookieName(request, name);
  const value = request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
function setCookie(response: Response, request: Request, name: string, value: string, maxAge: number) {
  name = cookieName(request, name);
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  response.headers.append('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`);
}
function guardPost(request: Request) {
  const url = new URL(request.url);
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !loopback) || request.headers.get('origin') !== url.origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    throw new AuthError('Please sign in from this website.', 403);
  }
}
async function readJson(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new AuthError('Invalid request.', 415);
  if (!request.body) throw new AuthError('Invalid request.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 2048) {await reader.cancel(); throw new AuthError('Request is too large.', 413);}
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let position = 0;
  for (const chunk of chunks) {bytes.set(chunk, position); position += chunk.byteLength;}
  try {return JSON.parse(new TextDecoder().decode(bytes));} catch {throw new AuthError('Invalid request.');}
}

export function createMemberAuth(config: Config) {
  const clock = config.now || Date.now;
  const available = !!(config.enabled && config.db && config.sendCode && config.secret && config.secret.length >= 32);
  const requireReady = () => {
    if (!available) throw new AuthError('Email login is being set up. Please try again later.', 503);
    return {db: config.db!, secret: config.secret!};
  };
  const safe = (action: () => Promise<Response>) => action().catch(error => error instanceof AuthError
    ? json({error: error.message}, error.status, error.retryAfter)
    : json({error: 'Sign-in is temporarily unavailable. Please try again later.'}, 503));

  async function rate(db: D1Database, secret: string, key: string, limit: number, expiresAt: number) {
    const id = await keyedHash(secret, `rate:${key}`);
    const row = await db.prepare(`INSERT INTO auth_rate_limits (id, count, expires_at) VALUES (?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`).bind(id, expiresAt, limit).first();
    if (!row) throw new AuthError('Too many requests. Please wait before trying again.', 429, Math.max(1, Math.ceil((expiresAt - clock()) / 1000)));
  }
  async function cooldown(db: D1Database, secret: string, email: string, now: number) {
    const id = await keyedHash(secret, `cooldown:${email}`);
    const row = await db.prepare(`INSERT INTO auth_rate_limits (id, count, expires_at) VALUES (?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET count = 1, expires_at = excluded.expires_at WHERE auth_rate_limits.expires_at <= ? RETURNING count`)
      .bind(id, now + 60_000, now).first();
    if (!row) throw new AuthError('Please wait a minute before requesting another code.', 429, 60);
  }
  async function cleanup(db: D1Database, now: number) {
    await db.batch([
      db.prepare('DELETE FROM auth_challenges WHERE id IN (SELECT id FROM auth_challenges WHERE expires_at < ? LIMIT 100)').bind(now - 24 * 60 * 60_000),
      db.prepare('DELETE FROM member_sessions WHERE token_hash IN (SELECT token_hash FROM member_sessions WHERE expires_at < ? LIMIT 100)').bind(now),
      db.prepare('DELETE FROM auth_rate_limits WHERE id IN (SELECT id FROM auth_rate_limits WHERE expires_at < ? LIMIT 100)').bind(now),
    ]);
  }

  return {
    requestCode(request: Request) {
      return safe(async () => {
        guardPost(request);
        const {db, secret} = requireReady();
        const body = requestSchema.safeParse(await readJson(request));
        if (!body.success) throw new AuthError('Enter a valid email address.');
        const {email} = body.data;
        const now = clock();
        const ip = request.headers.get('cf-connecting-ip') || 'unknown';
        const tenMinutes = Math.floor(now / 600_000);
        const hour = Math.floor(now / 3_600_000);
        await rate(db, secret, `send-ip:${ip}:${tenMinutes}`, 5, (tenMinutes + 1) * 600_000);
        await cooldown(db, secret, email, now);
        await rate(db, secret, `send-email:${email}:${hour}`, 3, (hour + 1) * 3_600_000);
        // Conservative application caps preserve room below SendPulse's free limits.
        const quarterHour = Math.floor(now / 900_000);
        await rate(db, secret, `send-global-quarter:${quarterHour}`, 10, (quarterHour + 1) * 900_000);
        await rate(db, secret, `send-global-hour:${hour}`, 40, (hour + 1) * 3_600_000);
        const month = new Date(now).toISOString().slice(0, 7);
        const nextMonth = new Date(now); nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1, 1); nextMonth.setUTCHours(0, 0, 0, 0);
        await rate(db, secret, `send-global-month:${month}`, 10_000, nextMonth.getTime());
        const id = crypto.randomUUID();
        const code = randomCode();
        const browserToken = randomToken();
        const emailHash = await keyedHash(secret, `email:${email}`);
        const codeHash = await keyedHash(secret, `code:${id}:${email}:${code}`);
        await db.batch([
          db.prepare('UPDATE auth_challenges SET used_at = ? WHERE email_hash = ? AND used_at IS NULL').bind(now, emailHash),
          db.prepare('INSERT INTO auth_challenges (id, email, email_hash, code_hash, browser_hash, created_at, expires_at, attempts) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
            .bind(id, email, emailHash, codeHash, await hash(browserToken), now, now + CODE_LIFETIME),
        ]);
        try {await config.sendCode!(email, code, new URL(request.url).origin);} catch {
          await db.prepare('DELETE FROM auth_challenges WHERE id = ?').bind(id).run();
          throw new AuthError('We couldn’t send your code. Please try again shortly.', 503);
        }
        await cleanup(db, now);
        const response = json({challengeId: id, expiresIn: CODE_LIFETIME / 1000, resendAfter: 60});
        setCookie(response, request, CHALLENGE_COOKIE, browserToken, CODE_LIFETIME / 1000);
        return response;
      });
    },
    verifyCode(request: Request) {
      return safe(async () => {
        guardPost(request);
        const {db, secret} = requireReady();
        const body = verifySchema.safeParse(await readJson(request));
        if (!body.success) throw new AuthError('Enter the six-digit code from your email.');
        const browserToken = cookie(request, CHALLENGE_COOKIE);
        if (!browserToken) throw new AuthError('Please request a new code in this browser.');
        const now = clock();
        const minute = Math.floor(now / 60_000);
        await rate(db, secret, `verify-ip:${request.headers.get('cf-connecting-ip') || 'unknown'}:${minute}`, 15, (minute + 1) * 60_000);
        const row = await db.prepare('SELECT * FROM auth_challenges WHERE id = ?').bind(body.data.challengeId).first<Challenge>();
        const invalid = () => new AuthError('This code is invalid or has expired. Please request a new one.');
        const browserHash = await hash(browserToken);
        if (!row || row.used_at !== null || row.expires_at <= now || row.attempts >= 5 || !equalHash(row.browser_hash, browserHash)) throw invalid();
        const codeHash = await keyedHash(secret, `code:${row.id}:${row.email}:${body.data.code}`);
        if (!equalHash(row.code_hash, codeHash)) {
          await db.prepare('UPDATE auth_challenges SET attempts = attempts + 1 WHERE id = ? AND used_at IS NULL AND attempts < 5').bind(row.id).run();
          throw invalid();
        }
        // A conditional update makes simultaneous verification and replay single-use.
        const consumed = await db.prepare(`UPDATE auth_challenges SET used_at = ? WHERE id = ? AND code_hash = ? AND browser_hash = ?
          AND expires_at > ? AND attempts < 5 AND used_at IS NULL RETURNING email`).bind(now, row.id, codeHash, browserHash, now).first<{email: string}>();
        if (!consumed) throw invalid();
        const sessionToken = randomToken();
        await db.batch([
          db.prepare('INSERT INTO members (id, email, created_at) VALUES (?, ?, ?) ON CONFLICT(email) DO NOTHING').bind(crypto.randomUUID(), consumed.email, now),
          db.prepare('INSERT INTO member_sessions (token_hash, member_id, created_at, expires_at) SELECT ?, id, ?, ? FROM members WHERE email = ?')
            .bind(await hash(sessionToken), now, now + SESSION_LIFETIME, consumed.email),
        ]);
        const response = json({user: {email: consumed.email}});
        setCookie(response, request, SESSION_COOKIE, sessionToken, SESSION_LIFETIME / 1000);
        setCookie(response, request, CHALLENGE_COOKIE, '', 0);
        return response;
      });
    },
    session(request: Request) {
      return safe(async () => {
        const token = cookie(request, SESSION_COOKIE);
        if (!token || !config.db) return json({available, user: null});
        const user = await config.db.prepare(`SELECT members.email FROM member_sessions JOIN members ON members.id = member_sessions.member_id
          WHERE member_sessions.token_hash = ? AND member_sessions.expires_at > ?`).bind(await hash(token), clock()).first<{email: string}>();
        const response = json({available, user: user ? {email: user.email} : null});
        if (!user) setCookie(response, request, SESSION_COOKIE, '', 0);
        return response;
      });
    },
    logout(request: Request) {
      return safe(async () => {
        guardPost(request);
        const token = cookie(request, SESSION_COOKIE);
        if (token && config.db) await config.db.prepare('DELETE FROM member_sessions WHERE token_hash = ?').bind(await hash(token)).run();
        const response = json({ok: true});
        setCookie(response, request, SESSION_COOKIE, '', 0);
        setCookie(response, request, CHALLENGE_COOKIE, '', 0);
        return response;
      });
    },
  };
}
