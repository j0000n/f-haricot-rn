# Privacy & Compliance Audit Report
Repository: `/workspace/haricot-react-native`
Scope: GDPR, CCPA/CPRA, Canada PIPEDA, Québec Law 25 (CQLR c P-39.1), Québec French-language obligations (Bill 96 / Charter modernization)
Date: 2025-??-??

---

## 1) Executive Summary

### Overall readiness score (0–100)
- **GDPR:** 35/100
- **CCPA/CPRA:** 30/100
- **PIPEDA:** 38/100
- **Québec Law 25:** 28/100
- **Québec French-language obligations:** 45/100

### Top 10 highest‑risk gaps (ranked)
1. **No privacy policy, consent notice, or legal disclosures found** (no `/privacy`, `/terms`, or equivalent docs/config). Satisfies none of GDPR/CCPA/PIPEDA/Law 25 transparency requirements. (Search results in repo showed no privacy/terms documents.)
2. **No DSAR endpoints or UI flows** for access, deletion, correction, portability, or objection/opt‑out. No data export or deletion logic in Convex functions. (No DSAR endpoints found in `convex/*`.)
3. **PostHog analytics with session replay enabled and no user consent/opt‑out**. `enableSessionReplay: true` and `autocapture` are always on for mobile (`components/AnalyticsProvider.tsx`, `utils/posthog.ts`).
4. **Sensitive data categories collected without explicit consent/handling** (allergies, dietary restrictions, nutrition goals, children’s allergies). Stored in `convex/schema.ts` and set via profile updates (`convex/users.ts`, `convex/households.ts`).
5. **Location data collected and stored** via QR scanning without explicit purpose-limited consent flows or retention limits. (`app/qr-scanner.tsx`, `convex/qrEvents.ts`).
6. **PII logged to console** (email address, preferred language, auth context). Logs in `app/SignIn.tsx`, `convex/auth.ts`, `convex/images.ts` (prompts), `components/ThemeSwitcher.tsx` etc.
7. **Third‑party data sharing without documented DPAs/SCCs or cross‑border assessment** (PostHog, Resend, OpenAI, Replicate, Koyeb). No vendor governance docs found.
8. **No defined retention/TTL for personal data** (user profiles, household inventory, QR events, tasks). No purge/retention logic found.
9. **Québec Law 25 requirements not implemented** (confidentiality incident register, PIA triggers, cross‑border assessment artifacts, privacy policy in clear language).
10. **French‑language coverage gaps in UI** due to hardcoded English strings in screens (e.g., `app/qr-scanner.tsx`, `app/webview/[id].tsx`, `app/tasks/[id].tsx`).

---

## 2) Data Inventory (table)

> Evidence based on `convex/schema.ts`, `convex/users.ts`, `convex/households.ts`, `convex/tasks.ts`, `convex/qrEvents.ts`, `app/*`, `utils/*`, `components/AnalyticsProvider.tsx`, `utils/posthog.ts`.

| Data element | Category | Field names / schema paths / storage | Source | Purpose | Retention | Sharing / disclosure | Region implications | Legal basis mapping |
|---|---|---|---|---|---|---|---|---|
| User identity | Identifier/contact | `users.name`, `users.email`, `users.phone`, `users.image` in `convex/schema.ts` | User input + auth provider (Resend OTP) | Account creation/login, profile display | **Unknown** (no retention policy) | Resend email OTP (`convex/auth.ts`), Convex DB | Likely global; cross‑border if EU/QC | GDPR: contract/consent; PIPEDA/QC: meaningful consent/purpose specified |
| Auth metadata | Security | `users.emailVerificationTime`, `users.phoneVerificationTime`, `users.isAnonymous` | Auth flow | Account security | Unknown | Resend + Convex | Cross‑border | GDPR: legitimate interests/security; PIPEDA: consent/legitimate purpose |
| Age | Sensitive (potentially minor) | `users.age` | User input | Personalization | Unknown | Convex | High risk if minors in QC/EU | GDPR: consent + age gating; PIPEDA/QC: consent with special care |
| Dietary restrictions & allergies | Sensitive health data | `users.dietaryRestrictions`, `users.customDiet`, `users.allergies`, `users.nutritionGoals` | User input | Personalization, food recommendations | Unknown | Convex DB | Cross‑border | GDPR: explicit consent required; PIPEDA/QC: express consent |
| Accessibility preferences | Preference data | `users.preferredTextSize`, `users.dyslexiaMode`, `users.highContrastMode`, `users.motionPreference` | User input | UX accessibility | Unknown | Convex DB | Cross‑border | GDPR: legitimate interest/consent (low‑risk) |
| Language | Preference | `users.preferredLanguage` | User input + device locale | Localization | Unknown | Convex + Resend email localization | Cross‑border | GDPR: legitimate interest |
| Household membership | Identifier | `users.householdId`, `households.ownerId`, `households.members`, `households.pendingMembers` | User actions | Shared household inventory | Unknown | Convex DB | Cross‑border | GDPR: contract/consent |
| Household children | Sensitive (children) | `households.children[].name`, `children[].allergies` | User input | Household profile | Unknown | Convex DB | High risk for minors | GDPR: explicit consent + child protections; PIPEDA/QC: express consent |
| Inventory & notes | Behavioral + content | `households.inventory[].itemCode`, `varietyCode`, `quantity`, `purchaseDate`, `note` | User input + voice transcription | Inventory management | Unknown | OpenAI for transcript mapping (see below); Convex DB | Cross‑border | GDPR: contract/consent |
| Tasks | Content | `tasks.title`, `tasks.description`, `tasks.userId` | User input | Task management | Unknown | Convex DB | Cross‑border | GDPR: contract |
| QR scan payload & location | Identifier + precise location | `qrEvents.payload`, `qrEvents.latitude`, `qrEvents.longitude`, `accuracy`, `scannedAt` | QR scan + device GPS (`app/qr-scanner.tsx`) | Proximity verification | Unknown | Convex DB | High‑risk for QC/EU | GDPR: explicit consent for location; PIPEDA/QC: meaningful consent |
| Device metadata (analytics) | Device/usage | PostHog autocapture + screen capture | App usage | Analytics & product insights | Unknown | PostHog (US host) | Cross‑border data transfer | GDPR: consent required for analytics + session replay |
| Voice transcripts | Sensitive content | `mapSpeechToInventory` sends transcript to OpenAI | Voice input (`app/add-task.tsx`) | Inventory mapping | Not stored explicitly in DB, but sent to OpenAI | OpenAI API (`convex/inventory.ts`) | Cross‑border transfer | GDPR: consent and transparency required |
| Image content | Media | Convex storage IDs in `recipes.*StorageId`, `images.ts` | Uploaded/generate assets | Recipe/ingredient images | Unknown | Replicate + Koyeb processing | Cross‑border | GDPR: consent, vendor DPAs |
| Recipe author info | Identifier | `recipes.authorName`, `authorSocial*`, `sourceUrl` | Ingestion of public data | Attribution | Unknown | Convex DB | Cross‑border | GDPR: legitimate interest; ensure public data handling |
| Analytics keys | Credentials | `EXPO_PUBLIC_POSTHOG_API_KEY` | Build-time env | Analytics | N/A | PostHog | Cross‑border | Ensure exposure is intended |

---

## 3) Data Flows (ASCII diagrams)

### Mobile app → backend → vendors
```
[Mobile App]
  |  (email, profile, inventory, QR scan, preferences)
  v
[Convex API + DB]
  |-- stores users/households/tasks/qrEvents/recipes
  |-- storage: Convex file storage
  |
  |---> [Resend] (email OTP: identifier=email)
  |---> [OpenAI] (inventory transcript via https://api.openai.com/v1/chat/completions)
  |---> [Replicate] (image generation)
  |---> [Koyeb endpoint] (image processing)
  |---> [PostHog] (analytics + session replay)

Cross‑border: likely QC/EU -> US for PostHog, Resend, OpenAI, Replicate; Koyeb region unknown.
```

### QR proximity flow (location)
```
[QR Scanner Screen] -> GPS via expo-location
  -> recordScan mutation (convex/qrEvents.ts)
  -> Convex DB stores latitude/longitude/accuracy
  -> returns pairing status to client
```

### Voice inventory mapping
```
[Voice input] -> transcript (app/add-task.tsx)
  -> mapSpeechToInventory action (convex/inventory.ts)
  -> OpenAI API (transcript + catalog)
  -> Convex mutation applyInventoryUpdates
```

---

## 4) Rights Handling (DSAR)

> **No DSAR endpoints/UI found** for access, deletion, correction, portability, or objection/opt‑out. Evidence: no functions in `convex/*` for export/delete, no UI paths in `app/*`.

### Regime mapping
- **GDPR:** Access, deletion, rectification, portability, restriction, objection, automated decision notice → **Not implemented**.
- **CCPA/CPRA:** Know, delete, correct, opt‑out of sale/share, limit use of sensitive info → **Not implemented**.
- **PIPEDA:** Access, correction, consent withdrawal → **Not implemented**.
- **Québec Law 25:** Access, correction, de‑indexing (if applicable), portability → **Not implemented**.

**Required builds:**
- API endpoints (Convex actions) to export all user data, delete user data, correct profile fields.
- UI in `app/profile.tsx` for DSAR requests.
- Backend workflows for household data and children data deletion.

---

## 5) Consent & Preference Management

### Current state
- **Analytics:** PostHog enabled for mobile without consent or opt‑out (`components/AnalyticsProvider.tsx`, `utils/posthog.ts`). Session replay enabled.
- **Location:** QR scanner requests location permission without dedicated privacy notice beyond UI text (`app/qr-scanner.tsx`).
- **Voice:** Transcript is sent to OpenAI without explicit consent notice (`convex/inventory.ts`).
- **Email:** OTP via Resend (no notice shown in UI beyond sign‑in flow).

### Missing mechanics
- **GDPR/PIPEDA/QC consent:** No consent management UI, no ability to withdraw.
- **CCPA/CPRA “Do Not Sell/Share”** and **limit use of sensitive information**: not present.
- **Cookie/SDK consent (web):** No web consent banner (analytics disabled for web, but other tracking may be added later).

---

## 6) Security & Breach/Incident Readiness

### Authentication/session management
- Convex Auth with Resend OTP (`convex/auth.ts`). Tokens stored in SecureStore on mobile (`app/_layout.tsx`).
- **Risk:** PII logged to console during auth (emails, language), which could leak in logs (`app/SignIn.tsx`, `convex/auth.ts`).

### Encryption in transit/at rest
- Calls use HTTPS endpoints (`api.openai.com`, `us.i.posthog.com`, `koyeb.app`).
- **At rest:** no explicit encryption controls in repo (rely on Convex/vendor defaults).

### Secrets management
- API keys referenced via env vars (`OPEN_AI_KEY`, `REPLICATE_API_TOKEN`, `AUTH_RESEND_KEY`) in `convex/*`.
- No secret values in repo. Good.

### Logging and data leakage
- PII in logs (email addresses, preferredLanguage, auth context; `app/SignIn.tsx`, `convex/auth.ts`).
- `convex/images.ts` logs prompts for image generation (`console.log('input', ...)`).

### Incident response
- **PIPEDA**: No evidence of breach response process or “real risk of significant harm” assessment workflow.
- **Québec Law 25**: No confidentiality incident register or notification procedure.

**Remediation:** add incident response runbook, logging redaction, breach register store.

---

## 7) Québec Law 25 Specific Checks

- **Confidentiality policy:** Not found in repo (no privacy policy/notice).
- **PIA triggers:** No evidence of Privacy Impact Assessment documentation or triggers for:
  - systems processing personal info (Convex + mobile app)
  - cross‑border transfers (PostHog/OpenAI/Resend/Replicate/Koyeb)
- **Cross‑border transfer assessment artifacts:** Not found. Should document in `docs/privacy/` or equivalent.
- **Data portability:** Not implemented (no export endpoint).

---

## 8) Québec French-language (Bill 96 / Charter) Product-Surface Checks

### Localization support
- i18n exists with `i18next` and `react-i18next` (`i18n/config.ts`) and French locale file `i18n/locales/fr.json`.
- Email OTP content has French translation (`i18n/emails/signInCodeEmail.ts`).

### Gaps in French coverage (examples of hardcoded English UI)
- `app/qr-scanner.tsx`: strings like “QR scanner”, “Enable camera & location”, “Scan another code” are hardcoded.
- `app/webview/[id].tsx`: “Open in Browser” hardcoded.
- `app/tasks/[id].tsx`: “Are you sure you want to delete this task?” and “Delete Task” hardcoded.

### Missing French for legal/marketing surfaces
- No privacy policy or legal notices in any language.

### Minimal implementation plan
- Add translation keys for hardcoded strings and move to `i18n/locales/*.json` (start with `fr.json` and `en.json`).
- Ensure language selection exposes French as first‑class (already available in `i18n/config.ts`).
- Provide French privacy policy and consent copy (new files in `docs/` or served via app).

---

## 9) Vendor / Processor Governance

| Vendor | Evidence | Data shared | Purpose | Region | Required contractual controls |
|---|---|---|---|---|---|
| **Convex** | `convex/*`, `app/_layout.tsx` | All user data, inventory, tasks, QR events, images | Backend DB/storage/auth | Unknown (likely US) | GDPR DPA, SCCs if EU/QC, confidentiality & breach clauses |
| **Resend** | `convex/auth.ts` | Email address, OTP | Authentication email | US | DPA, SCCs, service provider terms |
| **PostHog (US host)** | `utils/posthog.ts`, `components/AnalyticsProvider.tsx` | Device usage, session replay | Analytics | US | DPA, SCCs, opt‑out/consent controls |
| **OpenAI** | `convex/inventory.ts` | Voice transcript text | Inventory mapping | US | DPA, SCCs, data use restrictions |
| **Replicate** | `convex/images.ts` | Image prompt inputs | Image generation | US | DPA, SCCs, IP/privacy terms |
| **Koyeb endpoint** | `convex/images.ts` | Image bytes | Image processing | Region unknown | Processor terms, location disclosure |
| **Expo** | `app.json`, `expo-*` dependencies | Device/app telemetry (depends on Expo services) | App runtime | Global | Review Expo data practices |

No vendor governance documentation found in repo.

---

## 10) Concrete Remediation Plan

### Quick wins (1 day)
- **[High]** Add privacy notice banner and opt‑in for analytics + session replay. **Owner:** Mobile/Web. **Effort:** S. **Files:** `components/AnalyticsProvider.tsx`, `utils/posthog.ts`, add UI in `app/profile.tsx` or onboarding screens.
- **[High]** Remove or redact PII logs (email, auth ctx, image prompts). **Owner:** Backend/Mobile. **Effort:** S. **Files:** `convex/auth.ts`, `app/SignIn.tsx`, `convex/images.ts`.
- **[High]** Add French translations for hardcoded English strings. **Owner:** Mobile. **Effort:** S. **Files:** `app/qr-scanner.tsx`, `app/webview/[id].tsx`, `app/tasks/[id].tsx`, `i18n/locales/fr.json`, `i18n/locales/en.json`.
- **[Med]** Add retention notes in code comments + TODOs. **Owner:** Backend. **Effort:** S. **Files:** `convex/qrEvents.ts`, `convex/users.ts`, `convex/households.ts`.

### Structural work (2–4 weeks)
- **[Critical]** Implement DSAR flows (access/export, delete, correction, portability). **Owner:** Backend + Mobile. **Effort:** L. **Files:** new `convex/dsar.ts`, add UI in `app/profile.tsx`.
- **[Critical]** Create privacy policy + CCPA/CPRA disclosures + Québec Law 25 notice. **Owner:** Legal/Ops + Web/Mobile. **Effort:** M. **Files:** new `docs/privacy/` and in‑app viewer (`app/webview/[id].tsx` or new screen).
- **[High]** Add consent management for sensitive data (health + location + analytics). **Owner:** Mobile + Backend. **Effort:** M. **Files:** onboarding screens (`app/onboarding/*`), `convex/users.ts` to store consent flags.
- **[High]** Cross‑border assessment + PIA artifacts for Law 25. **Owner:** Legal/Ops. **Effort:** M. **Files:** `docs/privacy/piA.md`, `docs/privacy/cross-border.md`.
- **[High]** Incident response plan + confidentiality incident register capability. **Owner:** DevOps + Legal/Ops. **Effort:** M. **Files:** `docs/security/incident-response.md`, new `convex/incidents.ts` to log incidents.
- **[Med]** Add data retention enforcement (e.g., delete QR events older than X days). **Owner:** Backend. **Effort:** M. **Files:** `convex/qrEvents.ts` (scheduled cleanup).
- **[Med]** Secure file access (auth checks for storage URL retrieval). **Owner:** Backend. **Effort:** M. **Files:** `convex/fileUrls.ts` (ensure only authorized access).

---

## Evidence Appendix (selected)
- Data schema: `convex/schema.ts`
- User profile updates: `convex/users.ts`
- Household children + allergies: `convex/households.ts`
- Location & QR scans: `app/qr-scanner.tsx`, `convex/qrEvents.ts`
- Analytics config: `components/AnalyticsProvider.tsx`, `utils/posthog.ts`
- OpenAI transcript processing: `convex/inventory.ts`
- Resend OTP emails: `convex/auth.ts`, `i18n/emails/signInCodeEmail.ts`
- Image generation/processing: `convex/images.ts`
- Hardcoded English strings: `app/qr-scanner.tsx`, `app/webview/[id].tsx`, `app/tasks/[id].tsx`

---

**End of report.**
