# Deploy to the owner's Cloudflare account

In Cloudflare Workers Builds, connect `ShravyaAdarapu/Fit-Nation` and set:

- Project / Worker name: `fit-nation`
- Root directory: `fit-nation-web`
- Build command: `npm run build:cloudflare`
- Deploy command: `npm run deploy:cloudflare`
- Preview / non-production command: `npm run preview:cloudflare`
- Build variable: `NODE_VERSION` = `22.23.2` (Node 22.13 or newer required)

The build generates `dist/server/wrangler.cloudflare.json` from the Workers build.
The real account and database IDs are in `cloudflare-deploy.json`; they are not secrets.
The default Sites manifest and generated Sites configuration remain unchanged.
Production deployment applies pending SQL files in `drizzle/` to the real D1 database,
then uploads the Worker and client assets. Do not deploy older code until these
deployment scripts have been pushed to the connected GitHub branch.

Cloudflare's build API token needs D1 Edit as well as Workers deployment permissions.
If the migration step reports an authorization error, adjust that build token's D1
permission for this account, then retry. Do not share the token in chat or Git.

Preview versions use the same database binding; use them for read-only checks.
They do not apply migrations. Deploy production first to initialize the database.

## Email OTP

After SendPulse SMTP and the sender are approved, set the following Worker runtime
variables / secrets in Cloudflare Settings (not just build variables):

- `SENDPULSE_API_KEY`: secret, SendPulse REST API key (not SMTP password)
- `SENDPULSE_FROM_EMAIL`: approved sender address
- `EMAIL_OTP_SECRET`: secret, at least 32 cryptographically random bytes, hex/base64 encoded
- `EMAIL_OTP_ENABLED`: `true`, only when all the above are configured

Login stays disabled until these are configured. Redeploy after adding runtime settings.
Dashboard runtime variables are retained by the generated configuration.

## Verify after deployment

Open the returned `workers.dev` URL and check the home page, a branch page, and privacy.
Submit one enquiry and confirm it appears in D1's `enquiries` table.
Check `/api/auth/session`: `available` stays false until email setup is complete.
Then request a real code, verify it, refresh to check the session, and sign out.

The existing staff inbox uses Sites gateway authentication and is unavailable on
direct Cloudflare hosting. Direct hosting strips those identity headers so they
cannot be forged. Staff authentication needs a separate integration; until then,
the owner can inspect enquiries in the authenticated Cloudflare D1 console.
