# Widget & Share Intake Analysis (NYE 2025)

## Goals
1. **Share from any app with iOS/Android share and process that data into user recipes.**
2. **Home screen widget** that:
   - Shows what a user can eat with what they have in inventory.
   - Lets them quickly add items to inventory.

## Current State (What Exists Today)

### Data + Widget Pipeline (Shared)
- **Widget payload generation** is in `widgets/data.ts`. It builds summary totals, spotlight inventory items, recently added items, and “cookable recipes” based on ingredient matches.
- **Widget syncing** happens in `hooks/useWidgetSync.ts`, which is called on the home tab (`app/(tabs)/index.tsx`). This means widget data updates are tied to the home screen being rendered in-app and **won’t refresh if the app hasn’t been opened**.
- **Native bridge** is in `widgets/bridge.ts`. It serializes payloads and hands them to platform modules (`HaricotWidgetBridge` on iOS or `HaricotWidgetUpdater` on Android).

### iOS Widget
- **Widget extension UI** lives in `widgets/native/ios/HaricotWidget.swift`.
  - Three widget sizes (`systemSmall`, `systemMedium`, `systemLarge`).
  - Shows summary, spotlight inventory, recently added, and “Cook now” recipes.
  - Uses a 15-minute timeline refresh, but **data only changes when app writes shared payload**.
- **Bridge for data**: `widgets/native/ios/HaricotWidgetBridge.swift` uses App Group storage (`group.com.haricotappsyndicate.haricot.widgets`) and stores JSON under `widget_data`.
- **Integration** is handled by the Expo plugin (`plugins/with-haricot-widgets.js`). It copies widget files to `ios/HaricotWidget/` and adds the bridge to the main target. The comment notes **widget extension target must be created manually in Xcode**.

### Android Widget
- **Widget provider** in `widgets/native/android/java/HaricotWidgetProvider.kt`.
  - Layouts for small/medium/large are in `widgets/native/android/res/layout/widget_*.xml`.
  - Loads JSON from shared preferences and renders summary, spotlight, “New”, and “Cook now” sections.
  - Tapping the widget launches the app.
- **Bridge for data**: `widgets/native/android/java/HaricotWidgetUpdaterModule.kt` stores JSON in `SharedPreferences` and triggers a widget refresh broadcast.
- **Android Manifest wiring** is done by the Expo plugin (`plugins/with-haricot-widgets.js`).

### Recipe Ingestion (App-side)
- There is a **universal recipe ingestion action** (`convex/recipes.ts`, `ingestUniversal`) that takes a source URL and optional text. It is currently called from the home screen ingest UI in `app/(tabs)/index.tsx`.
- There is **no platform share extension or share intent handler** in the repo today.

## Gap Analysis vs Goals

### Goal 1: Share from any app ➜ process ➜ add to recipes

**What’s missing**
- No iOS Share Extension target (NSExtension) is present.
- No Android intent filters or share receiver activity are configured.
- There’s no shared “ingest queue” or background handoff between a share entry point and the in-app ingestion workflow.

**What we need to add**
1. **iOS Share Extension target**
   - Add a Share Extension (NSExtension) that handles URLs, text, and optionally images.
   - Use the existing **App Group** (`group.com.haricotappsyndicate.haricot.widgets`) or create a dedicated one to pass data from the extension to the main app.
   - Write shared payloads to App Group UserDefaults or a shared file, then open the main app with a deep link (e.g., `haricot://ingest`).
   - Handle the short extension execution window by deferring heavy work to the main app.

2. **Android Share Receiver**
   - Add intent filters for `ACTION_SEND`, `ACTION_SEND_MULTIPLE`, and `ACTION_PROCESS_TEXT` on a dedicated `ShareActivity` (or `MainActivity` if routing is straightforward).
   - Parse `EXTRA_TEXT`, `EXTRA_STREAM`, and `text/plain` URLs.
   - Store payloads locally (shared prefs or sqlite/kv) and forward the user into the app’s ingest flow.

3. **Shared ingestion queue + UI**
   - Create a **local or Convex-backed “share queue”** that keeps share payloads until the user confirms ingestion.
   - Build a lightweight “Pending Imports” screen that previews URLs/text and allows the user to submit to `ingestUniversal`.
   - Ensure auth state gating: if the user isn’t signed in, queue items locally and prompt sign-in first.

4. **Deep-link routing and ingest flow**
   - Add a route (e.g., `app/ingest` or `app/imports`) that can be opened via deep links.
   - The route should immediately read queued share items and start the ingestion pipeline or ask for confirmation.

5. **Error handling and deduping**
   - De-dupe by URL and/or content hash so repeated shares don’t create duplicate recipes.
   - Surface parsing errors and allow retry from the queued list.

---

### Goal 2: Widget shows “what they can eat” + quick add to inventory

**What’s already covered**
- The widget payload already includes **cookable recipes** computed from inventory codes in `widgets/data.ts` and shown as “Cook now” in both iOS and Android widgets.

**Current limitations**
- Widget data only updates when the home screen runs `useWidgetSync` (`app/(tabs)/index.tsx`). If the app isn’t opened, the widget can go stale.
- When there are **no inventory items**, `useWidgetSync` does not write a payload, so the widget can’t render “cookable recipes” or “add inventory” prompts.
- The widget has **no interactive actions** besides tapping the widget to open the app.

**What we need to add**
1. **More reliable refresh cadence**
   - Add background refresh via Expo background tasks or push notifications to refresh widget data without requiring a home screen session.
   - Consider a small server-triggered “widget payload update” on inventory change so the widget doesn’t lag.

2. **Quick add affordances**
   - **iOS:** add tappable entries / buttons via widget deep links (e.g., `haricot://inventory/add`, `haricot://inventory/scan`). If we want true in-widget actions, iOS 17 AppIntents would be required.
   - **Android:** add one or two `PendingIntent` buttons (e.g., “Add item”, “Scan barcode”) to widget layouts.

3. **Empty-state that supports adding inventory**
   - When no inventory items exist, render a widget state that invites the user to add items and deep-links to the add flow.

4. **Recipe suggestions from inventory**
   - Ensure the widget receives a **minimal recipe list** even if the user is on another tab. Today the widget only updates when `recipes` and `inventoryItems` are loaded on the home screen.
   - Consider a lightweight widget-specific recipe query so cookable suggestions are always available.

## Implementation Considerations
- **Expo prebuild:** the widget plugin already copies native files, but iOS requires manual Widget Extension target setup. A Share Extension would similarly need explicit native project updates (or a new config plugin to automate it).
- **Security & privacy:** share payloads can include private URLs/text; storage should be scoped to the authenticated user and cleared after ingestion.
- **Localization:** widget strings are currently hard-coded in native code; if the widget is expanded, consider moving copy into shared i18n so the widget UI and app stay aligned.

## Summary
- **Widgets are implemented** and already show inventory + recipe suggestions, but updates are app-session dependent and there’s no quick-add support.
- **Share intake is not implemented** on either platform, but the backend ingestion pipeline exists and can be wired to native share entry points.
- Implementing the goals requires **native share entry points, a shared ingestion queue UI, and widget quick actions + refresh strategy**.
