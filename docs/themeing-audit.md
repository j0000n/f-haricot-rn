# Theming System Audit & Recommendations

## Executive Summary

The current theming system uses global spacing/padding/radii tokens that cause unintended side effects when users customize themes. Changing a single token value (e.g., `spacing.sm`) affects hundreds of components simultaneously, making theme customization unpredictable and difficult.

**Key Finding**: The system needs to transition from **global token-based styling** to **component-semantic styling** where theme properties are defined at the component level.

---

## Current System Architecture

### Token Structure

The current `ThemeTokens` type defines:

- **Global spacing scale**: `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl` (used for margins, gaps, padding)
- **Global padding scale**: `screen`, `section`, `card`, `compact` (used inconsistently)
- **Global radii scale**: `sm`, `md`, `lg` (used for all rounded corners)
- **Component tokens**: Only `tabBar` has component-level tokens

### Usage Pattern

Components directly reference global tokens:
```typescript
// Example from homeStyles.ts
padding: tokens.spacing.lg,
marginBottom: tokens.spacing.sm,
borderRadius: tokens.radii.md,
```

**Problem**: When a user changes `spacing.sm` from 12px to 24px in ThemeCreatorModal, it affects:
- Card margins
- Button padding
- List item gaps
- Header spacing
- And 100+ other places

---

## Audit Findings

### 1. Spacing Token Usage

**Count**: 418+ direct references to `tokens.spacing.*` across 11 style files

**Common Patterns**:
- `tokens.spacing.sm` - Used for gaps, margins, padding (found in cards, buttons, lists, headers)
- `tokens.spacing.md` - Used for card padding, section spacing, list item spacing
- `tokens.spacing.lg` - Used for section margins, header padding, empty states
- `tokens.spacing.xs` - Used for tight spacing, icon gaps, compact elements
- `tokens.spacing.xxs` - Used for minimal spacing, text margins

**Impact**: Changing any spacing value cascades across:
- Layout spacing (sections, headers)
- Component internal spacing (cards, buttons)
- List/grid gaps
- Form element spacing

### 2. Padding Token Usage

**Count**: ~50+ references to `tokens.padding.*`

**Current Tokens**:
- `padding.screen` - Main container padding
- `padding.section` - Section grouping padding
- `padding.card` - Card internal padding
- `padding.compact` - Minimal padding

**Issues Found**:
- Inconsistent usage: Some components use `tokens.spacing.md` for padding instead of `tokens.padding.card`
- Mixed semantics: `padding.screen` sometimes used where `padding.section` should be
- Example: `homeStyles.ts` uses `tokens.spacing.lg` for header padding instead of semantic padding

### 3. Radii Token Usage

**Count**: ~80+ references to `tokens.radii.*`

**Current Tokens**:
- `radii.sm` - Small rounded corners (buttons, pills, inputs)
- `radii.md` - Medium rounded corners (cards, containers)
- `radii.lg` - Large rounded corners (modals, major containers)

**Problem**: Cannot differentiate between:
- Card corner radius vs button corner radius
- Input field radius vs badge radius
- All share the same 3-token scale

### 4. Component-Level Tokens

**Current State**: Only `tabBar` has component-level tokens

**Missing Component Tokens**:
- Cards (StandardCard, DetailedCard, CompactCard)
- Buttons (primary, secondary, text buttons)
- Inputs (text inputs, search bars)
- Lists (list items, list containers)
- Headers (page headers, section headers)
- Badges/Pills (filter pills, status badges)

---

## Component-by-Component Audit

### Cards (`components/cards/`)

**Files Audited**:
- `StandardCard.tsx`
- `DetailedCard.tsx`
- `CompactCard.tsx`

**Current Token Usage**:
```typescript
// StandardCard.tsx
borderRadius: tokens.radii.sm,        // ← Shared with buttons, pills
padding: tokens.padding.card,          // ← Semantic (good!)
marginLeft: tokens.spacing.xxs,        // ← Global token (bad)
marginBottom: tokens.spacing.xxs,      // ← Global token (bad)
```

**Issues**:
- Card spacing uses global `spacing.xxs` instead of semantic `card.margin` or `card.gap`
- Border radius shared with buttons/pills - cannot style independently
- No way to adjust card-specific spacing without affecting other components

**Recommendation**: Add `components.card` tokens:
```typescript
components: {
  card: {
    padding: number,
    borderRadius: number,
    gap: number,              // Gap between card elements
    margin: number,           // Margin between cards
    imageHeight: number,      // Card image height
  }
}
```

### Buttons

**Files Audited**:
- `homeStyles.ts` (seedButton, logoutButton, onboardingButton)
- `addTaskStyles.ts` (actionButton, primaryButton, micButton)
- `kitchenStyles.ts` (viewToggleButton, filterPill)

**Current Token Usage**:
```typescript
// Multiple button styles across files
paddingHorizontal: tokens.spacing.lg,   // ← Varies: lg, md, sm
paddingVertical: tokens.spacing.sm,     // ← Varies: sm, xs
borderRadius: tokens.radii.sm,         // ← Shared with cards, pills
```

**Issues**:
- No consistent button sizing system
- Button padding uses global spacing (side effects)
- Cannot style primary vs secondary buttons independently
- Pill buttons share radii with cards

**Recommendation**: Add `components.button` tokens:
```typescript
components: {
  button: {
    primary: {
      paddingHorizontal: number,
      paddingVertical: number,
      borderRadius: number,
      fontSize: number,
    },
    secondary: { ... },
    pill: {
      paddingHorizontal: number,
      paddingVertical: number,
      borderRadius: number,  // Independent from cards
    },
    text: { ... },
  }
}
```

### Lists

**Files Audited**:
- `kitchenStyles.ts` (listRow, listCell, listHeaderRow)
- `listDetailStyles.ts` (listCard, listItem)

**Current Token Usage**:
```typescript
// kitchenStyles.ts
paddingHorizontal: tokens.spacing.md,  // ← Shared with cards, buttons
paddingVertical: tokens.spacing.md,     // ← Shared with cards, buttons
gap: tokens.spacing.md,                 // ← Affects all gaps globally
borderRadius: tokens.radii.md,         // ← Shared with cards
```

**Issues**:
- List item spacing uses global tokens
- Cannot adjust list row height independently
- List card spacing affects card spacing elsewhere

**Recommendation**: Add `components.list` tokens:
```typescript
components: {
  list: {
    itemPadding: { horizontal: number, vertical: number },
    itemGap: number,
    borderRadius: number,
    headerPadding: { horizontal: number, vertical: number },
  }
}
```

### Headers

**Files Audited**:
- `homeStyles.ts` (header, title, sectionTitle)
- `kitchenStyles.ts` (header, title)
- `listDetailStyles.ts` (header, title)

**Current Token Usage**:
```typescript
// homeStyles.ts
paddingTop: tokens.layout.headerTopPadding,  // ← Semantic (good!)
paddingHorizontal: tokens.spacing.lg,        // ← Global token (bad)
paddingBottom: tokens.spacing.sm,            // ← Global token (bad)
marginBottom: tokens.spacing.xs,             // ← Global token (bad)
```

**Issues**:
- Header padding mixes semantic (`layout.headerTopPadding`) with global (`spacing.lg`)
- Section title margins use global spacing
- Cannot style page headers vs section headers independently

**Recommendation**: Add `components.header` tokens:
```typescript
components: {
  header: {
    page: {
      paddingTop: number,
      paddingHorizontal: number,
      paddingBottom: number,
      gap: number,
    },
    section: {
      marginBottom: number,
      gap: number,
    }
  }
}
```

### Inputs & Forms

**Files Audited**:
- `homeStyles.ts` (searchInput)
- `addTaskStyles.ts` (transcriptBox, input styles)

**Current Token Usage**:
```typescript
// homeStyles.ts
paddingHorizontal: tokens.spacing.md,  // ← Shared globally
paddingVertical: tokens.spacing.xs,    // ← Shared globally
borderRadius: tokens.radii.sm,         // ← Shared with buttons, cards
```

**Issues**:
- Input padding uses global spacing
- Border radius shared with buttons/cards
- No distinction between text inputs, search bars, text areas

**Recommendation**: Add `components.input` tokens:
```typescript
components: {
  input: {
    paddingHorizontal: number,
    paddingVertical: number,
    borderRadius: number,
    fontSize: number,
    gap: number,  // Gap between label and input
  },
  textArea: {
    minHeight: number,
    padding: number,
    borderRadius: number,
  }
}
```

### Rails & Sections

**Files Audited**:
- `components/Rail.tsx`
- `components/RecipeRail.tsx`

**Current Token Usage**:
```typescript
// Rail.tsx
paddingHorizontal: tokens.padding.card,     // ← Semantic (good!)
marginBottom: tokens.spacing.sm,            // ← Global token (bad)
gap: tokens.spacing.xxs,                    // ← Global token (bad)
```

**Issues**:
- Rail spacing uses global tokens
- Cannot adjust rail header spacing independently
- "See All" button styling tied to global tokens

**Recommendation**: Add `components.rail` tokens:
```typescript
components: {
  rail: {
    headerGap: number,
    headerMarginBottom: number,
    cardGap: number,
    scrollPadding: number,
  }
}
```

---

## ThemeCreatorModal Analysis

### Current Editor Structure

The `ThemeCreatorModal` currently allows editing:

1. **Colors** ✅ - Well-organized by semantic groups (Background, Text, Interactive, Status)
2. **Spacing** ❌ - Global scale editing (causes side effects)
3. **Padding** ❌ - Global scale editing (causes side effects)
4. **Radii** ❌ - Global scale editing (causes side effects)
5. **Typography** ✅ - Appropriate (font sizes per semantic role)
6. **Fonts** ✅ - Appropriate (font families per semantic role)
7. **TabBar** ✅ - Component-level editing (good example!)

### Problems with Current Editor

**Spacing Section** (lines 1032-1061):
- Users edit `xxs`, `xs`, `sm`, `md`, `lg`, `xl`, `xxl` globally
- No indication of where these values are used
- Changing `sm` affects 100+ places simultaneously
- Description says "control gaps between elements" but also affects padding, margins

**Padding Section** (lines 1063-1091):
- Users edit `screen`, `section`, `card`, `compact` globally
- But many components use `spacing.*` for padding instead
- Inconsistent usage makes theme editing unpredictable

**Radii Section** (lines 1093-1138):
- Users edit `sm`, `md`, `lg` globally
- Cannot differentiate card radius from button radius
- All rounded elements change together

### User Experience Issues

1. **Unpredictable Changes**: User changes `spacing.sm` expecting to adjust card spacing, but buttons and lists also change
2. **No Visual Feedback**: No way to see which components are affected by a token change
3. **Semantic Confusion**: Editing "Spacing" doesn't clearly indicate it affects padding, margins, and gaps
4. **Component Independence**: Cannot style cards vs buttons vs lists independently

---

## Recommendations

### Phase 1: Component Token Architecture

**Goal**: Migrate from global tokens to component-semantic tokens

#### 1.1 Extend ThemeTokens Type

Add component-level tokens to `styles/themes/types.ts`:

```typescript
export type ThemeTokens = {
  // ... existing tokens ...
  
  components: {
    tabBar: TabBarTokens;  // Already exists
    
    // NEW COMPONENT TOKENS
    card: {
      padding: number;
      borderRadius: number;
      gap: number;              // Gap between card elements
      margin: number;            // Margin between cards
      imageHeight: number;       // Card image height
    };
    
    button: {
      primary: {
        paddingHorizontal: number;
        paddingVertical: number;
        borderRadius: number;
        fontSize: number;
      };
      secondary: {
        paddingHorizontal: number;
        paddingVertical: number;
        borderRadius: number;
        fontSize: number;
      };
      pill: {
        paddingHorizontal: number;
        paddingVertical: number;
        borderRadius: number;
      };
      text: {
        paddingHorizontal: number;
        paddingVertical: number;
      };
    };
    
    list: {
      itemPadding: { horizontal: number; vertical: number };
      itemGap: number;
      borderRadius: number;
      headerPadding: { horizontal: number; vertical: number };
    };
    
    header: {
      page: {
        paddingTop: number;
        paddingHorizontal: number;
        paddingBottom: number;
        gap: number;
      };
      section: {
        marginBottom: number;
        gap: number;
      };
    };
    
    input: {
      paddingHorizontal: number;
      paddingVertical: number;
      borderRadius: number;
      fontSize: number;
      labelGap: number;
    };
    
    textArea: {
      minHeight: number;
      padding: number;
      borderRadius: number;
    };
    
    rail: {
      headerGap: number;
      headerMarginBottom: number;
      cardGap: number;
      scrollPadding: number;
    };
  };
};
```

#### 1.2 Migration Strategy

**Step 1**: Keep global tokens for backward compatibility, but mark as deprecated
**Step 2**: Create component token defaults based on current global tokens
**Step 3**: Migrate components one-by-one to use component tokens
**Step 4**: Update ThemeCreatorModal to edit component tokens instead

#### 1.3 Component Token Defaults

In `styles/themes/types.ts`, create default component tokens derived from base tokens:

```typescript
export const baseComponentTokens = {
  card: {
    padding: basePadding.card,
    borderRadius: baseRadii.md,
    gap: baseSpacing.xs,
    margin: baseSpacing.xs,
    imageHeight: 120,
  },
  button: {
    primary: {
      paddingHorizontal: baseSpacing.lg,
      paddingVertical: baseSpacing.sm,
      borderRadius: baseRadii.sm,
      fontSize: baseTypography.body,
    },
    // ... other button variants
  },
  // ... other components
};
```

### Phase 2: Update ThemeCreatorModal

**Goal**: Edit component properties instead of global scales

#### 2.1 New Editor Structure

Replace global spacing/padding/radii editors with component editors:

**Current**:
```
Spacing
  - xxs: [slider]
  - xs: [slider]
  - sm: [slider]
  ...
```

**Proposed**:
```
Cards
  - Padding: [slider]
  - Border Radius: [slider]
  - Gap Between Elements: [slider]
  - Margin Between Cards: [slider]

Buttons
  - Primary Button Padding: [slider]
  - Button Border Radius: [slider]
  - Pill Button Padding: [slider]
  ...

Lists
  - Item Padding: [slider]
  - Item Gap: [slider]
  - Border Radius: [slider]
  ...
```

#### 2.2 Component Preview

Add live preview for each component section:
- Cards section shows a card preview
- Buttons section shows button variants
- Lists section shows list item preview

#### 2.3 Keep Global Tokens (Optional)

For advanced users, keep global tokens as an "Advanced" section:
- Hidden by default
- Warns about side effects
- Provides reset to defaults option

### Phase 3: Component Migration

**Goal**: Update all components to use component tokens

#### 3.1 Migration Order

1. **Cards** (lowest impact, most visible)
   - Update `StandardCard.tsx`, `DetailedCard.tsx`, `CompactCard.tsx`
   - Update card usage in `Rail.tsx`, `RecipeRail.tsx`

2. **Buttons** (high visibility)
   - Update button styles in `homeStyles.ts`, `addTaskStyles.ts`, `kitchenStyles.ts`
   - Update filter pills, view toggles

3. **Lists** (medium impact)
   - Update `kitchenStyles.ts` list styles
   - Update `listDetailStyles.ts` list styles

4. **Headers** (low impact)
   - Update header styles across all screen styles

5. **Inputs** (low impact)
   - Update input styles in `homeStyles.ts`, `addTaskStyles.ts`

6. **Rails** (low impact)
   - Update `Rail.tsx`, `RecipeRail.tsx`

#### 3.2 Migration Pattern

For each component:

**Before**:
```typescript
padding: tokens.spacing.lg,
borderRadius: tokens.radii.md,
marginBottom: tokens.spacing.sm,
```

**After**:
```typescript
padding: tokens.components.card.padding,
borderRadius: tokens.components.card.borderRadius,
marginBottom: tokens.components.card.margin,
```

### Phase 4: Update Theme Definitions

**Goal**: All built-in themes use component tokens

#### 4.1 Update Theme Files

Update each theme file in `styles/themes/` to include component tokens:

```typescript
// styles/themes/blackMetal.ts
export const blackMetalTheme: ThemeDefinition = {
  // ... existing ...
  tokens: {
    // ... existing tokens ...
    components: {
      card: {
        padding: 8,           // Override default
        borderRadius: 0,       // Sharp corners for black metal
        gap: 4,
        margin: 4,
        imageHeight: 120,
      },
      button: {
        primary: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 0,     // Sharp corners
          fontSize: 16,
        },
        // ... other variants
      },
      // ... other components
    },
  },
};
```

#### 4.2 Migration Helper

Create a helper function to generate component tokens from global tokens (for backward compatibility during migration):

```typescript
function generateComponentTokensFromGlobal(
  spacing: ThemeTokens['spacing'],
  padding: ThemeTokens['padding'],
  radii: ThemeTokens['radii']
): ThemeTokens['components'] {
  return {
    card: {
      padding: padding.card,
      borderRadius: radii.md,
      gap: spacing.xs,
      margin: spacing.xs,
      imageHeight: 120,
    },
    // ... map other components
  };
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
- [ ] Extend `ThemeTokens` type with component tokens
- [ ] Create base component token defaults
- [ ] Update all theme files with component tokens
- [ ] Add migration helper functions

### Phase 2: ThemeCreatorModal (Week 2)
- [ ] Redesign ThemeCreatorModal UI for component editing
- [ ] Add component preview sections
- [ ] Implement component token editors
- [ ] Add "Advanced" section for global tokens (optional)

### Phase 3: Component Migration (Weeks 3-4)
- [ ] Migrate Cards (Day 1-2)
- [ ] Migrate Buttons (Day 3-4)
- [ ] Migrate Lists (Day 5-6)
- [ ] Migrate Headers (Day 7-8)
- [ ] Migrate Inputs (Day 9-10)
- [ ] Migrate Rails (Day 11-12)

### Phase 4: Testing & Refinement (Week 5)
- [ ] Test theme creation with new system
- [ ] Verify no visual regressions
- [ ] Update documentation
- [ ] Deprecate global tokens (optional)

---

## Benefits of New System

1. **Predictable Theming**: Changing card properties only affects cards
2. **Better UX**: Users understand what they're editing
3. **Component Independence**: Style cards vs buttons vs lists independently
4. **Easier Maintenance**: Clear component boundaries
5. **Scalability**: Easy to add new component tokens
6. **Backward Compatible**: Can keep global tokens during migration

---

## Risks & Mitigation

### Risk 1: Breaking Existing Themes
**Mitigation**: Keep global tokens during migration, generate component tokens from global tokens if missing

### Risk 2: Increased Token Complexity
**Mitigation**: Provide sensible defaults, good documentation, helper functions

### Risk 3: Migration Effort
**Mitigation**: Migrate incrementally, component-by-component, with thorough testing

---

## Conclusion

The current global token system causes unintended side effects when users customize themes. Moving to component-semantic tokens will:

- Make theme customization predictable
- Improve ThemeCreatorModal UX
- Enable independent component styling
- Maintain backward compatibility during migration

The recommended approach is a phased migration that preserves existing functionality while gradually introducing component-level tokens.
