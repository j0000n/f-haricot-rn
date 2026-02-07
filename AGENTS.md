# Repository Guidelines

## Scope
These instructions apply to `/Users/jlw/code/f-haricot/haricot-rn`.

## Project Structure
- `app/` contains Expo Router screens.
- `components/`, `hooks/`, `styles/`, `utils/`, `lib/` contain shared UI and utilities.
- `assets/` stores static assets.
- `i18n/` contains locale config and translation resources.

## Active vs Archived Docs
- Active planning source of truth: `/Users/jlw/code/f-haricot/haricot-convex/plan`.
- Archived RN docs/plans:
  - `/Users/jlw/code/f-haricot/old-docs/haricot-rn/docs`
  - `/Users/jlw/code/f-haricot/old-docs/haricot-rn/plan`
  - `/Users/jlw/code/f-haricot/old-docs/haricot-rn/root-markdown`

## Build and Dev Commands
- `npm install`
- `npm run start`
- `npm run start:dev`
- `npm run ios`
- `npm run android`
- `npm run web`
- `npm run lint`
- `npm run typecheck`

## Coding Conventions
- TypeScript-first, keep strict typing.
- Use `@/*` path alias conventions already in repo.
- Components: `PascalCase.tsx`.
- Hooks: `useX.ts(x)`.

## Testing Expectations
- Run `npm run lint` and `npm run typecheck` for all RN changes.
- Validate behavior in Expo on at least one target platform.

## Secrets
- Keep secrets in `.env.local`.
- Do not commit credentials.
