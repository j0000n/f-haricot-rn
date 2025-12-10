# Multi-Language Translation Guide
## Universal Recipe Encoding System (URES) v4.6

## Overview

The URES translation system enables perfect recipe translation across languages by separating semantic content from linguistic presentation. This guide covers translation implementation, language-specific considerations, and best practices.

## Core Translation Principles

1. **Semantic Preservation**: Maintain meaning across languages
2. **Cultural Adaptation**: Respect local culinary terminology
3. **Measurement Localization**: Convert to regional standards
4. **Grammar Compliance**: Follow target language rules
5. **Contextual Accuracy**: Use appropriate culinary terms

## Translation Architecture

```
Encoded Recipe
      â†“
Term Extraction â†’ Translation DB â†’ Language Rules â†’ Output Generation
                       â†‘                                    â†“
                  Translation API â† Quality Check â† Native Review
```

## Language Support Tiers

### Tier 1 - Full Support (Launch)
- English (en)
- Spanish (es)
- Japanese (ja)
- French (fr)
- German (de)
- Italian (it)

### Tier 2 - Priority Languages
- Chinese Simplified (zh-CN)
- Chinese Traditional (zh-TW)
- Arabic (ar)
- Hindi (hi)
- Portuguese (pt)
- Russian (ru)

### Tier 3 - Extended Support
- Korean (ko)
- Hebrew (he)
- Dutch (nl)
- Turkish (tr)
- Polish (pl)
- Thai (th)

## Translation Database Schema

```sql
CREATE TABLE translations (
    code VARCHAR(50),           -- Item/technique code
    language VARCHAR(10),        -- ISO language code
    singular VARCHAR(255),       -- Singular form
    plural VARCHAR(255),         -- Plural form
    gender VARCHAR(10),          -- m/f/n for gendered languages
    context VARCHAR(50),         -- cooking/shopping/display
    alternatives TEXT[],         -- Alternative terms
    notes TEXT,                  -- Usage notes
    verified BOOLEAN,            -- Native speaker verified
    PRIMARY KEY (code, language, context)
);
```

## Language-Specific Implementation

### English (en)

```json
{
  "1.11.003": {
    "singular": "onion",
    "plural": "onions",
    "article": {
      "definite": "the",
      "indefinite": "an"
    },
    "adjective_position": "before"
  },
  "form.diced": {
    "term": "diced",
    "verb_form": "dice",
    "gerund": "dicing"
  },
  "T.03.003": {
    "term": "sautÃ©",
    "past": "sautÃ©ed",
    "gerund": "sautÃ©ing"
  }
}
```

**Key Considerations**:
- Irregular plurals (knifeâ†’knives)
- Article usage (a/an based on sound)
- Gerund forms for continuous actions
- Imperial measurements default

### Spanish (es)

```json
{
  "1.11.003": {
    "singular": "cebolla",
    "plural": "cebollas",
    "gender": "f",
    "article": {
      "definite": {"s": "la", "p": "las"},
      "indefinite": {"s": "una", "p": "unas"}
    }
  },
  "form.diced": {
    "term": "en cubos",
    "verb_form": "cortar en cubos",
    "command": "corte"
  }
}
```

**Key Considerations**:
- Gender agreement (el/la, los/las)
- Adjective placement (usually after noun)
- Formal vs informal commands
- Reflexive verbs
- Metric measurements default

### Japanese (ja)

```json
{
  "1.11.003": {
    "term": "çŽ‰ã­ãŽ",
    "counter": "å€‹",
    "reading": "ãŸã¾ã­ãŽ",
    "kanji": "çŽ‰è‘±"
  },
  "form.diced": {
    "term": "ã•ã„ã®ç›®åˆ‡ã‚Š",
    "verb": "ã•ã„ã®ç›®ã«åˆ‡ã‚‹",
    "reading": "ã•ã„ã®ã‚ãŽã‚Š"
  },
  "quantity": {
    "pattern": "{number}{counter}ã®{item}",
    "example": "2å€‹ã®çŽ‰ã­ãŽ"
  }
}
```

**Key Considerations**:
- Counter words (å€‹, æœ¬, æžš, æ¯)
- Kanji vs hiragana vs katakana
- Particle usage (ã‚’, ã«, ã§, ã‹ã‚‰)
- Honorific levels
- No plural forms
- Metric measurements

### Arabic (ar)

```json
{
  "1.11.003": {
    "singular": "Ø¨ØµÙ„",
    "dual": "Ø¨ØµÙ„ØªØ§Ù†",
    "plural": "Ø¨ØµÙ„",
    "gender": "m",
    "direction": "rtl"
  },
  "form.diced": {
    "term": "Ù…Ù‚Ø·Ø¹ Ù…ÙƒØ¹Ø¨Ø§Øª",
    "verb": "ÙŠÙ‚Ø·Ø¹"
  },
  "number_format": "eastern-arabic"
}
```

**Key Considerations**:
- Right-to-left text direction
- Dual forms for two items
- Gender agreement in verbs
- Eastern Arabic numerals (Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©)
- Different forms for 3-10 items
- Metric measurements

### Chinese Simplified (zh-CN)

```json
{
  "1.11.003": {
    "term": "æ´‹è‘±",
    "pinyin": "yÃ¡ngcÅng",
    "measure_word": "ä¸ª"
  },
  "form.diced": {
    "term": "åˆ‡ä¸",
    "verb": "åˆ‡æˆå°ä¸"
  },
  "quantity": {
    "pattern": "{number}{measure_word}{item}",
    "example": "2ä¸ªæ´‹è‘±"
  }
}
```

**Key Considerations**:
- Measure words (ä¸ª, ç‰‡, æ ¹, ç“¶)
- Simplified vs Traditional characters
- No pluralization
- SVO word order
- Metric measurements

### French (fr)

```json
{
  "1.11.003": {
    "singular": "oignon",
    "plural": "oignons",
    "gender": "m",
    "article": {
      "definite": {"s": "le", "p": "les"},
      "indefinite": {"s": "un", "p": "des"},
      "partitive": "de l'"
    }
  },
  "form.diced": {
    "term": "en dÃ©s",
    "verb": "couper en dÃ©s"
  }
}
```

**Key Considerations**:
- Gender agreement
- Liaison rules
- Partitive articles (du, de la, des)
- Adjective agreement
- Metric measurements

### Russian (ru)

```json
{
  "1.11.003": {
    "nominative": "Ð»ÑƒÐº",
    "genitive": "Ð»ÑƒÐºÐ°",
    "dative": "Ð»ÑƒÐºÑƒ",
    "accusative": "Ð»ÑƒÐº",
    "instrumental": "Ð»ÑƒÐºÐ¾Ð¼",
    "prepositional": "Ð»ÑƒÐºÐµ",
    "gender": "m"
  },
  "quantity": {
    "1": "Ð»ÑƒÐºÐ¾Ð²Ð¸Ñ†Ð°",
    "2-4": "Ð»ÑƒÐºÐ¾Ð²Ð¸Ñ†Ñ‹",
    "5+": "Ð»ÑƒÐºÐ¾Ð²Ð¸Ñ†"
  }
}
```

**Key Considerations**:
- Six grammatical cases
- Number agreement rules (1, 2-4, 5+)
- Aspect pairs for verbs
- Gender agreement
- Metric measurements

## Measurement Conversion

### Standard Conversions

```javascript
const conversions = {
  // Volume
  'cup': {
    'ml': 237,
    'l': 0.237,
    'fl_oz': 8,
    'tbsp': 16,
    'tsp': 48
  },
  // Weight
  'lb': {
    'kg': 0.453592,
    'g': 453.592,
    'oz': 16
  },
  // Temperature
  'F': {
    'C': (f) => (f - 32) * 5/9,
    'K': (f) => (f - 32) * 5/9 + 273.15
  }
};
```

### Regional Preferences

```javascript
const regionalDefaults = {
  'US': {
    volume: 'cup',
    weight: 'lb',
    temperature: 'F'
  },
  'UK': {
    volume: 'ml',
    weight: 'g',
    temperature: 'C'
  },
  'JP': {
    volume: 'ml',
    weight: 'g',
    temperature: 'C'
  }
};
```

## Cultural Adaptations

### Ingredient Substitutions

```json
{
  "5.70.001": {
    "default": "olive_oil",
    "regional": {
      "IN": "ghee or mustard_oil",
      "JP": "sesame_oil or vegetable_oil",
      "MX": "corn_oil or lard"
    }
  },
  "3.50.005": {
    "default": "heavy_cream",
    "regional": {
      "IN": "malai",
      "JP": "ç”Ÿã‚¯ãƒªãƒ¼ãƒ ",
      "dietary": {
        "vegan": "coconut_cream"
      }
    }
  }
}
```

### Cooking Terms

```json
{
  "T.03.003": {
    "base": "sautÃ©",
    "cultural": {
      "zh-CN": "çˆ†ç‚’ (bÃ o chÇŽo) - similar to stir-fry",
      "ja": "ç‚’ã‚ã‚‹ (itameru)",
      "in": "à¤­à¥‚à¤¨à¤¨à¤¾ (bhunna)",
      "es-MX": "sofreÃ­r"
    }
  }
}
```

## Translation Workflow

### 1. Professional Translation
```
1. Extract all terms from encoding system
2. Create base translation spreadsheet
3. Professional translator completes initial translation
4. Culinary expert reviews for accuracy
5. Native speaker validates naturalness
```

### 2. Community Contributions
```
1. Users suggest translations
2. Community votes on alternatives
3. Moderators review submissions
4. Professional verification for accepted terms
5. Integration into main database
```

### 3. Quality Assurance

```javascript
class TranslationValidator {
  validate(translation) {
    return {
      hasAllRequired: this.checkRequired(translation),
      grammarCorrect: this.checkGrammar(translation),
      contextAppropriate: this.checkContext(translation),
      culturallyValid: this.checkCultural(translation),
      measurementsCorrect: this.checkMeasurements(translation)
    };
  }
}
```

## Implementation Examples

### Basic Translation Function

```typescript
function translateTerm(
  code: string,
  targetLang: string,
  context: string = 'cooking',
  quantity?: number
): string {
  // Get base translation
  const translation = getTranslation(code, targetLang, context);
  
  // Apply quantity rules
  if (quantity !== undefined) {
    return applyQuantityRules(translation, quantity, targetLang);
  }
  
  return translation.singular;
}
```

### Complex Translation with Grammar

```typescript
function translateWithGrammar(
  encoded: string,
  targetLang: string
): string {
  const parsed = parseEncoded(encoded);
  const translated = [];
  
  for (const component of parsed) {
    const term = translateTerm(component.code, targetLang);
    const withGrammar = applyGrammarRules(
      term,
      component,
      targetLang
    );
    translated.push(withGrammar);
  }
  
  return joinWithLanguageRules(translated, targetLang);
}
```

### RTL Language Handler

```typescript
function handleRTL(
  text: string,
  lang: 'ar' | 'he'
): RTLText {
  return {
    text: text,
    direction: 'rtl',
    alignment: 'right',
    numbers: convertNumbers(text, lang),
    punctuation: adjustPunctuation(text, lang)
  };
}
```

## Common Translation Challenges

### 1. Terms Without Direct Translation

**Problem**: Some culinary terms don't exist in other languages
**Solution**: Use descriptive translation or transliteration

```json
{
  "T.03.004": {
    "en": "sear",
    "ja": "ã‚·ã‚¢ãƒ¼ (è¡¨é¢ã‚’å¼·ç«ã§ç„¼ã)",
    "explanation": "high heat surface browning"
  }
}
```

### 2. Multiple Regional Variants

**Problem**: Same language, different terms by region
**Solution**: Region-specific translations

```json
{
  "1.15.003": {
    "en-US": "corn",
    "en-UK": "sweetcorn",
    "es-ES": "maÃ­z",
    "es-MX": "elote"
  }
}
```

### 3. Measurement Precision

**Problem**: Conversions create awkward decimals
**Solution**: Smart rounding based on context

```javascript
function smartRound(value: number, unit: string): string {
  if (unit === 'g' && value > 1000) {
    return `${(value / 1000).toFixed(1)}kg`;
  }
  if (value < 10) {
    return value.toFixed(1);
  }
  return Math.round(value).toString();
}
```

## Testing Translations

### Automated Tests

```typescript
describe('Translation Tests', () => {
  test('all codes have translations', () => {
    const codes = getAllCodes();
    const languages = ['en', 'es', 'ja', 'fr', 'de'];
    
    for (const code of codes) {
      for (const lang of languages) {
        expect(hasTranslation(code, lang)).toBe(true);
      }
    }
  });
  
  test('grammar rules apply correctly', () => {
    const result = translateWithGrammar(
      '1.11.003 @quantity:2',
      'ru'
    );
    expect(result).toBe('2 Ð»ÑƒÐºÐ¾Ð²Ð¸Ñ†Ñ‹'); // Correct plural form
  });
});
```

### Native Speaker Review

```markdown
## Review Checklist
- [ ] Natural phrasing
- [ ] Correct grammar
- [ ] Appropriate formality
- [ ] Cultural relevance
- [ ] Clear instructions
- [ ] Accurate measurements
- [ ] Consistent terminology
```

## Performance Optimization

### Translation Caching

```javascript
class TranslationCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 10000;
  }
  
  get(code, lang, context) {
    const key = `${code}:${lang}:${context}`;
    return this.cache.get(key);
  }
  
  set(code, lang, context, translation) {
    const key = `${code}:${lang}:${context}`;
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    this.cache.set(key, translation);
  }
}
```

### Bundle Optimization

```javascript
// Preload common terms for target language
async function preloadLanguagePack(lang: string) {
  const commonTerms = await getCommonTerms();
  const translations = await batchTranslate(commonTerms, lang);
  cacheTranslations(translations);
}
```

## Translation Maintenance

### Version Control
- Track translation changes
- Maintain changelog
- Support rollback
- A/B testing for improvements

### Update Process
1. Identify needed updates
2. Professional review
3. Staged rollout
4. Monitor user feedback
5. Full deployment

### Quality Metrics
- Translation coverage: % of terms translated
- Verification rate: % verified by native speakers
- User satisfaction: Feedback scores
- Error rate: Reported translation issues

## API Documentation

### Get Translation
```http
GET /api/translations/{code}?lang={language}&context={context}

Response:
{
  "code": "1.11.003",
  "language": "es",
  "singular": "cebolla",
  "plural": "cebollas",
  "gender": "f",
  "verified": true
}
```

### Bulk Translation
```http
POST /api/translations/bulk
{
  "codes": ["1.11.003", "5.70.001"],
  "language": "ja",
  "context": "cooking"
}

Response:
{
  "translations": [
    {"code": "1.11.003", "term": "çŽ‰ã­ãŽ"},
    {"code": "5.70.001", "term": "ã‚ªãƒªãƒ¼ãƒ–ã‚ªã‚¤ãƒ«"}
  ]
}
```

### Submit Translation
```http
POST /api/translations/submit
{
  "code": "1.11.003",
  "language": "hi",
  "translation": "à¤ªà¥à¤¯à¤¾à¤œ",
  "context": "cooking",
  "notes": "Common Hindi term"
}
```

## Conclusion

The multi-language translation system enables global recipe sharing while preserving culinary precision and cultural authenticity. By separating semantic content from linguistic presentation and implementing robust translation workflows, we ensure high-quality recipe translations across all supported languages.