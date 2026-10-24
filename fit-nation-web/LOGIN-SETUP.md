# Email sign-in and first-visit email

Email is the only member login method. Phone login, Google placeholders and the universal demo code have been removed. Mobile numbers are still collected separately by the visit enquiry form.

## Current status

The server integration is prepared and defaults to unavailable. No production email provider credentials or sender have been configured by this project, and no real emails have been sent during implementation. Brevo is the recommended setup for the gym's existing Gmail address. SendPulse remains supported for a future authenticated sending domain. The UI shows setup pending and disables code sending until the server confirms that configuration is present. There is no demo bypass or fixed verification code.

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

## Owner setup: Brevo Free with the existing Gmail address

1. Create the gym's own free account at https://www.brevo.com/ and confirm the registration email. Complete the requested business profile honestly and stay on the Free plan. Do not add paid credits or choose an upgrade.
2. Open **Settings → Senders, Domains & Dedicated IPs → Senders** (menu labels can vary). Add sender name **Fit Nation Hyderabad** and the gym's existing Gmail address. Complete the sender verification code/link sent to that mailbox. Transactional sending may also require Brevo account approval.
3. Open **SMTP & API → API Keys**, generate a dedicated API key and copy it directly into the secret setting below. Do not use an SMTP key, paste it into chat or commit it to Git.
4. In Cloudflare → Workers & Pages → **fit-nation → Settings → Variables and Secrets**, add runtime settings:
   - `EMAIL_PROVIDER` = `brevo`
   - `BREVO_API_KEY` = the API key, type **Secret**
   - `BREVO_FROM_EMAIL` = the verified sender Gmail address
   - `EMAIL_OTP_SECRET` = at least 32 cryptographically random bytes encoded as hex/Base64, type **Secret**. Generate it privately; never reuse an example or the API key.
   - `EMAIL_OTP_ENABLED` = `true` only after the other settings are ready.
5. Redeploy, then request one code to the owner's email and check the inbox and spam folder. Verify the code, reload to check the session, sign out, and test an incorrect code. Provider acceptance is not proof of inbox delivery.

Brevo currently includes 300 sends/day on its Free plan. Its documented compatibility
behavior temporarily rewrites unauthenticated/free sender addresses using a compliant
Brevo address. A verified Gmail sender therefore does not require buying a domain
for this initial setup, but the visible From address may differ from Gmail and
emails include Brevo branding. This is provider-controlled behavior, not a permanent
guarantee; confirm approval and actual delivery. A dedicated authenticated domain
can be added later if the gym already owns one.

## Optional alternative: SendPulse

Set `EMAIL_PROVIDER=sendpulse`, `SENDPULSE_API_KEY` (Secret), and
`SENDPULSE_FROM_EMAIL`, plus the same `EMAIL_OTP_SECRET` and `EMAIL_OTP_ENABLED`.
For backward compatibility, an omitted provider selects SendPulse. Unknown provider
names fail closed. Provider keys and sender addresses are never returned to the browser.

SendPulse's current guide requires an authenticated domain you control and a sender
address on it for the regular free SMTP plan (12,000/month, up to 50/hour). New
accounts may instead start on a development Test plan with 50 messages total and a
test sender. A Gmail address or `workers.dev` hostname is not an owned sending
domain. Do not purchase a domain just to enable this alternative.

## Implementation

- Server-generated, unpredictable six-digit codes; 10-minute expiry; HMAC hashes in D1. Codes and provider keys never appear in API responses or logs.
- Each challenge is bound to an HttpOnly browser cookie and allows five incorrect guesses. Resending invalidates previous codes for that email. Successful verification consumes a code atomically, including concurrent verification/replay.
- Verified users receive a new random session token in an HttpOnly, SameSite=Lax cookie. HTTPS cookies use the `__Host-` prefix and Secure attribute. Only a token hash is stored server-side. Sessions expire after seven days; logout revokes the current session.
- A member account does not create a paid gym membership or grant staff access. The existing staff allowlist/authentication remains independent.
- Same-origin POST checks, bounded JSON bodies, persistent atomic rate limits, and bounded cleanup queries are included. Unknown/unconfigured delivery fails closed.

## Sending budgets

Application caps: one request per email per minute, three sends per email per UTC hour, five send attempts per IP per ten-minute bucket, ten application sends per fifteen-minute bucket, forty per UTC hour, 250 per UTC day, and 10,000 per UTC calendar month. Verification has an additional per-IP limit. Failed delivery reservations count conservatively.

These application budgets are not a guarantee of a zero provider bill. Other uses of the same provider account, quota/timezone differences and future pricing changes are outside this application's counters. Stay on the intended free provider plan, verify current limits and monitor its dashboard. Nothing upgrades or purchases provider credits automatically.

Expired challenge records become eligible for cleanup 24 hours after expiry. Expired sessions and expired rate-limit buckets are also cleaned in bounded batches on new code requests. This is request-driven cleanup, not a scheduled maximum-retention guarantee. Confirm account retention and deletion requirements before public launch. Add bot protection and production monitoring as needed for public traffic.

## Verification

Run `node --experimental-strip-types --experimental-sqlite --test tests/member-auth.mjs` with Node 22.13 or newer. Tests use isolated in-memory SQLite and a fake delivery adapter; they send no real emails. Real provider delivery and physical-device testing remain pending owner setup.

Official provider references:
- https://sendpulse.com/knowledge-base/smtp/setup-smtp-server
- https://sendpulse.com/integrations/api
- https://sendpulse.com/integrations/api/smtp
- https://sendpulse.com/pricing/smtp

Brevo references:
- https://developers.brevo.com/reference/send-transac-email
- https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan
- https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders
