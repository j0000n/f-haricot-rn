# Testing

## Current status

Playwright end-to-end tests have been temporarily removed.

## Email delivery

The Convex auth handler sends verification codes through Nodemailer. When `MAILDEV_SMTP_HOST` is set, it uses the local MailDev SMTP server (`MAILDEV_SMTP_PORT`, default `1025`). Otherwise, the Resend provider is used with `AUTH_RESEND_KEY`.
