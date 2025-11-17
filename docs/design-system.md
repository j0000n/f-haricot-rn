# Haricot Design System

This document explains how to work with the shared design tokens and the custom
font stack that power the Haricot application.

## Token sources

All primitives live in [`styles/tokens.ts`](../styles/tokens.ts). Tokens are
organised into the following groups:

- `colors` – semantic surface, background, accent, success, and danger colours.
- `spacing` – the only valid spacing scale for padding and margins.
- `iconSizes` – dedicated scale for glyph sizing so iconography stays visually
  balanced without overloading the spacing tokens.
- `radii` – small, medium, and large border radius values. Use these for rounded
  corners and ensure new components pick from the scale rather than inventing
  new radii.
- `typography` – canonical font sizes for display text, headings, body copy,
  and supporting text.
- `fontFamilies` – font family aliases mapped to the Haricot custom font
  variants. Import these instead of string literals when assigning the
  `fontFamily` style property.
- `layout` and `shadows` – shared layout constants and elevation presets.

When a new stylistic need appears, extend the relevant token object first and
reference the new property from your styles. Never sprinkle raw numbers or hex
values through component files.

### Theme architecture

Multiple colour palettes now coexist through the theme definitions declared in
[`styles/themes/index.ts`](../styles/themes/index.ts). Each entry bundles a
complete token set plus the logo artwork that represents that theme. The current
themes include **Sunrise**, **Midnight**, **Classic**, **1950s**, **1960s**,
**1990s**, **Black Metal**, and the new **Springfield** option—each with its own
wordmark loaded from `theme.assets.logo`. The
[`ThemeProvider`](../styles/tokens.ts) exposes the active theme via React
context so screens can re-render when a user switches between the options from
the onboarding flow or profile settings.

Use the `useThemedStyles` helper exported from `styles/tokens.ts` to generate
StyleSheets from the live token set instead of importing static objects. This
keeps existing styles in sync when the user toggles their preferred theme from
the onboarding flow or profile screen.

### Springfield theme

The Springfield theme channels the pastel cabinetry and bold appliances from the
Evergreen Terrace kitchen. Its palette leans on periwinkle walls (`#8CA1C6`),
plum cabinets (`#987AA5`), citrus trim (`#C78C2C`), and the iconic stove orange
(`#CC480F`) for accents, with OpenDyslexic Bold handling the display lettering
and W95FA reinforcing header treatments. The custom logo lives at
[`assets/images/springfield-logo.svg`](../assets/images/springfield-logo.svg)
and the font assignments flow through the `fontFamilies.display` and
`fontFamilies.semiBold` tokens in
[`styles/themes/springfield.ts`](../styles/themes/springfield.ts).

## Custom font workflow

Haricot uses custom typefaces (Peignot, East Market NF, and Metaloxcide for
display text plus Source Sans Pro for body copy) so the app renders consistently
across platforms. Fonts are loaded in
[`app/_layout.tsx`](../app/_layout.tsx) with `useFonts` from `expo-font` and
configured in `app.json` via the `expo-font` plugin. Each variant is registered
under a descriptive name (e.g. `Peignot`, `East Market NF`, `OpenDyslexic`) which
is then referenced through the `fontFamilies` token map.

To add another weight or a different typeface variant:

1. Place the font file in `assets/fonts/`.
2. Add the font path to the `expo-font` plugin configuration in `app.json`.
3. Register the file inside the `useFonts` call in `_layout.tsx` using `require()`.
4. Expose a new alias in `fontFamilies` inside `styles/tokens.ts`.
5. Update affected styles to use the alias instead of hard-coded family names or
   `fontWeight` values.
6. Run `npx expo prebuild` or restart your dev server with `npx expo start -c`.

## Accessibility preferences

Users can now configure accessibility typography during onboarding. The theme
context stores these preferences:

- **Base text size** – scales the `typography` token values by preset factors
  for large and extra-large copy.
- **Dyslexia-friendly font** – swaps the body font family aliases to the
  OpenDyslexic typeface while keeping the display face from the selected theme.
- **High contrast modes** – overrides the active palette with the dedicated
  high-contrast token sets whenever the toggle is enabled. People can now pick
  between **High Contrast Dark** (optimized for night viewing) and **High
  Contrast Light** (bright surfaces with bold outlines). The theme switcher will
  confirm before disabling the preference if another palette is selected.
- **Motion preference** – honours the device-level reduced motion setting by
  default and allows people to explicitly choose between system, reduced, or
  standard motion. Components should consult `prefersReducedMotion` from the
  theme context before opting into animated effects.

The [`ThemeProvider`](../styles/themeContext.tsx) merges these selections with
the active theme tokens so existing StyleSheets automatically render with the
appropriate sizes and fonts.

## Using the token preview workbench

The root of the repo now contains `design-tokens-preview.html`. Open the file in
any desktop browser to experiment with colours, spacing, radii, and typography
settings. Adjustments in the left-hand control panel immediately update the
right-hand preview so designers and engineers can share the same reference.

When you arrive at a configuration worth keeping, port the numbers back into
`styles/tokens.ts` and commit them alongside a short note in this document.

## Custom navigation tabs

The authenticated experience now uses a custom bottom tab layout built with
[`expo-router/ui`](https://docs.expo.dev/router/advanced/custom-tabs/). The tab
container is styled in [`styles/tabLayoutStyles.ts`](../styles/tabLayoutStyles.ts)
with the existing design tokens:

- `radii.lg` defines the pill outline of the tab bar while `radii.md` rounds each
  trigger button.
- `colors.surface`, `colors.border`, and `shadows.card` give the bar a floating
  appearance above the background.
- Active states rely on `colors.accent` and `colors.accentOnPrimary` so the
  highlighted tab matches the rest of the system accents.

Each screen inside the tab navigator reuses the standard header spacing and
background treatments to keep the navigation chrome consistent between Home,
Kitchen, and Profile views.

The authenticated experience uses a custom bottom tab layout built with
[`expo-router/ui`](https://docs.expo.dev/router/advanced/custom-tabs/). Styling
now comes from the `components.tabBar` token group declared inside each theme
definition so visual treatments stay aligned when users switch palettes. The
tab-specific tokens cover:

- **Container** – `containerBackground` and `slotBackground` keep the chrome in
  sync with the theme background.
- **List** – spacing, borders, and optional `shadow` preset applied to the
  `TabList` wrapper. Setting `shadow` to `null` removes elevation for flatter
  themes.
- **Trigger** – padding, minimum height, shape, and active/inactive background
  colours for each tab button. Themes can opt into `"pill"` or `"square"`
  triggers. Square variants may also provide a `squareSize` to clamp the icon
  button width/height using an existing layout token.
- **Label** – whether the text label is rendered alongside its colour treatment
  and letter spacing when icons are also visible.
- **Icon** – optional icon family, size, colours, and per-tab glyph names for
  themes that prefer pictographic navigation. The `size` property should come
  from the `iconSizes` scale to avoid coupling glyph dimensions to layout
  spacing.

[`styles/tabLayoutStyles.ts`](../styles/tabLayoutStyles.ts) reads the token set at
runtime so changing themes swaps the layout without duplicating styles. The
Sunrise and Midnight themes keep the original pill buttons with uppercase
labels, while the Black Metal theme switches to full-bleed square buttons that
display Feather icons instead of text. The square buttons reuse the `fabSize`
layout token via `squareSize` so they stay compact across devices.

## Kitchen inventory controls

The Kitchen screen now supports both list and grid inventory layouts. The view
switcher is styled as a segmented control with `colors.surface` and
`borderWidths.thin` framing the toggle while the active option uses
`colors.accent` and `colors.accentOnPrimary` for contrast. A matching "Sort by"
trigger reuses the same border treatment, expanding into a `shadows.card`
popover so the available ordering options (location, quantity, purchase date)
stay consistent with the rest of the system menus. Location filters are rendered
as pill buttons that flip between `colors.surface` and `colors.accent`, letting
users drill into Fridge, Freezer, Pantry, or Spice Cabinet items quickly.

List view now renders inside a `borderWidths.thin` table shell with a muted
header row and uppercase `letterSpacing.tight` labels. Rows stack the emoji-rich
item name above its storage location, and the quantity plus purchase date each
use the `typography.small` tokens for scannability. Grid cards inherit the
existing `shadows.card` elevation and `radii.md` rounding, with a muted metadata
bar showing the purchase date alongside a pill for the quantity, before the
image, variety, and supporting rows for days-old and location details. The view
toggle remains a segmented control but is now docked on the right edge of the
toolbar so it mirrors the latest mockups while the "Sort by" dropdown stays on
the left. Grid cards flow two-up on handheld breakpoints (48% flex basis with
shared gutters) so more than one ingredient stays visible without scrolling.

## Home recipe search field

The home screen now opens with a recipe search block so users can jump straight
to the meal they want. The label uses the uppercase `typography.small` value and
`letterSpacing.tight` to match the rest of the dashboard accents, while the text
input pulls its shape from `radii.sm` and border treatment from
`borderWidths.thin` plus `colors.border`. Search suggestions render inside a
`colors.surface` card with the same border radius to keep the preview tray
aligned with other list treatments. The "View all results" button swaps to the
accent colour token so the call to action reads as primary, and its label also
adopts the uppercase small style for consistency. Any additional search-related
components should continue drawing directly from the spacing, typography, and
colour tokens introduced here.

## Household management card

The profile screen now opens with a household invitation card that highlights
the active household code and member roster. The card reuses the standard
surface container treatment (`surface` background, `border` stroke, `shadows.card`
elevation) to match the existing appearance and accessibility sections. Inline
actions—copying the invite code, confirming pending members, updating the code,
or leaving the household—reuse the accent colour for primary buttons and the
`danger` semantic for destructive actions. Text elements follow the small and
tiny typography tokens to keep supporting guidance readable without competing
with the core settings.

## Allergy chips and child management

Household allergy lists and child records now render as chip clusters that use
the `overlay` fill, `border` stroke, and `radii.lg` tokens so they read as soft
capsules alongside the rest of the profile card treatments. Inline add buttons
reuse the accent button style while the surrounding inputs stick to
`borderWidths.thin` and the standard body typography for consistency. Removing
an entry keeps the destructive colour locked to the text label rather than
redrawing entire chips, maintaining legibility against light and dark themes.

The add/manage forms share the same `inlineInputRow` layout to keep text fields
and buttons aligned on small screens. Each child card inherits the surface
container treatment from the parent card, and destructive actions remain styled
with the `danger` outline to reinforce the irreversible nature of removals.

## Pending approval modal

When a new member requests to join a household, a modal now interrupts the
profile flow with a focused confirmation surface. The scrim applies the
`overlay` colour so the background softens without obscuring the current theme.
The modal container reuses the standard surface, border, and `shadows.card`
tokens plus the large radius to match onboarding cards. Buttons mirror the
accent and neutral treatments found elsewhere, keeping the approval experience
visually consistent with the broader management controls.
