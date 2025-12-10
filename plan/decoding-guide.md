# Recipe Decoding Guide
## Universal Recipe Encoding System (URES) v4.6

## Overview

Decoding transforms language-agnostic encoded recipes into human-readable formats in any target language. This guide covers the decoding process, format options, and language-specific considerations.

## Decoding Pipeline

```
Encoded Recipe â†’ Parser â†’ Translator â†’ Formatter â†’ Renderer â†’ Output
```

1. **Parser**: Breaks down encoded strings into components
2. **Translator**: Maps codes to target language terms
3. **Formatter**: Applies target format structure
4. **Renderer**: Generates final output
5. **Output**: Delivers in requested format

## Basic Decoding Example

### Input (Encoded)
```
1.11.003.form.diced @quantity:2 -> T.03.003 @with:5.70.001 @time:5min @until:cue.golden
```

### Output Examples

**English (Written)**:
"Dice 2 onions and sautÃ© them in olive oil for 5 minutes until golden"

**Spanish (Written)**:
"Corta 2 cebollas en cubos y sofrÃ­elas en aceite de oliva durante 5 minutos hasta que estÃ©n doradas"

**Japanese (Written)**:
"çŽ‰ã­ãŽ2å€‹ã‚’ã•ã„ã®ç›®ã«åˆ‡ã‚Šã€ã‚ªãƒªãƒ¼ãƒ–ã‚ªã‚¤ãƒ«ã§5åˆ†é–“ã€ãã¤ã­è‰²ã«ãªã‚‹ã¾ã§ç‚’ã‚ã‚‹"

**Card Format**:
```
Step 1: Prepare Ingredients
- 2 onions â†’ dice

Step 2: Cook
- Heat olive oil in pan
- Add diced onions
- SautÃ© for 5 minutes
- Continue until golden
```

## Parsing Encoded Recipes

### Component Identification

1. **Food Items**: Match pattern `X.YY.ZZZ`
2. **Qualifiers**: Extract `.qualifier.value` chains
3. **Parameters**: Parse `@param:value` pairs
4. **Operators**: Identify control flow symbols
5. **Labels**: Track `@label:` and `@ref:` pairs

### Parsing Algorithm

```javascript
function parseEncoded(encoded) {
  return {
    items: extractFoodItems(encoded),      // [1.11.003, 5.70.001]
    qualifiers: extractQualifiers(encoded), // {1.11.003: [form.diced]}
    parameters: extractParameters(encoded), // {@quantity:2, @time:5min}
    operations: extractOperations(encoded), // [T.03.003]
    flow: extractFlow(encoded)             // [->]
  };
}
```

## Translation Process

### Term Mapping Structure

```json
{
  "1.11.003": {
    "en": {"singular": "onion", "plural": "onions"},
    "es": {"singular": "cebolla", "plural": "cebollas"},
    "ja": {"singular": "çŽ‰ã­ãŽ", "plural": "çŽ‰ã­ãŽ"},
    "ar": {"singular": "Ø¨ØµÙ„", "plural": "Ø¨ØµÙ„"}
  },
  "form.diced": {
    "en": "diced",
    "es": "en cubos",
    "ja": "ã•ã„ã®ç›®åˆ‡ã‚Š",
    "ar": "Ù…Ù‚Ø·Ø¹ Ù…ÙƒØ¹Ø¨Ø§Øª"
  }
}
```

### Language-Specific Rules

#### Grammatical Considerations

**English**:
- Plural forms for countable items
- Article usage (a, an, the)
- Gerund forms for continuous actions

**Spanish**:
- Gender agreement (el/la, los/las)
- Verb conjugation based on formality
- Reflexive pronouns for certain actions

**Japanese**:
- Counter words (å€‹, æœ¬, æžš)
- Honorific levels (casual vs formal)
- Particle usage (ã‚’, ã§, ã«)

**Arabic**:
- RTL text direction
- Dual forms for two items
- Gender agreement in verbs

**Russian**:
- Case system (6 cases)
- Aspect pairs for verbs
- Gender/number agreement

## Output Formats

### 1. Written Recipe Format

Traditional paragraph-style recipe with ingredients list and instructions.

```markdown
## Ingredients
- 2 onions, diced
- 2 tablespoons olive oil
- Salt and pepper to taste

## Instructions
1. Heat olive oil in a pan over medium heat.
2. Add diced onions and sautÃ© for 5 minutes until golden.
3. Season with salt and pepper to taste.
```

### 2. Step-by-Step Cards

Interactive cards for guided cooking.

```json
{
  "cards": [
    {
      "step": 1,
      "title": "Prepare Ingredients",
      "tasks": [
        {"action": "dice", "item": "2 onions", "visual": "dice_onion.jpg"}
      ],
      "time": "2 minutes"
    },
    {
      "step": 2,
      "title": "SautÃ© Onions",
      "tasks": [
        {"action": "heat", "item": "olive oil", "detail": "medium heat"},
        {"action": "add", "item": "diced onions"},
        {"action": "sautÃ©", "duration": "5 minutes", "until": "golden"}
      ],
      "time": "5 minutes"
    }
  ]
}
```

### 3. Timeline Format

Gantt-style visualization for timing.

```
Time    | Task
--------|--------------------------------
0:00    | Dice onions
0:02    | Heat oil in pan
0:03    | Add onions to pan
0:03-08 | SautÃ© onions until golden
0:08    | Ready to serve
```

### 4. Shopping List Format

Organized by store sections.

```markdown
## Produce
- [ ] 2 onions

## Oils & Vinegars
- [ ] Olive oil

## Spices
- [ ] Salt
- [ ] Black pepper
```

### 5. Voice Assistant Format

Natural language for audio interfaces.

```
"First, you'll need to dice 2 onions. 
[PAUSE]
Ready? Now heat some olive oil in a pan over medium heat.
[PAUSE] 
Add your diced onions and sautÃ© them for about 5 minutes.
You'll know they're ready when they turn golden.
[PAUSE]
Great! Your onions are perfectly sautÃ©ed."
```

## Decoding Functions

### Core Decoder Function

```typescript
interface DecoderOptions {
  language: string;      // Target language code
  format: FormatType;    // 'written' | 'cards' | 'timeline' | 'voice'
  units: UnitSystem;     // 'metric' | 'imperial'
  difficulty: boolean;   // Include difficulty indicators
  images: boolean;       // Include image references
  timing: boolean;       // Include timing information
}

function decodeRecipe(
  encoded: string,
  options: DecoderOptions
): DecodedRecipe {
  // 1. Parse encoded string
  const parsed = parseEncoded(encoded);
  
  // 2. Translate components
  const translated = translateComponents(parsed, options.language);
  
  // 3. Apply format
  const formatted = applyFormat(translated, options.format);
  
  // 4. Convert units if needed
  const converted = convertUnits(formatted, options.units);
  
  // 5. Add supplementary info
  const enriched = enrich(converted, options);
  
  return enriched;
}
```

### Quantity and Unit Conversion

```typescript
function convertQuantity(
  value: number,
  fromUnit: string,
  toUnit: string,
  language: string
): string {
  const converted = performConversion(value, fromUnit, toUnit);
  return formatQuantity(converted, toUnit, language);
}

// Examples:
// "2 cups" â†’ "500ml" â†’ "500 ãƒŸãƒªãƒªãƒƒãƒˆãƒ«"
// "350F" â†’ "175C" â†’ "175Â°C"
// "1 pound" â†’ "450g" â†’ "450 Ð³Ñ€Ð°Ð¼Ð¼"
```

### Handling Complex Operations

#### Concurrent Operations `[A + B]`
```
Encoded: [T.03.001 4.62.001 + T.03.003 1.11.003]
Decoded: "While the pasta boils, sautÃ© the onions"
```

#### Conditional Operations `{condition -> action}`
```
Encoded: {@until:texture.tender -> A.01.002}
Decoded: "When tender, remove from heat"
```

#### References `@label/@ref`
```
Encoded: @label:sauce (1.12.001 + 1.11.003) ... @ref:sauce
Decoded: "Prepare sauce (tomatoes and onions)... Add the sauce"
```

## Language-Specific Decoding

### Right-to-Left Languages (Arabic, Hebrew)

```typescript
function decodeRTL(encoded: string, lang: 'ar' | 'he'): string {
  const decoded = standardDecode(encoded, lang);
  return {
    text: decoded,
    direction: 'rtl',
    alignment: 'right',
    numberFormat: lang === 'ar' ? 'eastern-arabic' : 'standard'
  };
}
```

### Character-Based Languages (Chinese, Japanese, Korean)

```typescript
function decodeCJK(encoded: string, lang: 'zh' | 'ja' | 'ko'): string {
  const decoded = standardDecode(encoded, lang);
  
  // Handle counters and particles
  if (lang === 'ja') {
    return addJapaneseCounters(decoded);
  }
  
  // Handle measure words
  if (lang === 'zh') {
    return addChineseMeasureWords(decoded);
  }
  
  return decoded;
}
```

### Grammatical Gender Languages (Spanish, French, Russian)

```typescript
function decodeWithGender(
  encoded: string, 
  lang: 'es' | 'fr' | 'ru'
): string {
  const decoded = standardDecode(encoded, lang);
  return applyGenderAgreement(decoded, lang);
}
```

## Format-Specific Considerations

### Cards Format
- Break into atomic actions
- Include visual cues
- Progressive disclosure
- Timer integration
- Swipe/tap navigation

### Written Format
- Maintain paragraph flow
- Group related steps
- Use transitional phrases
- Include tips and variations
- Format for readability

### Voice Format
- Natural pauses
- Confirmation prompts
- Repeat important info
- Clear action verbs
- Timing cues

### Timeline Format
- Parallel task tracking
- Critical path highlighting
- Buffer time inclusion
- Start time optimization
- Dependency visualization

## Error Handling in Decoding

### Missing Translations
```typescript
function handleMissingTranslation(
  code: string,
  targetLang: string
): string {
  // 1. Try fallback to English
  const englishTerm = getTranslation(code, 'en');
  
  // 2. If found, return with indicator
  if (englishTerm) {
    return `[${englishTerm}]`; // Brackets indicate untranslated
  }
  
  // 3. Return code as last resort
  return `{{${code}}}`;
}
```

### Invalid Encoding
```typescript
function validateEncoding(encoded: string): ValidationResult {
  const errors = [];
  
  // Check food codes
  if (!validFoodCode(encoded)) {
    errors.push('Invalid food code');
  }
  
  // Check qualifier order
  if (!validQualifierOrder(encoded)) {
    errors.push('Incorrect qualifier order');
  }
  
  // Check parameters
  if (!validParameters(encoded)) {
    errors.push('Invalid parameters');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Optimization Strategies

### Caching Translations
- Cache frequently used terms
- Preload common recipes
- Store user preferences
- Bundle related translations

### Batch Processing
- Decode multiple recipes together
- Reuse translation lookups
- Optimize database queries
- Parallel processing for cards

### Progressive Enhancement
- Start with basic text
- Add formatting progressively
- Load images asynchronously
- Enhance with interactions

## Testing Decoders

### Unit Tests
```typescript
describe('Recipe Decoder', () => {
  test('decodes simple recipe', () => {
    const encoded = '1.11.003.form.diced @quantity:2';
    const decoded = decodeRecipe(encoded, {language: 'en'});
    expect(decoded).toBe('2 diced onions');
  });
  
  test('handles missing translations', () => {
    const encoded = '9.99.999'; // Non-existent code
    const decoded = decodeRecipe(encoded, {language: 'es'});
    expect(decoded).toContain('{{9.99.999}}');
  });
});
```

### Integration Tests
- Test full recipe decoding
- Verify language accuracy
- Check format generation
- Validate unit conversions

### Localization Tests
- Native speaker review
- Cultural appropriateness
- Measurement standards
- Terminology accuracy

## Performance Metrics

### Decoding Speed Targets
- Simple recipe: < 50ms
- Complex recipe: < 200ms
- Batch (10 recipes): < 1s
- With images: < 500ms

### Quality Metrics
- Translation accuracy: > 99%
- Format consistency: 100%
- Unit conversion accuracy: 100%
- Grammar correctness: > 95%

## Conclusion

The decoding system transforms encoded recipes into natural, culturally appropriate content in any language. By separating parsing, translation, and formatting concerns, we achieve consistent, high-quality output across all supported languages and formats.