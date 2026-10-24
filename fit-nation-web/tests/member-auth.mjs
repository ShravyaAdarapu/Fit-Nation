import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync, readdirSync} from 'node:fs';
import {createMemberAuth} from '../lib/member-auth.ts';
import {sendLoginEmail, loginEmailText} from '../lib/sendpulse.ts';

function harness({deliveryFails = false, enabled = true} = {}) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(file => file.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(new URL(`../drizzle/${file}`, import.meta.url), 'utf8'));
  }
  const db = {
    prepare(sql) {
      const statement = (values = []) => ({
        bind: (...args) => statement(args),
        first: async () => sqlite.prepare(sql).get(...values) || null,
        run: async () => ({meta: {changes: Number(sqlite.prepare(sql).run(...values).changes)}}),
        execute: () => sqlite.prepare(sql).run(...values),
      });
      return statement();
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {const results = statements.map(statement => statement.execute()); sqlite.exec('COMMIT'); return results;}
      catch (error) {sqlite.exec('ROLLBACK'); throw error;}
    },
  };
  let now = Date.UTC(2026, 9, 24, 12, 5);
  const sent = [];
  const config = {db, enabled, secret: 'test-only-secret-never-use-in-production-123456789', now: () => now,
    sendCode: async (email, code) => {if (deliveryFails) throw new Error('private-provider-error'); sent.push({email, code});}};
  return {auth: createMemberAuth(config), recreate: () => createMemberAuth(config), db, sqlite, sent, advance: milliseconds => {now += milliseconds;}};
}
function request(path, body, {cookies = '', origin = 'https://gym.test', ip = '192.0.2.1'} = {}) {
  return new Request(`https://gym.test/api/auth/${path}`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: origin, Cookie: cookies, 'CF-Connecting-IP': ip}, body: JSON.stringify(body)});
}
function cookieOf(response, name) {
  return response.headers.getSetCookie().find(value => value.startsWith(`__Host-${name}=`))?.split(';')[0] || '';
}
async function challenge(h, email = 'test@example.com', options) {
  const response = await h.auth.requestCode(request('request-code', {email}, options));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(Object.keys(result).sort(), ['challengeId', 'expiresIn', 'resendAfter']);
  return {id: result.challengeId, cookies: cookieOf(response, 'fn_login_challenge'), code: h.sent.at(-1).code, response};
}
function verify(h, code, value = code.code, cookies = code.cookies) {
  return h.auth.verifyCode(request('verify-code', {challengeId: code.id, code: value}, {cookies}));
}

test('unconfigured delivery stays unavailable and creates no account', async () => {
  const h = harness({enabled: false});
  const session = await h.auth.session(new Request('https://gym.test/api/auth/session'));
  assert.deepEqual(await session.json(), {available: false, user: null});
  assert.equal((await h.auth.requestCode(request('request-code', {email: 'test@example.com'}))).status, 503);
  assert.equal(h.sent.length, 0);
  assert.equal(h.sqlite.prepare('SELECT count(*) AS n FROM members').get().n, 0);
});
test('request validation, same-origin guard and bounded body', async () => {
  const h = harness();
  assert.equal((await h.auth.requestCode(request('request-code', {email: 'bad'}))).status, 400);
  assert.equal((await h.auth.requestCode(request('request-code', {email: 'test@example.com'}, {origin: 'https://other.test'}))).status, 403);
  assert.equal((await h.auth.requestCode(request('request-code', {email: 'a'.repeat(3000)}))).status, 413);
  assert.equal((await h.auth.requestCode(new Request('https://gym.test/api/auth/request-code', {method: 'POST', headers: {Origin: 'https://gym.test', 'Content-Type': 'application/json'}, body: '{broken'}))).status, 400);
  assert.equal(h.sent.length, 0);
});
test('random code, hashed storage, browser binding, durable session and logout', async () => {
  const h = harness();
  const code = await challenge(h, ' Test@Example.com ');
  assert.equal(h.sent[0].email, 'test@example.com');
  assert.match(code.code, /^\d{6}$/);
  const row = h.sqlite.prepare('SELECT * FROM auth_challenges').get();
  assert.notEqual(row.code_hash, code.code);
  assert.equal(row.code_hash.length, 64);
  assert.match(code.response.headers.get('set-cookie'), /HttpOnly; SameSite=Lax; Max-Age=600; Secure/);
  assert.equal((await verify(h, code, code.code, `__Host-fn_login_challenge=${'0'.repeat(64)}`)).status, 400);
  const response = await verify(h, code);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {user: {email: 'test@example.com'}});
  const cookies = cookieOf(response, 'fn_member_session');
  assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Lax; Max-Age=604800; Secure/);
  assert.equal((await verify(h, code)).status, 400, 'successful codes cannot be replayed');
  const session = await h.recreate().session(new Request('https://gym.test/api/auth/session', {headers: {Cookie: cookies}}));
  assert.deepEqual(await session.json(), {available: true, user: {email: 'test@example.com'}});
  const logout = await h.auth.logout(request('logout', {}, {cookies}));
  assert.equal(logout.status, 200);
  assert.equal(h.sqlite.prepare('SELECT count(*) AS n FROM member_sessions').get().n, 0);
  const signedOut = await h.auth.session(new Request('https://gym.test/api/auth/session', {headers: {Cookie: cookies}}));
  assert.equal((await signedOut.json()).user, null);
});
test('five wrong codes exhaust a challenge', async () => {
  const h = harness(); const code = await challenge(h);
  const wrong = String((Number(code.code) + 1) % 1_000_000).padStart(6, '0');
  for (let i = 0; i < 5; i++) assert.equal((await verify(h, code, wrong)).status, 400);
  assert.equal((await verify(h, code)).status, 400);
  assert.equal(h.sqlite.prepare('SELECT attempts FROM auth_challenges').get().attempts, 5);
});
test('codes expire and simultaneous verification succeeds only once', async () => {
  const expired = harness(); const old = await challenge(expired); expired.advance(600_001);
  assert.equal((await verify(expired, old)).status, 400);
  const h = harness(); const code = await challenge(h);
  const responses = await Promise.all([verify(h, code), verify(h, code)]);
  assert.deepEqual(responses.map(response => response.status).sort(), [200, 400]);
  assert.equal(h.sqlite.prepare('SELECT count(*) AS n FROM member_sessions').get().n, 1);
});
test('resend cooldown and new code invalidate old codes', async () => {
  const h = harness(); const first = await challenge(h);
  const tooSoon = await h.auth.requestCode(request('request-code', {email: 'test@example.com'}));
  assert.equal(tooSoon.status, 429); assert.equal(tooSoon.headers.get('retry-after'), '60');
  h.advance(61_000); const second = await challenge(h);
  assert.notEqual(first.id, second.id);
  assert.equal((await verify(h, first)).status, 400);
  assert.equal((await verify(h, second)).status, 200);
});
test('delivery failure issues no cookie or usable challenge', async () => {
  const h = harness({deliveryFails: true});
  const response = await h.auth.requestCode(request('request-code', {email: 'test@example.com'}));
  assert.equal(response.status, 503);
  assert.equal(response.headers.has('set-cookie'), false);
  assert.equal(JSON.stringify(await response.json()).includes('private-provider-error'), false);
  assert.equal(h.sqlite.prepare('SELECT count(*) AS n FROM auth_challenges').get().n, 0);
});
test('application email budget blocks excess sends', async () => {
  const h = harness();
  for (let i = 0; i < 10; i++) await challenge(h, `person${i}@example.com`, {ip: `192.0.2.${i + 1}`});
  const response = await h.auth.requestCode(request('request-code', {email: 'over@example.com'}, {ip: '192.0.2.50'}));
  assert.equal(response.status, 429); assert.equal(h.sent.length, 10);
  h.advance(900_000);
  h.sqlite.prepare('UPDATE auth_rate_limits SET count = 10000 WHERE expires_at = ?').run(Date.UTC(2026, 10, 1));
  assert.equal((await h.auth.requestCode(request('request-code', {email: 'monthly@example.com'}, {ip: '192.0.2.51'}))).status, 429);
  assert.equal(h.sent.length, 10);
});
test('recipient and IP limits apply independently', async () => {
  const recipient = harness();
  for (let i = 0; i < 3; i++) {await challenge(recipient); recipient.advance(61_000);}
  assert.equal((await recipient.auth.requestCode(request('request-code', {email: 'test@example.com'}))).status, 429);
  assert.equal(recipient.sent.length, 3);
  const ip = harness();
  for (let i = 0; i < 5; i++) await challenge(ip, `ip${i}@example.com`);
  assert.equal((await ip.auth.requestCode(request('request-code', {email: 'sixth@example.com'}))).status, 429);
  assert.equal(ip.sent.length, 5);
});
test('session expiry, forged cookies and unrelated staff headers grant no login', async () => {
  const h = harness(); const code = await challenge(h); const response = await verify(h, code);
  const cookie = cookieOf(response, 'fn_member_session');
  h.advance(7 * 24 * 60 * 60_000 + 1);
  for (const headers of [{Cookie: cookie}, {Cookie: `__Host-fn_member_session=${'f'.repeat(64)}`}, {'oai-authenticated-user-email': 'staff@example.com', 'oai-authenticated-user-id': 'fake'}]) {
    const session = await h.auth.session(new Request('https://gym.test/api/auth/session', {headers}));
    assert.equal((await session.json()).user, null);
  }
});
test('SendPulse adapter requires provider acceptance and keeps API key server-side', async () => {
  let calls = 0;
  await sendLoginEmail({apiKey: 'test-api-key', fromEmail: 'login@gym.test'}, 'member@example.com', '234567', async (url, options) => {
    calls++; assert.equal(url, 'https://api.sendpulse.com/smtp/emails');
    assert.equal(options.headers.Authorization, 'Bearer test-api-key');
    const payload = JSON.parse(options.body);
    assert.equal(payload.email.to[0].email, 'member@example.com');
    assert.match(payload.email.text, /234567/);
    return Response.json({result: true, id: 'test-message-id'});
  });
  assert.equal(calls, 1);
  await assert.rejects(sendLoginEmail({apiKey: 'test', fromEmail: 'login@gym.test'}, 'member@example.com', '234567', async () => Response.json({result: false})), /unavailable/);
});

test('code and welcome guide use one email with links for the current website origin', async () => {
  const text = loginEmailText('234567', 'https://fit-nation.hyderabad.workers.dev/');
  assert.match(text, /234567/);
  assert.match(text, /WELCOME TO YOUR NATION/);
  for (const branch of ['kothapet', 'hayathnagar', 'moosarambagh', 'nagole']) {
    assert.ok(text.includes(`https://fit-nation.hyderabad.workers.dev/branches/${branch}`));
  }
  assert.ok(text.includes('awaiting confirmation'));
  assert.ok(text.includes('not a marketing subscription'));
  assert.throws(() => loginEmailText('234567', 'javascript:alert(1)'), /Invalid website origin/);
  let sends = 0;
  await sendLoginEmail({apiKey: 'test', fromEmail: 'login@gym.test', siteOrigin: 'https://gym.test'}, 'member@example.com', '234567', async (_, options) => {
    sends++;
    const payload = JSON.parse(options.body);
    assert.ok(payload.email.text.includes('https://gym.test/#locations'));
    return Response.json({result: true, id: 'test-message-id'});
  });
  assert.equal(sends, 1);
});
