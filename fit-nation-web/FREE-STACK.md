# Free-first stack and cost boundaries

No paid SDK, API key, plugin, subscription, map API or messaging provider has been added. No payment or paid plan has been activated by this implementation.

## Application
- React, TypeScript, Vinext/Vite, Tailwind CSS, Lucide and Drizzle are open-source tooling with no software licence purchase required.
- SQLite-compatible D1 stores enquiries. Branch content lives in source until the gym supplies approved information.
- Official gym crest is stored locally. Owner-supplied photography can replace the existing free stock photographs.
- Google Fonts are free to use; the site does not use paid font services.
- OpenStreetMap is embedded with visible contributor attribution. No map API key, paid geocoder, routing API or commercial map SDK is used. External Google Maps searches/directions are ordinary links, not paid Google Maps API calls.
- No premium theme, automated AI API, analytics subscription, SMS or WhatsApp Business API is required.
- SendPulse email OTP integration is prepared but disabled pending an owner-controlled account, approved sender and runtime secrets. App budgets restrict sending; provider quotas, other account usage and future prices still need monitoring. No paid plan or credits have been activated. See LOGIN-SETUP.md.

## Hosting
The current private preview is deployed through Sites. Its account-level billing/entitlements are not exposed to this project, so this file does not claim that the managed Sites hosting is guaranteed free. Existing ChatGPT/Codex subscription costs are separate from the website software.

For independent hosting, Cloudflare Workers and D1 have Free plans. At the time checked (23 October 2026), the documented allowances are:
- Workers: 100,000 dynamic requests/day, 10 ms CPU/request. Static assets have separate free serving rules.
- D1: 5 million rows read/day, 100,000 rows written/day, 5 GB total account storage, plus per-database limits.

These figures describe Cloudflare's own plans; they do not establish the billing policy of managed Sites. Free quotas are limits, not an unlimited hosting guarantee. Stay on Workers Free without enabling a paid subscription. On Free, quota exhaustion can interrupt service instead of enabling paid capacity automatically. Do not upgrade without explicit owner approval.

A free provider subdomain avoids a domain-registration fee. A custom domain is optional and usually has a registration/renewal charge. Online payment processing generally has transaction fees and is not implemented. Paid notifications are not implemented; staff can use the inbox and manual contact.

OpenStreetMap's public service is best-effort and subject to usage policy, not an unlimited SLA. The embeds load on demand; no bulk/offline tile downloads or geocoding are performed. If maps become unavailable, visitors retain an external Maps search link.

Official references:
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://operations.osmfoundation.org/policies/tiles/
- https://www.openstreetmap.org/copyright
