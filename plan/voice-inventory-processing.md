# Voice Inventory Processing Plan

## Purpose
Document the current voice → inventory flow and capture product requirements to fix mis-mappings (e.g., “oreo cookies” → cookies, “navel oranges” → apples), plus define editing/deleting behaviors.

## Current Flow (As Implemented)

### 1) Capture modes & transcript assembly (client)
- Screen: `app/add-task.tsx` (`AddInventoryModal`)
- Capture modes: camera, voice, text (`CaptureMode` state).
- Voice transcript pipeline:
  - `useSpeechRecognitionEvent("result")` appends final speech segments into `transcriptRef` and shows `interimText` live.
  - `handleStartListening()` starts native speech recognition (`getSpeechRecognitionModule`).
  - `handleStopListening()` stops recognition and triggers processing.
- Text/camera pipeline:
  - `mockOpenAIProcessing` synthesizes a transcript from manual text or captured images.
  - `handleProcessData()` merges speech + manual text into a single transcript string and sends it to `mapSpeechToInventory`.

### 2) Transcript → inventory suggestions (server)
- Convex action: `convex/inventory.ts` → `mapSpeechToInventory`.
- Uses `foodLibrary.listAll` to build a catalog of item names, aliases, translations, varieties (`buildLibraryDescriptors`).
- Sends transcript + catalog to OpenAI (`gpt-4o-mini`) with a JSON schema (items, quantities, varietyCode, note).
- Parses response, validates:
  - Checks item codes against the library.
  - If missing, creates a provisional entry (`foodLibrary.ensureProvisional`).
  - Validates `varietyCode` against library varieties; drops invalid varieties with a warning.

### 3) Apply suggestions to inventory (server)
- Convex mutation: `convex/inventory.ts` → `applyInventoryUpdates`.
- Adds quantities to existing entries or creates new ones in `households.inventory`.
- Ensures provisional entries for unknown codes.
- No support for edit/delete of suggestions or inventory entries in this flow.

### 4) UI suggestions & submission (client)
- `app/add-task.tsx` renders a list of suggested updates.
- No editing/deleting in the suggestion review UI.
- Pressing “Apply” posts suggestions to `applyInventoryUpdates`.

### 5) Storage model
- Inventory is stored on households (`convex/households.ts`, `convex/schema.ts`).
- Entries include `itemCode`, optional `varietyCode`, `quantity`, `purchaseDate`, and optional `note`.

## Observed Issues (Current Behavior)
- Mis-mapping of compound items like “oreo cookies” and “navel oranges.”
- Insufficient distinction between brand-item entries vs. generic categories.
- No user control to adjust suggestions before applying updates.
- No delete/decrement handling in the current flow.

## Decisions & Requirements (From Product Input)

### Parsing & Intent
- Brand+item phrases (e.g., “oreo cookies”) should be **their own entries** in the food library.
- “Navel oranges” should be a **variety** of oranges.
- Adjectives like “navel,” “organic,” “large” should map to **variety codes** (not notes).
- Multi-item utterances should produce **separate entries** (e.g., “oreo cookies and navel oranges” → two items).

### Catalog & Matching
- Expand the catalog with **brand aliases** and **brand-specific entries**.
- Matching should be **accurate but tolerant**:
  - “Macintosh,” “Honeycrisp,” “Granny Smith” → varieties of apple.
  - “Tate’s chocolate chip cookies” and “oreo cookies” → separate library entries.
- When conflicts occur (multiple possible matches):
  - Show “Did you mean…?” in the review UI and allow explicit selection.

### Editing & Deleting
- Edits should allow: **variety, quantity, notes**.
- Deletions should support **both**:
  - Absolute removal of an item.
  - Relative decrement of quantity.

### Confirmation & UX
- Require user confirmation when the model is uncertain.
- Surface confidence or highlight mismatches to prevent incorrect adds.

### Data Model
- No need to store raw transcript or mapping metadata for auditing/undo.

## Open Questions / Design Work Needed

### 1) Suggestion Review UX
- How should the “Did you mean…?” flow be presented (e.g., inline dropdown, modal, side panel)?
- Should edits happen per suggestion card before apply, or in a batch review step?
- What confidence thresholds trigger confirmation prompts?

### 2) Parsing & Matching Enhancements
- How should the system handle phrases that include multiple adjectives (e.g., “organic large navel oranges”)?
- Should “brand-only” entries be treated differently from commodity categories during matching?

### 3) Inventory Mutations
- Should edits update quantity in place or generate deltas?
- Should delete/decrement operations be available both in the add-task flow and in the kitchen inventory list?

## Proposed Next Steps (Non-Code)
1. Define catalog expansion rules for brand entries and variety mappings.
2. Specify the exact suggestion review UI for conflict resolution and edits.
3. Decide the deletion/edit semantics for inventory updates (absolute vs. decrement, per-item UI placement).
4. Outline confidence thresholds and mismatch highlighting behavior.
