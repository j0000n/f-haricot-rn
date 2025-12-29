# 0) Executive Summary

**Readiness scores (0–100)**
| Domain | Score | Rationale (evidence-based) |
| --- | --- | --- |
| Security | 42 | Session replay/autocapture without consent; mixed-content WebView; PII logging in backend auth. |
| App Store Compliance (iOS) | 45 | Location permission strings missing despite runtime location usage. |
| App Store Compliance (Android) | 50 | Location permissions missing in app config while used at runtime. |
| Privacy/Tracking Implementation | 30 | No consent gating or opt-out persistence for analytics/session replay. |
| Performance/Stability | 55 | Heavy font bundle; session replay overhead; no error boundaries. |
| Offline/Resilience | 35 | No offline handling for Convex queries or 4xx/5xx UX. |
| Data Integrity/Migrations | 40 | No versioned client storage or migration plan. |
| Observability | 25 | No crash reporting; verbose PII logs; no log scrubbing. |
| Accessibility | 60 | Some labels exist; no modal focus management/hints. |
| i18n/l10n (French readiness) | 70 | fr supported, but no fr‑CA or locale variants. |
| Analytics/Metrics | 35 | Autocapture only; no event taxonomy/funnel coverage. |
| Build/Release/Rollback | 45 | Minimal CI; no staged rollout or rollback plan. |
| UX/Onboarding | 55 | Multi-step onboarding with weak error recovery. |

**Top 15 findings (ranked)**
| Rank | Severity | Finding | Impact summary |
| --- | --- | --- | --- |
| 1 | **BLOCKER** | Analytics/session replay initialized without consent | Privacy/ATT/Data Safety mismatch, PII capture risk. |
| 2 | **BLOCKER** | iOS location usage strings missing | App Store rejection or runtime failure. |
| 3 | **BLOCKER** | Android location permissions missing | Play Store policy mismatch; runtime failure. |
| 4 | **HIGH** | Auth logs include emails/OTP and request payloads | PII leakage in logs. |
| 5 | **HIGH** | WebView allows mixed content + arbitrary URLs | MITM/injection risk, policy concerns. |
| 6 | **HIGH** | No crash reporting | Production crashes unobservable; slow incident response. |
| 7 | **HIGH** | No analytics opt‑out persistence | Cannot prove consent; regulatory risk. |
| 8 | **MED** | No offline/error UI for Convex failures | Dead‑end UX on flaky networks. |
| 9 | **MED** | No client storage versioning | Preference corruption across updates. |
| 10 | **MED** | No staged rollout/feature flags | Risky release with limited rollback. |
| 11 | **MED** | Heavy font bundle | Increased app size/cold start time. |
| 12 | **MED** | No defined analytics event taxonomy | Cannot measure onboarding/activation. |
| 13 | **MED** | fr‑CA localization not present | Québec readiness incomplete. |
| 14 | **LOW** | Modal focus management missing | Screen reader focus confusion. |
| 15 | **LOW** | QR scan copies payload to clipboard | Potential data exposure. |

**Ship / No-Ship recommendation:** **NO‑SHIP**
- **Rationale:** Blockers (consent gating + missing location permissions) and high‑severity privacy/logging/observability gaps.

# 1) App & Environment Overview

| Item | Evidence | Notes |
| --- | --- | --- |
| App type | `package.json` sets `"main": "expo-router/entry"`; `app.json` present | **Expo managed** with Expo Router. |
| Platforms supported | `app.json` includes `ios`, `android`, `web` sections; scripts in `package.json` | iOS/Android/Web. |
| Build system | `eas.json` + `npm run build:ios/build:android` | EAS build. |
| Environments | `eas.json` profiles: `development`, `preview`, `production` | No explicit staging vars in repo. |
| Third-party services | PostHog (`components/AnalyticsProvider.tsx`, `utils/posthog.ts`), Convex (`app/_layout.tsx`, `convex/*`), Resend (`convex/auth.ts`), OpenAI (`convex/recipes.ts`, `convex/inventory.ts`), Replicate/Koyeb (`convex/images.ts`) | Backend + analytics external. |

# 2) Architecture & Data Flow Maps

**Client → API → Storage → Third Parties**
```
[App (Expo RN)]
   |  Convex client (ConvexReactClient)
   v
[Convex Backend] --> [Convex DB/Storage]
   |                      |
   |                      +--> Convex Storage (images/files)
   |
   +--> Resend (email OTP)
   +--> OpenAI (recipe/inventory prompts)
   +--> Replicate + Koyeb (image processing)

[App] --> PostHog (analytics + session replay)
[App] --> WebView/Browser (external URLs)
```

**Auth/token flow**
```
[SignIn screen]
   -> Convex Auth (Resend provider)
   -> Email OTP via Resend
   -> Convex Auth session stored in SecureStore (native) or memory (web)
```
Evidence: `app/SignIn.tsx`, `convex/auth.ts`, `app/_layout.tsx`.

**Analytics/tracking flow**
```
[RootLayout]
  -> AnalyticsProvider
  -> PostHog (autocapture + session replay)
```
Evidence: `components/AnalyticsProvider.tsx`, `utils/posthog.ts`, `app/_layout.tsx`.

**PII flow highlight:** email, OTP, and user preferences flow through auth logs and analytics without masking or consent controls.

# 3) Security Audit

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **HIGH** | `convex/auth.ts` logs email, token, request body via `console.log` | PII and auth secrets in logs, possible data breach | Remove or gate logs behind env flag; redact email/token before logging | Confirm logs removed in production build; run sign-in and verify no PII in logs |
| **HIGH** | `app/webview/[id].tsx` sets `mixedContentMode="always"` and loads arbitrary URL | MITM/content injection via HTTP; policy risk | Restrict to HTTPS only, validate allowed hosts, set `mixedContentMode="never"` | Attempt to load HTTP URL and verify blocked; security scan |
| **LOW** | `app/qr-scanner.tsx` copies payload to clipboard | Payload may expose sensitive data | Provide user warning and optional toggle; clear clipboard after use | Manual QA: scan, verify warning, clipboard clears after timeout |

## Token/session handling
- **Storage:** SecureStore via `ConvexAuthProvider` in `app/_layout.tsx`.
- **Refresh/expiry:** Not directly visible; assumed handled by Convex SDK.
- **Logout invalidation:** Not visible in client; assumed server‑side.

# 4) App Store Compliance Audit (iOS)

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **BLOCKER** | `app/qr-scanner.tsx` uses `expo-location` but `app.json` lacks `NSLocationWhenInUseUsageDescription` | App Store rejection or runtime permission crash | Add location usage strings in `app.json` under `ios.infoPlist` | Build iOS, request location; verify dialog shows expected text |
| **HIGH** | PostHog session replay/autocapture enabled without consent (`components/AnalyticsProvider.tsx`, `utils/posthog.ts`) | Tracking consent non‑compliance (ATT/privacy labels) | Gate analytics init behind consent; disable session replay until opt‑in | Verify PostHog is not initialized before consent in production build |

**Submission Risk:** Missing location usage string; tracking without consent; potential privacy label mismatch due to session replay.

# 5) App Store Compliance Audit (Android)

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **BLOCKER** | `app/qr-scanner.tsx` requests location but `app.json` `android.permissions` lacks location permissions | Play Store policy mismatch and runtime permission failure | Add `ACCESS_FINE_LOCATION` (and `ACCESS_COARSE_LOCATION` if needed) in `app.json` | Build Android, confirm permission prompt and scans work |

# 6) Privacy/Tracking Implementation Audit (Technical)

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **BLOCKER** | `components/AnalyticsProvider.tsx` initializes PostHog on app launch | Tracking before consent; privacy policy mismatch | Add consent screen + store preference (SecureStore) before initializing PostHog | Confirm no analytics calls pre‑consent via proxy logs |
| **HIGH** | `utils/posthog.ts` enables `enableSessionReplay: true` | Session replay may capture PII (email/OTP) | Disable session replay by default; enable only after consent + masking | Verify session replay disabled in PostHog settings and app config |
| **HIGH** | No persistent opt‑out preference (no storage key) | Cannot honor user opt‑out | Add stored consent flag; respect in analytics provider | Toggle consent and verify analytics not emitted |

**Tracking before consent search plan:** scanned for `PostHogProvider`, `enableSessionReplay`, `SecureStore` consent keys — only PostHog init found.

# 7) Performance & Stability Audit

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **MED** | `app.json` includes extremely large font list in `expo-font` plugin | Large bundle size, slow cold start | Audit fonts; remove unused families; subset if possible | Measure bundle size before/after, cold start profiling |
| **MED** | `utils/posthog.ts` enables session replay | Increased CPU/network usage | Disable session replay until opt‑in | Monitor startup time and network requests |
| **MED** | No global error boundary (`app/_layout.tsx`) | Unhandled errors can crash app | Add ErrorBoundary at root | Inject error in dev and verify fallback UI |

# 8) Offline/Resilience & Edge Case Audit

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **MED** | Convex `useQuery` used widely with no offline UI | Dead‑end loading on network loss | Add error state + retry UI for key screens | Simulate offline; verify error UI + retry |
| **MED** | Onboarding saves log errors only (e.g., `app/onboarding/*`) | Users stuck with no recovery | Add inline error + retry CTA | Disable network, submit, verify error UI |

**Resilience Test Matrix**
| Scenario | Expected behavior | Evidence | Gap |
| --- | --- | --- | --- |
| Launch offline | Offline banner + cached content | **NOT FOUND** | No offline UI |
| 4xx/5xx from Convex | Clear error + retry | **NOT FOUND** | Only console errors |
| QR scan with denied location | Clear message and path to settings | `app/qr-scanner.tsx` | Missing permission strings at OS level |

# 9) Data Integrity & Migrations Audit

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **MED** | `utils/pendingUserType.ts` uses SecureStore/localStorage with no versioning | Future schema changes can corrupt prefs | Add versioned storage wrapper + migration map | Bump version, confirm migration runs |
| **MED** | No documented Convex migration strategy | Risky schema evolution | Add migration doc and staged rollout plan in `convex/` | Add migration checklist and run in staging |

**Migration Readiness:** **FAIL** (client versioning + backend migration plan missing).

# 10) Observability & Debuggability Audit

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **HIGH** | No crash reporting dependency/config (search for Sentry/Bugsnag) | Crashes unobservable in production | Add crash reporting SDK and env-based config | Force crash in staging; verify report received |
| **HIGH** | PII logs in `convex/auth.ts` | Compliance risk | Remove/redact logs, add structured logging | Verify logs in production do not include PII |

**If a user reports a bug:** No production crash logs or session correlation; only manual repro is possible.

# 11) Accessibility (A11y) Audit

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **LOW** | `app/_layout.tsx` shows `add-task` as modal with no focus management | Screen reader focus may escape modal | Add `accessibilityViewIsModal`/focus trap in modal container | VoiceOver/ TalkBack focus testing |
| **LOW** | No `accessibilityHint` usage (`rg accessibilityHint` = none) | Complex controls lack guidance | Add hints for non-obvious controls (e.g., QR scanner, capture modes) | Screen reader reads hints correctly |

**A11y Blockers:** None found at BLOCKER/HIGH severity; above items are LOW but should be addressed pre‑launch.

# 12) i18n/l10n Audit (incl. French readiness)

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **MED** | `i18n/config.ts` maps locales to base language only; no `fr-CA` | Québec French may be linguistically incorrect | Add `fr-CA` locale file and mapping | Switch device locale to fr‑CA, verify strings |

**French Readiness:** **PASS (70/100)** (fr supported but no fr‑CA variant).

# 13) Analytics & Metrics Audit

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **MED** | No explicit event taxonomy (no `capture` calls found) | No measurable onboarding/activation | Define and implement event list | Verify events in PostHog with QA session |
| **HIGH** | Analytics runs before consent | Data policy mismatch | Gate analytics initialization | Confirm events not sent before consent |

**Recommended minimal event set (<=25)**
| Screen/Component | Event | Where to emit |
| --- | --- | --- |
| `app/SignIn.tsx` | `auth_email_submitted`, `auth_code_verified` | After submit/verify success/failure |
| `app/_layout.tsx` | `onboarding_started`, `onboarding_completed` | On route transitions |
| `app/onboarding/*` | `onboarding_step_completed` | On each step submit |
| `app/(tabs)/index.tsx` | `home_viewed` | On focus |
| `app/search/[query].tsx` | `search_submitted` | After query submit |
| `app/recipe/[id].tsx` | `recipe_viewed` | On data load |
| `app/add-task.tsx` | `inventory_capture_started/completed` | On capture flow |
| `app/qr-scanner.tsx` | `qr_scan_started/completed` | On scan start/success |
| `app/profile.tsx` | `profile_updated` | After updates |

# 14) Build/Release/Rollback Audit

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **MED** | Only whitespace CI workflow in `.github/workflows/whitespace.yml` | No automated lint/typecheck/build gating | Add CI jobs for lint/typecheck/e2e | CI run blocks on failures |
| **MED** | No staged rollout/feature flags (search for flags = none) | Risky releases; no kill switch | Add release channels or remote flags | Verify staged rollout process |
| **MED** | No rollback plan documented | Slow response to regressions | Add rollback runbook in `docs/` | Simulate rollback using EAS update |

**Release Runbook (derived from repo scripts)**
1. `npm install`
2. `npm run lint` + `npm run typecheck`
3. `npm run build:ios` / `npm run build:android`
4. `npm run submit:ios` / `npm run submit:android`

# 15) UX Friction & Onboarding Audit

## Findings
| Severity | Evidence | Risk | Fix | Verification |
| --- | --- | --- | --- | --- |
| **MED** | QR scanner requires camera+location with no skip path (`app/qr-scanner.tsx`) | User drop‑off due to permission denial | Add skip/learn‑more flow and defer permissions | QA with denied permissions |
| **MED** | Onboarding save failures only logged (`app/onboarding/*`) | Users stuck without feedback | Add error banners/toasts + retry | Simulate network error and verify UI |

# 16) Launch-Blocking Checklist

**Security & Privacy**
- [ ] **BLOCKER:** Consent‑gated analytics/session replay.
- [ ] **HIGH:** Remove PII logging in `convex/auth.ts` and `app/SignIn.tsx`.
- [ ] **HIGH:** Restrict WebView to HTTPS and allowed hosts.

**App Store Compliance**
- [ ] **BLOCKER:** Add iOS location usage strings.
- [ ] **BLOCKER:** Add Android location permissions.

**Observability**
- [ ] **HIGH:** Add crash reporting with PII scrubbing and source maps.

**Offline/Resilience**
- [ ] **MED:** Add error/empty states for network failures.

**Build/Release**
- [ ] **MED:** Add CI gating and staged rollout.

**What to fix first in the next 48 hours**
1. Consent gating for PostHog + disable session replay until opt‑in.
2. Add location permissions/usage strings for iOS/Android.
3. Remove PII logs in `convex/auth.ts` and `app/SignIn.tsx`.
4. Add crash reporting + production log level control.

# Audit Methods (mandatory)

**Entry points enumerated**
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/onboarding/*`.

**Networking layers identified**
- Convex client (`app/_layout.tsx`) + Convex actions/queries (`convex/*`), WebView (`app/webview/[id].tsx`).

**Storage layers identified**
- SecureStore/localStorage (`utils/pendingUserType.ts`), Convex storage (`convex/schema.ts`).

**Analytics/crash SDKs enumerated**
- PostHog (`components/AnalyticsProvider.tsx`, `utils/posthog.ts`); crash SDK **NOT FOUND**.

**Permissions & platform configs checked**
- `app.json` iOS/Android permissions, `expo-camera`, `expo-image-picker`, `expo-location` usage.

**Build scripts & env selection**
- `package.json` scripts, `eas.json` profiles.

**Targeted scans (what searched)**
- `PostHogProvider`, `enableSessionReplay`, `EXPO_PUBLIC_*`, `SecureStore`, `console.*`, `expo-location`, `accessibilityHint`, `sentry|bugsnag`.
