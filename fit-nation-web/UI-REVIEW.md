# Visitor experience review

Reviewed 23 October 2026. No new paid services or dependencies were added.

## Changes

- Shared sticky header for the homepage and branch pages. Visit and labelled login actions are grouped on the right; tablet and phone navigation collapses into a menu.
- Keyboard Escape, outside-click dismissal, and larger touch targets for navigation and dialogs. Added a skip-to-content link and accessible dialog names.
- Program cards retain image motion while their text and buttons stay in place. Removed the non-functional slide counter and duplicate branch preview banner.
- Program enquiries preselect the correct interest. Opening a new form clears old details. Branch links retain the requested branch and synchronize the homepage branch sections.
- Indian contact numbers are normalized and validated in the browser and server. A pasted +91 prefix is supported.
- Branch search includes a reset action. Map provenance remains available under an expandable disclosure.
- Google sign-in is visibly unavailable until configured; it no longer opens a dead-end notice.

## Validation

- TypeScript check and production build.
- Twelve phone normalization cases covering domestic numbers, country prefixes, formatted input and invalid values.
- Browser checks at 320, 390, 768 and 1280 pixels: no document horizontal overflow.
- Local enquiry rejected an invalid number and saved a synthetic valid enquiry with a reference. No staff notifications are configured.
- Verified program preselection, clean form reopening, native Escape handling, branch search/reset, synchronized branch sections, branch trainers, map rendering and branch-to-enquiry navigation.
- CSS preserves reduced-motion preferences. Physical iOS/Android devices have not been tested.

## Still required for a live launch

- Email OTP and server sessions have since been prepared, replacing the phone/demo flow. Delivery is unavailable until the owner configures SendPulse; see LOGIN-SETUP.md. Real email delivery still needs testing. Google OAuth is not implemented. No paid messaging balance has been purchased.
- Equipment quantities are explicitly labelled sample data. Trainer rosters, contact numbers, hours, facilities, the full six-branch roster and location entrances need gym confirmation.
- Staff inbox access needs the owner's administrator allowlist. Automatic staff notifications and the final privacy policy remain unconfigured.

The site keeps its existing owner-private audience.
