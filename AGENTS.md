# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds the Expo Router screens and entry points for the mobile/web UI.
- `components/`, `hooks/`, `styles/`, `utils/`, and `lib/` contain shared UI, hooks, styling helpers, and core utilities.
- `convex/` contains Convex backend functions and auth handlers.
- `assets/` stores static assets (images, fonts). Platform-specific projects live in `ios/` and `android/` after prebuild.
- `app-example/` is the archived starter template; it is excluded from TypeScript compilation.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run start`: run Expo dev server (default).
- `npm run start:dev`: start with a dev client.
- `npm run ios` / `npm run android`: run native builds on simulator/device.
- `npm run web`: run web build via Expo.
- `npm run lint` / `npm run lint:fix`: run ESLint (Expo config).
- `npm run typecheck`: TypeScript typecheck (`strict` enabled).
- `npm run convex:dev`: run Convex dev deployment.
- `npm run prebuild`: generate native projects; use `prebuild:clean` to reset.
- `npm run build:ios` / `npm run build:android`: EAS cloud builds.

## Coding Style & Naming Conventions
- TypeScript is the default; path alias `@/*` maps to the repo root.
- Components in `components/` use `PascalCase.tsx` filenames; hooks in `hooks/` use `useX.ts(x)`.
- Follow existing formatting; enforce with `npm run lint` and `npm run typecheck`.

## Testing Guidelines
- Automated E2E tests are currently removed (see `docs/testing.md`).
- Validate changes by running lint/typecheck and exercising flows in Expo (`npm run start`).
- For email flows, local SMTP uses MailDev (`npm run maildev`) with `MAILDEV_SMTP_HOST`.

## Commit & Pull Request Guidelines
- Recent commits use short, direct subjects without a strict convention; keep messages imperative and scoped (e.g., “Fix onboarding step”).
- PRs should describe the user-facing impact, list key changes, and include screenshots for UI updates.

## Configuration & Secrets
- Local settings live in `.env.local` (Convex, SMTP, API keys). Do not commit secrets; share values through secure channels.
