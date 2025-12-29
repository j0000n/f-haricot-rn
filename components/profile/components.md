# Profile components

## Overview
The Profile screen UI is broken into smaller components under `components/profile/` to keep `app/profile.tsx` focused on data and state management.

## Components
- `ProfileHeader` — renders the signed-in email and Haricot logo.
- `PendingMembersModal` — modal UI for approving pending household members.
- `HouseholdCard` — household invite, members, management, allergy, and child management UI.
- `HouseholdAllergiesSection` — allergy chips and editing controls inside the household card.
- `HouseholdChildrenSection` — child list, editor, and add-child flow inside the household card.
- `NutritionGoalsCard` — nutrition goal presets, categories, targets, and save action.
- `AppearanceCard` — theme selection section.
- `LanguageCard` — language selection section.
- `AccessibilityCard` — accessibility preferences (text size, contrast, dyslexia, motion).
- `ProfileInfoCard` — read-only profile data panel.
- `types` — shared lightweight types for household-related data used by profile components.
