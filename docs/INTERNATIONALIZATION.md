# Internationalization (i18n) Documentation

This document describes the internationalization implementation for the Haricot mobile application.

## Overview

The app supports **7 languages** with automatic language detection based on the user's device settings:

1. **English (en)** - 241+ million speakers in the US
2. **Spanish (es)** - 41+ million speakers in the US
3. **Chinese (zh)** - Mandarin and Cantonese - 3.4+ million speakers in the US
4. **French (fr)** - 2+ million speakers in the US
5. **Tagalog (tl)** - Including Filipino - 1.7+ million speakers in the US
6. **Vietnamese (vi)** - 1.5+ million speakers in the US
7. **Arabic (ar)** - Significant US population

## Technology Stack

- **i18next**: Core internationalization framework
- **react-i18next**: React bindings for i18next
- **expo-localization**: Device locale detection for Expo

## Auto-Detection

The app automatically detects the user's preferred language using:

1. **Device Language**: The app reads the device's locale settings via `expo-localization`
2. **Language Mapping**: Common locale variants are mapped to supported languages (e.g., `fil` → `tl`)
3. **Fallback**: If the device language is not supported, the app defaults to English

See: `i18n/config.ts` for the auto-detection implementation.

## File Structure

```
i18n/
├── config.ts                  # i18n initialization and configuration
├── useTranslation.ts          # Custom hooks and utilities
└── locales/
    ├── en.json               # English translations
    ├── es.json               # Spanish translations
    ├── zh.json               # Chinese translations
    ├── fr.json               # French translations
    ├── tl.json               # Tagalog translations
    ├── vi.json               # Vietnamese translations
    └── ar.json               # Arabic translations
```

## Translation Files

All translation files follow a nested JSON structure organized by feature:

```json
{
  "auth": {
    "signInTitle": "Sign in or create an account",
    "email": "Email",
    ...
  },
  "onboarding": {
    "stepIndicator": "Step {{current}} of {{total}}",
    ...
  },
  "home": { ... },
  "kitchen": { ... },
  "profile": { ... },
  "tasks": { ... }
}
```

### Key Categories

- **auth**: Authentication screens (sign-in, verification)
- **onboarding**: Onboarding flow (accessibility, theme, dietary, household, cuisines)
- **themes**: Theme names and descriptions
- **tabs**: Tab navigation labels
- **home**: Home screen content
- **kitchen**: Kitchen inventory management
- **profile**: Profile and settings
- **tasks**: Task management
- **components**: Shared components
- **permissions**: iOS permission descriptions
- **categories**: Food category names
- **errors**: Error messages

## Using Translations in Components

### Basic Usage

```tsx
import { useTranslation } from "@/i18n/useTranslation";

function MyComponent() {
  const { t } = useTranslation();

  return <Text>{t('auth.signInTitle')}</Text>;
}
```

### Interpolation

For dynamic content, use interpolation:

```tsx
const { t } = useTranslation();

// Translation: "We sent a 6-digit code to {{email}}"
<Text>{t('auth.codeSentTo', { email: 'user@example.com' })}</Text>
```

### Pluralization

i18next supports automatic pluralization:

```json
{
  "itemCount_one": "{{count}} item",
  "itemCount_other": "{{count}} items"
}
```

```tsx
<Text>{t('kitchen.itemCount', { count: 5 })}</Text>
// Output: "5 items"
```

### Complete Example: SignIn Component

The `app/SignIn.tsx` component has been fully internationalized as an example:

```tsx
import { useTranslation } from "@/i18n/useTranslation";

export default function SignIn() {
  const { t } = useTranslation();

  return (
    <>
      <Text>{t('auth.signInTitle')}</Text>
      <TextInput placeholder={t('auth.email')} />
      <Button title={submitting ? t('auth.sending') : t('auth.sendCode')} />
    </>
  );
}
```

## Changing Language Programmatically

### Get Current Language

```tsx
import { getCurrentLanguage } from "@/i18n/useTranslation";

const currentLang = getCurrentLanguage(); // Returns: 'en', 'es', 'zh', etc.
```

### Change Language

```tsx
import { changeLanguage } from "@/i18n/useTranslation";

await changeLanguage('es'); // Changes to Spanish
```

### Language Selector Component Example

```tsx
import { SUPPORTED_LANGUAGES, changeLanguage } from "@/i18n/useTranslation";

function LanguageSelector() {
  return (
    <View>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <Pressable
          key={lang.code}
          onPress={() => changeLanguage(lang.code)}
        >
          <Text>{lang.nativeName}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

## Convex Backend Integration

### Database Schema Updates

The Convex schema has been updated to support multilingual content:

#### Users Table

```typescript
preferredLanguage: v.optional(
  v.union(
    v.literal("en"),
    v.literal("es"),
    v.literal("zh"),
    v.literal("fr"),
    v.literal("tl"),
    v.literal("vi"),
    v.literal("ar")
  )
)
```

#### Food Items Table

```typescript
// Multilingual display text
displayTextEnglish: v.optional(v.string()),
displayTextSpanish: v.optional(v.string()),
displayTextChinese: v.optional(v.string()),
displayTextFrench: v.optional(v.string()),
displayTextTagalog: v.optional(v.string()),
displayTextVietnamese: v.optional(v.string()),
displayTextArabic: v.optional(v.string()),

// Multilingual category names
categoryEnglish: v.optional(v.string()),
categorySpanish: v.optional(v.string()),
// ... etc
```

#### Tasks Table

```typescript
// Multilingual title
displayTextEnglish: v.optional(v.string()),
displayTextSpanish: v.optional(v.string()),
// ... etc

// Multilingual description
descriptionEnglish: v.optional(v.string()),
descriptionSpanish: v.optional(v.string()),
// ... etc
```

### Using Multilingual Convex Data

Use the `getMultilingualText` utility to extract the correct translation:

```tsx
import { getMultilingualText } from "@/i18n/useTranslation";

function FoodItem({ item }) {
  const displayName = getMultilingualText(item, 'displayText', item.name);
  const category = getMultilingualText(item, 'category', item.category);

  return (
    <View>
      <Text>{displayName}</Text>
      <Text>{category}</Text>
    </View>
  );
}
```

The function automatically selects the correct language field based on the current app language:
- For English (`en`): Uses `displayTextEnglish`
- For Spanish (`es`): Uses `displayTextSpanish`
- For Chinese (`zh`): Uses `displayTextChinese`
- etc.

### Creating Multilingual Convex Mutations

When creating or updating items in Convex, provide all language variants:

```tsx
const createFoodItem = useMutation(api.foodItems.create);

await createFoodItem({
  itemId: 'apple-001',
  namespace: 'fruits',
  name: 'Apple',
  category: 'Fruits',
  displayTextEnglish: 'Apple',
  displayTextSpanish: 'Manzana',
  displayTextChinese: '苹果',
  displayTextFrench: 'Pomme',
  displayTextTagalog: 'Mansanas',
  displayTextVietnamese: 'Táo',
  displayTextArabic: 'تفاحة',
  categoryEnglish: 'Fruits',
  categorySpanish: 'Frutas',
  // ... etc
});
```

## Supported Languages Reference

```typescript
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];
```

## Migration Guide for Existing Components

To add internationalization to an existing component:

### 1. Import the translation hook

```tsx
import { useTranslation } from "@/i18n/useTranslation";
```

### 2. Use the hook in your component

```tsx
function MyComponent() {
  const { t } = useTranslation();
  // ... rest of component
}
```

### 3. Replace hardcoded strings

**Before:**
```tsx
<Text>Sign in or create an account</Text>
```

**After:**
```tsx
<Text>{t('auth.signInTitle')}</Text>
```

### 4. Handle dynamic content with interpolation

**Before:**
```tsx
<Text>We sent a code to {email}</Text>
```

**After:**
```tsx
<Text>{t('auth.codeSentTo', { email })}</Text>
```

### 5. Add missing translations

If you need to add new strings:

1. Add the key to **all 7** translation files (`i18n/locales/*.json`)
2. Follow the existing naming convention and nesting structure
3. Ensure translations are accurate and culturally appropriate

## Components Updated

The following components have been updated as examples:

- ✅ `app/SignIn.tsx` - Fully internationalized authentication screen

## Components To Update

The following components still need internationalization:

- ⏳ `app/(tabs)/index.tsx` - Home screen
- ⏳ `app/(tabs)/kitchen.tsx` - Kitchen inventory
- ⏳ `app/(tabs)/profile.tsx` - Profile and settings
- ⏳ `app/onboarding/*.tsx` - All onboarding screens
- ⏳ `app/add-task.tsx` - Add task modal
- ⏳ `app/tasks/[id].tsx` - Task details
- ⏳ `components/Rail.tsx` - Rail component
- ⏳ `components/BrandLogo.tsx` - Logo accessibility

## Best Practices

### 1. Always Use Translation Keys

Never hardcode user-facing text in components. Always use `t()` with a translation key.

### 2. Use Meaningful Key Names

```typescript
// Good
t('auth.signInTitle')
t('onboarding.accessibility.title')

// Bad
t('text1')
t('label')
```

### 3. Keep Translation Files Organized

Follow the established structure with nested objects by feature area.

### 4. Handle Pluralization Correctly

Use i18next's pluralization features instead of manual string concatenation:

```typescript
// Good
t('kitchen.itemCount', { count: items.length })

// Bad
`${items.length} ${items.length === 1 ? 'item' : 'items'}`
```

### 5. Test in Multiple Languages

Always test your changes in at least 2-3 different languages to ensure:
- Text doesn't overflow containers
- RTL languages (Arabic) display correctly
- Interpolation works as expected

### 6. Provide Context for Translators

When adding new keys, consider adding comments in the translation files:

```json
{
  "onboarding": {
    "stepIndicator": "Step {{current}} of {{total}}",
    "_comment": "Shows progress through onboarding, e.g., 'Step 2 of 5'"
  }
}
```

### 7. Handle Convex Data Properly

When displaying data from Convex:
- Store translations in all 7 languages
- Use `getMultilingualText()` utility for retrieval
- Provide fallbacks for missing translations

## RTL (Right-to-Left) Support

Arabic is an RTL language. The app should automatically handle RTL layout:

```tsx
import { I18nManager } from 'react-native';

// Check if RTL
const isRTL = I18nManager.isRTL;
```

For RTL-specific styling, use `start` and `end` instead of `left` and `right`:

```typescript
const styles = StyleSheet.create({
  container: {
    paddingStart: 20,  // Instead of paddingLeft
    paddingEnd: 20,    // Instead of paddingRight
  }
});
```

## Testing

### Test Auto-Detection

1. Change your device language settings
2. Restart the app
3. Verify the app displays in the correct language

### Test Manual Language Change

```tsx
import { changeLanguage } from "@/i18n/useTranslation";

// Test changing to each language
await changeLanguage('es');
await changeLanguage('zh');
await changeLanguage('fr');
// etc.
```

### Test with Missing Translations

If a translation key is missing, i18next will:
1. Fall back to English
2. Show the key name in development mode
3. Log a warning to the console

## Maintenance

### Adding New Translations

When adding new features:

1. Add translation keys to `i18n/locales/en.json` first
2. Copy the structure to all other language files
3. Translate content for each language
4. Consider using professional translation services for accuracy

### Updating Existing Translations

1. Update the key in all 7 language files
2. Test in the app to ensure changes display correctly
3. Consider notifying users of significant text changes

### Translation File Validation

Consider adding a validation script to ensure:
- All language files have the same keys
- No keys are missing in any language
- Interpolation variables are consistent

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Expo Localization](https://docs.expo.dev/versions/latest/sdk/localization/)

## Support

For questions or issues with internationalization:
1. Check this documentation
2. Review the example implementation in `app/SignIn.tsx`
3. Consult the i18next documentation
4. Test with multiple languages to identify issues

---

**Last Updated**: October 30, 2025
**Version**: 1.0.0
