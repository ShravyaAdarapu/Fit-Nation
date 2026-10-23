# Fit Nation — launch details

Private first version with an enquiry database. Not yet ready for public membership sales.

- Confirm all six branch names, addresses, map links, hours, direct contact numbers and available programs.
- Four possible locations currently shown: Kothapet and Hayathnagar from public listings; Moosarambagh and Nagole from visible Instagram collaborations. All marked pending.
- Replace stock photography with approved originals. The actual Instagram crest is installed; request the high-resolution logo master.
- Confirm membership prices, cross-branch policy, trial policy, cancellation and refund rules.
- Set ADMIN_EMAILS runtime environment variable to a comma-separated list of authorised staff emails. Access is denied by default. Current admin is an owner inbox; branch manager roles are not implemented.
- Connect staff email/SMS/WhatsApp notifications through an approved service. Current enquiries persist without automatic messages.
- Approve privacy notice, retention period and privacy contact.
- Email member accounts and sessions are prepared but unavailable until SendPulse setup and live delivery testing are complete; see LOGIN-SETUP.md. Payment collection, attendance and renewals are not implemented.

## Technical setup

Requires Node >=22.13. Run the Sites installer, generate database migrations with `npm run db:generate`, then build using the Sites build helper. The hosting manifest binds Cloudflare D1 as DB. Apply generated migrations locally before exercising enquiry submissions. Hosted migrations are applied by Sites during publication.
