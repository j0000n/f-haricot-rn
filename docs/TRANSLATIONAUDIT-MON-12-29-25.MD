# Translation Audit (Monday, December 29)

## Scope
Audit performed across app UI, widgets, and email i18n usage with special focus on Hindi (hi) and Urdu (ur) coverage, plus hardcoded English strings that should move into translation files.

## Where translations are used
The following files/components explicitly use i18n helpers (`useTranslation`, `t`, or i18n-aware helpers) and should be included in translation review:

- i18n layer
  - `i18n/useTranslation.ts`
  - `i18n/locales/*.json`
  - `i18n/config.ts`
  - `i18n/emails/signInCodeEmail.ts`
  - `i18n/emails/types.ts`
- App screens
  - `app/_layout.tsx`
  - `app/(tabs)/_layout.tsx`
  - `app/(tabs)/index.tsx`
  - `app/(tabs)/kitchen.tsx`
  - `app/(tabs)/lists.tsx`
  - `app/(tabs)/creator.tsx`
  - `app/(tabs)/vendor.tsx`
  - `app/add-task.tsx`
  - `app/SignIn.tsx`
  - `app/profile.tsx`
  - `app/lists/[id].tsx`
  - `app/recipe/[id].tsx`
  - `app/ingredient/[id].tsx`
  - `app/search/[query].tsx`
  - `app/webview/[id].tsx`
- Onboarding
  - `app/onboarding/accessibility.tsx`
  - `app/onboarding/allergies.tsx`
  - `app/onboarding/cooking-styles.tsx`
  - `app/onboarding/cuisines.tsx`
  - `app/onboarding/dietary.tsx`
  - `app/onboarding/household.tsx`
  - `app/onboarding/household-code.tsx`
  - `app/onboarding/meal-preferences.tsx`
  - `app/onboarding/nutrition-goals.tsx`
  - `app/onboarding/theme.tsx`
  - `app/onboarding/creator/index.tsx`
  - `app/onboarding/creator/profile.tsx`
  - `app/onboarding/creator/finish.tsx`
  - `app/onboarding/vendor/index.tsx`
  - `app/onboarding/vendor/profile.tsx`
  - `app/onboarding/vendor/finish.tsx`
- Components
  - `components/cards/RecipeCard.tsx`
  - `components/cards/RecipeCardCompact.tsx`
  - `components/RecipeHeader.tsx`
  - `components/LogoPicker.tsx`
  - `components/PageHeader.tsx`
  - `components/RecipeRail.tsx`
  - `components/RecipeRailCompact.tsx`
  - `components/RecipeListPicker.tsx`
  - `components/Rail.tsx`
  - `components/RecipeRunner.tsx`
  - `components/IngredientsList.tsx`
  - `components/LinkPreviewRail.tsx`
  - `components/LanguageSwitcher.tsx`
  - `components/ThemeSwitcher.tsx`
  - `components/ThemeCreatorModal.tsx`
  - `components/LoadingScreen.tsx`
- Utilities
  - `utils/recipes.ts` (uses `TFunction` for localized time labels)
- Email auth flow
  - `convex/auth.ts` (locale detection & email content generation)

## Hindi/Urdu coverage status

### Missing keys in hi/ur
Hindi and Urdu are missing **64** keys each compared with `en.json` (mainly `inventoryCapture.*`). These keys should be added to both `i18n/locales/hi.json` and `i18n/locales/ur.json`.

Missing key list (all missing in both hi/ur):
- `inventoryCapture.addInputBeforeProcess`
- `inventoryCapture.applyError`
- `inventoryCapture.applyInventoryUpdates`
- `inventoryCapture.cameraModuleMissing`
- `inventoryCapture.cameraNotesPrompt`
- `inventoryCapture.cameraOpenError`
- `inventoryCapture.cameraPermissionDenied`
- `inventoryCapture.cameraPermissionRequired`
- `inventoryCapture.cameraSectionDescription`
- `inventoryCapture.cameraSectionLabel`
- `inventoryCapture.cancel`
- `inventoryCapture.captureDescription`
- `inventoryCapture.captureHeading`
- `inventoryCapture.capturedImages`
- `inventoryCapture.clearRecording`
- `inventoryCapture.codeLabel`
- `inventoryCapture.editOperationLabel`
- `inventoryCapture.editQuantityLabel`
- `inventoryCapture.editVarietyLabel`
- `inventoryCapture.liveTranscriptLabel`
- `inventoryCapture.liveTranscriptPlaceholder`
- `inventoryCapture.noteLabel`
- `inventoryCapture.modeCameraDescription`
- `inventoryCapture.modeCameraLabel`
- `inventoryCapture.modeTextDescription`
- `inventoryCapture.modeTextLabel`
- `inventoryCapture.modeVoiceDescription`
- `inventoryCapture.modeVoiceLabel`
- `inventoryCapture.noCapturedImages`
- `inventoryCapture.noMatchesError`
- `inventoryCapture.noSuggestionsError`
- `inventoryCapture.noTranscriptAvailable`
- `inventoryCapture.openCamera`
- `inventoryCapture.operationAdd`
- `inventoryCapture.operationDecrement`
- `inventoryCapture.operationRemove`
- `inventoryCapture.processData`
- `inventoryCapture.processing`
- `inventoryCapture.processingError`
- `inventoryCapture.quantityLabel`
- `inventoryCapture.removeAllHint`
- `inventoryCapture.saving`
- `inventoryCapture.scannedGroceryImages`
- `inventoryCapture.scannedReceiptPhotos`
- `inventoryCapture.speechErrorWithType`
- `inventoryCapture.speechGenericError`
- `inventoryCapture.speechNotAvailable`
- `inventoryCapture.speechNotConfigured`
- `inventoryCapture.speechPermissionsRequired`
- `inventoryCapture.speechStartError`
- `inventoryCapture.startRecording`
- `inventoryCapture.stopAndProcess`
- `inventoryCapture.suggestedUpdates`
- `inventoryCapture.textNotesPrompt`
- `inventoryCapture.textPlaceholder`
- `inventoryCapture.textSectionDescription`
- `inventoryCapture.textSectionLabel`
- `inventoryCapture.title`
- `inventoryCapture.transcriptNotesLabel`
- `inventoryCapture.typedNotesLabel`
- `inventoryCapture.varietyLabel`
- `inventoryCapture.varietyNone`
- `inventoryCapture.voiceSectionDescription`
- `inventoryCapture.voiceSectionLabel`

### Keys in hi/ur that are still English
These values are identical to `en.json` and should be translated (unless intentionally left in English):
- `auth.codePlaceholder`
- `onboarding.accessibility.dyslexiaFontName`
- `onboarding.dietary.whole30`
- `onboarding.household.code.placeholder`
- `themes.fifties.name`
- `themes.sixties.name`
- `themes.nineties.name`
- `lists.filterCookAsap`
- `lists.listSummary`

### Email locale support missing hi/ur
Hindi and Urdu are not included in the email locale list or the localized email content. This prevents hi/ur users from receiving translated sign-in emails.
- `i18n/emails/types.ts` (`EmailLocale` union)
- `i18n/emails/signInCodeEmail.ts` (`translations` map + `supportedEmailLocales`)
- `convex/auth.ts` (`isEmailLocale` list + `inferLocaleFromEmail` logic)

## Hardcoded English strings (should move to i18n)
Below are user-visible English strings that are not currently routed through i18n.

### App screens
- `app/tasks/[id].tsx`
  - Titles, button labels, status copy, and alerts like “Task Details”, “Delete Task”, “Loading task…”, “Tap to toggle”, etc.
- `app/qr-scanner.tsx`
  - All permission/status UI copy like “Enable camera & location”, “Scan to verify together”, “Hold the QR code inside the frame to start.”, etc.
- `app/(tabs)/index.tsx`
  - Link preview fallback titles/descriptions in `LINK_PREVIEW_FALLBACKS` (e.g., “Cranberry Chutney”, “Comforting chicken soup…”).
  - These are displayed in the UI when previews fail and should be localized.

### Components
- `components/ImageUpload.tsx`
  - “Enter an image URL…”, “We couldn't fetch that image…”, placeholder and button labels.
- `components/ThemeSwitcher.tsx`
  - Alert title/body strings like “Error”, “Theme applied but failed to save preference…”.
- `components/ThemeCreatorModal.tsx`
  - “Main text content, headings, and labels”, “Secondary text and descriptions”, “Saving…”, “Save Theme” and other inline help text.
- `components/BrandLogo.tsx`
  - Default accessibility label “Haricot logo”.
- `components/PatternDesigner.tsx`
  - Pattern names “Checkerboard”, “Diagonal”, “Plus” (visible in UI list).

### Widgets (native)
- Android widget code and resources:
  - `widgets/native/android/java/HaricotWidgetProvider.kt`
    - “Haricot Pantry”, “Sign in to sync”, “All fresh”, “Expired”, “Use today”, “Ready • … min”, “Missing … • …% stocked”, etc.
  - `widgets/native/android/res/values/strings.xml`
    - “Haricot Widget”, “Haricot inventory and recipe overview”.
  - `widgets/native/android/res/layout/widget_*.xml`
    - `android:text="Haricot Pantry"` in layout files.
- iOS widget code:
  - `widgets/native/ios/HaricotWidget.swift`
    - “Haricot Pantry”, “Updated …”, “Sign in to sync your kitchen”, “Spotlight”, “Cook now”, “Ready to cook…”, “Missing … stocked”, etc.
    - Widget configuration strings `configurationDisplayName`, `description`, plus sample data strings in previews.

### Widget data
- `widgets/data.ts`
  - Storage labels (`pantry`, `fridge`, `freezer`, `spicecabinet`) and freshness labels (`fresh`, `warning`, `expired`, `unknown`) are English strings; if exposed to users, they should be localized.

## Translation correctness review (potential issues)
- Hindi/Urdu translations missing for `inventoryCapture.*` will cause fallback to English if not filled.
- Email translations lack hi/ur coverage entirely (see missing email locale support above).
- Several hi/ur keys are identical to English; these should be verified by a translator.

## Suggestions: break files into smaller pieces for translation review
- **Screen-level splits:** isolate copy-heavy screens into smaller components that map to translation namespaces (e.g., split `app/qr-scanner.tsx` into `QrScannerHeader`, `QrScannerStatus`, `QrScannerPermissions` with dedicated `qrScanner.*` namespace blocks).
- **Widget copy isolation:** move widget strings into shared translation modules (`widgets/i18n/*.ts`) so that both Android/iOS widgets pull from the same source.
- **Theme editor content:** extract long helper text in `components/ThemeCreatorModal.tsx` into a dedicated `themeCreator` content module (or JSON namespace) to separate token/logic from copy.
- **Image upload and task detail:** break `components/ImageUpload.tsx` and `app/tasks/[id].tsx` into a `strings.ts` module (or `i18n` namespace `tasks.*` / `imageUpload.*`) to centralize copy.
- **Link preview fallbacks:** move `LINK_PREVIEW_FALLBACKS` content into translation files so UI copy isn’t embedded in `app/(tabs)/index.tsx`.