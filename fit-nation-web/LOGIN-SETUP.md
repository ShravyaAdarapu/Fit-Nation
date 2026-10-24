# Email OTP login (SendPulse)

Email is the only member login method. Phone login, Google placeholders and the universal demo code have been removed. Mobile numbers are still collected separately by the visit enquiry form.

## Current status

The server integration is prepared and defaults to unavailable. No SendPulse account, API key or sender has been configured, and no real emails have been sent. The UI shows setup pending and disables code sending until the server confirms that configuration is present. There is no demo bypass or fixed verification code.

The requested email contains the sign-in code and a welcome/first-visit guide with
links to the four currently identified branch pages. This is one email per code
request, not a separate welcome send, and does not subscribe anyone to marketing.
Links use the current website origin so a later domain change does not require
editing an email template. Branch hours and opening status are not invented.

Once the server reports email sending available, the homepage opens the optional
prompt on the first visit to that browser after a short delay. Skip, close and
Escape leave the visitor free to browse. A local-storage flag remembers the prompt
was shown, without storing an email or phone number. Signed-in visitors, deep
links, explicit branch-booking links and already-open dialogs suppress it. While
provider setup is incomplete, the prompt never opens automatically.

## Owner setup, when ready

1. Create the gym's own SendPulse account and open **SMTP**. New accounts may start on an SMTP Test plan (50 messages total, up to 10/hour, a test sender and development-only subject prefix); other accounts show a profile/application form. SendPulse's current guide requires an authenticated domain you control and a sender address on it to activate the regular free Basic plan (12,000/month, up to 50/hour). A purchased domain is a separate cost: do not buy one just for this integration without the owner's decision. A Gmail address and the site's `workers.dev` hostname cannot be authenticated as a gym-owned sending domain. If no domain is owned, select another free provider before activating production delivery.
2. Generate a dedicated SendPulse API key under the account's API settings. This integration uses the documented static Bearer API key with the SMTP REST endpoint.
3. For the current Cloudflare deployment, use Worker **Settings → Variables and Secrets** (runtime settings, not Build variables). Add `SENDPULSE_API_KEY` as a secret and `SENDPULSE_FROM_EMAIL` as the approved sender address. Sites-hosted previews use Sites runtime environment settings instead. Keep keys out of chat, Git, frontend code and hosting.json.
4. Add `EMAIL_OTP_SECRET` as an independent, cryptographically random secret of at least 32 characters (32 random bytes encoded as hex or Base64 is suitable). Never reuse a sample/test value or the provider key.
5. Confirm the new schema migration has been deployed. Then set `EMAIL_OTP_ENABLED=true`. Leave it absent/false until ready.
6. Test delivery to the owner's email, incorrect/expired codes, resend behavior, a page reload, logout, and the final domain's HTTPS cookies before a public launch. Confirm actual inbox delivery, spam placement and sender authentication. Do not treat provider acceptance as guaranteed delivery.

## Implementation

- Server-generated, unpredictable six-digit codes; 10-minute expiry; HMAC hashes in D1. Codes and provider keys never appear in API responses or logs.
- Each challenge is bound to an HttpOnly browser cookie and allows five incorrect guesses. Resending invalidates previous codes for that email. Successful verification consumes a code atomically, including concurrent verification/replay.
- Verified users receive a new random session token in an HttpOnly, SameSite=Lax cookie. HTTPS cookies use the `__Host-` prefix and Secure attribute. Only a token hash is stored server-side. Sessions expire after seven days; logout revokes the current session.
- A member account does not create a paid gym membership or grant staff access. The existing staff allowlist/authentication remains independent.
- Same-origin POST checks, bounded JSON bodies, persistent atomic rate limits, and bounded cleanup queries are included. Unknown/unconfigured delivery fails closed.

## Sending budgets

Application caps: one request per email per minute, three sends per email per UTC hour, five send attempts per IP per ten-minute bucket, ten application sends per fifteen-minute bucket, forty per UTC hour, and 10,000 per UTC calendar month. Verification has an additional per-IP limit. Failed delivery reservations count conservatively.

These application budgets are not a guarantee of a zero provider bill. Other uses of the same SendPulse account, quota/timezone differences and future pricing changes are outside this application's counters. Stay on the intended free provider plan, verify current limits and monitor its dashboard. Nothing upgrades or purchases provider credits automatically.

Expired challenge records become eligible for cleanup 24 hours after expiry. Expired sessions and expired rate-limit buckets are also cleaned in bounded batches on new code requests. This is request-driven cleanup, not a scheduled maximum-retention guarantee. Confirm account retention and deletion requirements before public launch. Add bot protection and production monitoring as needed for public traffic.

## Verification

Run `node --experimental-strip-types --experimental-sqlite --test tests/member-auth.mjs` with Node 22.13 or newer. Tests use isolated in-memory SQLite and a fake delivery adapter; they send no real emails. Real SendPulse delivery and physical-device testing remain pending owner setup.

Official provider references:
- https://sendpulse.com/knowledge-base/smtp/setup-smtp-server
- https://sendpulse.com/integrations/api
- https://sendpulse.com/integrations/api/smtp
- https://sendpulse.com/pricing/smtp
