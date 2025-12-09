# End-to-end testing status

## Current automated tests
- **Playwright onboarding flows (`tests/e2e/onboarding.spec.ts`)**
  - Starts the Expo web dev server and MailDev automatically via Playwright global setup.
  - Covers three sign-in + onboarding journeys: standard user, creator, and vendor.
  - Generates a unique email per run, requests a magic code via the Resend auth provider, pulls the code from MailDev, and completes the respective onboarding flow until landing on the home area.

## How email delivery works in tests
- When `MAILDEV_SMTP_HOST` is set (defaulted to `127.0.0.1` in Playwright dev-server helper), the Convex auth handler sends verification codes through Nodemailer to the local MailDev SMTP server (`MAILDEV_SMTP_PORT`, default `1025`).
- Outside of that override, the Resend provider is used with `AUTH_RESEND_KEY`.

## What to run locally
- `npm run test:e2e`
  - Downloads Playwright Chromium (if needed), starts the Expo web dev server and MailDev, runs the onboarding scenarios, and shuts everything down.

## Next steps and gaps
- Expand E2E coverage beyond onboarding (e.g., recipe browsing, task creation, household management) once stable test IDs are available.
- Add headless/native platform coverage if needed; today the suite runs against the web build only.
- Consider seeding backend fixtures to speed up onboarding and reduce reliance on random data.
