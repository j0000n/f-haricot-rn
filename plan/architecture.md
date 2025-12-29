# System Architecture Documentation
## Universal Recipe Encoding System (URES) v4.6

## Overview

The Universal Recipe Encoding System (URES) is a comprehensive, language-agnostic recipe encoding and translation platform. It separates recipe content from presentation, enabling perfect multi-language translations and programmatic recipe manipulation.

## Core Architecture Principles

### 1. Separation of Concerns
- **Content Layer**: Language-agnostic encoded recipes
- **Translation Layer**: Multi-language term mappings
- **Presentation Layer**: Format generators (cards, written, voice)
- **Storage Layer**: PostgreSQL/Supabase optimized schema
- **Processing Layer**: Encoders and decoders

### 2. Language-Agnostic Encoding
Recipes are stored as semantic operations rather than natural language:
```
1.11.003.form.diced @quantity:2 -> T.03.003 @with:5.70.001 @until:cue.golden
```
This encodes: "Dice 2 onions and sautÃ© them in olive oil until golden"

### 3. Hierarchical Code System
```
X.YY.ZZZ.qualifier.qualifier...
â”‚  â”‚   â”‚
â”‚  â”‚   â””â”€â”€ Item number (001-999)
â”‚  â””â”€â”€â”€â”€â”€â”€ Subcategory (01-99)
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Namespace (1-9)
```

## System Components

### Core Data Structures

#### 1. Food Catalog (1-9.XX.XXX)
- **Namespace 1**: Produce
- **Namespace 2**: Proteins
- **Namespace 3**: Dairy
- **Namespace 4**: Grains
- **Namespace 5**: Pantry
- **Namespace 6**: Beverages
- **Namespace 7**: Sweets
- **Namespace 8**: Packaged/Processed
- **Namespace 9**: Special/Dietary

#### 2. Qualifiers
- **form.***: Physical presentation (sliced, diced, whole)
- **prep.***: Irreversible processing (roasted, marinated)
- **state.***: Ephemeral conditions (frozen, raw, softened)
- **attribute.***: Enduring qualities (grade, doneness, certification)

#### 3. Operations
- **A.***: Actions (add, combine, transfer)
- **T.***: Techniques (boil, sautÃ©, bake)
- **KT.***: Kitchen tools
- **CT.***: Composite techniques

### Data Flow Architecture

```
Input Sources           Encoding Layer          Storage Layer
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Text Recipe â”‚â”€â”€â”€â”€â”€â”€â”€â–¶â”‚   Parser    â”‚â”€â”€â”€â”€â”€â”€â”€â–¶â”‚             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”‚ PostgreSQL  â”‚
â”‚ URL Scraper â”‚â”€â”€â”€â”€â”€â”€â”€â–¶â”‚  Validator  â”‚â”€â”€â”€â”€â”€â”€â”€â–¶â”‚   Database  â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”‚             â”‚
â”‚ Image OCR   â”‚â”€â”€â”€â”€â”€â”€â”€â–¶â”‚  Encoder    â”‚â”€â”€â”€â”€â”€â”€â”€â–¶â”‚  Supabase   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                      â”‚
                                                      â–¼
Presentation Layer      Decoding Layer         Translation Layer
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Web UI    â”‚â—€â”€â”€â”€â”€â”€â”€â”€â”‚   Decoder   â”‚â—€â”€â”€â”€â”€â”€â”€â”€â”‚ Language    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”‚   Engine    â”‚
â”‚  Mobile App â”‚â—€â”€â”€â”€â”€â”€â”€â”€â”‚  Formatter  â”‚â—€â”€â”€â”€â”€â”€â”€â”€â”‚             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â”‚ Voice Asst. â”‚â—€â”€â”€â”€â”€â”€â”€â”€â”‚  Renderer   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Database Architecture

### Primary Tables

1. **food_items**: Master catalog with nutritional data
2. **recipes**: Encoded recipes with metadata
3. **recipe_ingredients**: Parsed ingredients
4. **recipe_steps**: Operation sequences
5. **user_inventory**: Pantry tracking
6. **translations**: Multi-language mappings

### Key Relationships

```sql
recipes â”€â”€< recipe_ingredients >â”€â”€ food_items
   â”‚                                    â”‚
   â””â”€â”€< recipe_steps                    â”‚
                                        â”‚
users â”€â”€< user_inventory >â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
   â”‚
   â””â”€â”€< user_preferences
```

### Indexing Strategy

1. **Full-text search**: GIN indexes on recipe titles and descriptions
2. **Foreign keys**: All relationships indexed
3. **Time-based**: Created/updated timestamps
4. **Status queries**: Composite indexes on (status, visibility)

## Processing Pipeline

### Encoding Pipeline
1. **Input Reception**: Accept recipe from various sources
2. **Parsing**: Extract ingredients, quantities, and steps
3. **Normalization**: Map to canonical food codes
4. **Validation**: Ensure valid codes and qualifiers
5. **Encoding**: Generate encoded string
6. **Storage**: Save to database with metadata

### Decoding Pipeline
1. **Retrieval**: Fetch encoded recipe
2. **Parsing**: Break down encoded string
3. **Translation**: Map codes to target language
4. **Formatting**: Apply target format (cards, written, etc.)
5. **Rendering**: Generate final output

## API Architecture

### RESTful Endpoints

```
POST /api/recipes/encode
  - Input: Raw recipe (text, URL, image)
  - Output: Encoded recipe object

GET /api/recipes/:id/decode
  - Input: Recipe ID, language, format
  - Output: Formatted recipe

GET /api/inventory/match
  - Input: User ID, Recipe ID
  - Output: Ingredient availability

POST /api/translations
  - Input: Term, language, translation
  - Output: Translation object
```

### Real-time Features (via Supabase)
- Recipe updates
- Inventory changes
- Collaborative cooking sessions
- Live translations

## Security Architecture

### Authentication
- Supabase Auth integration
- JWT token validation
- Session management

### Authorization
- Row Level Security (RLS) policies
- User-owned data isolation
- Public/private recipe visibility

### Data Protection
- Input sanitization
- SQL injection prevention
- XSS protection
- Rate limiting

## Scaling Architecture

### Horizontal Scaling
- Database read replicas
- CDN for static assets
- Edge functions for processing
- Load balancing

### Caching Strategy
- Redis for session data
- CDN for images/media
- Database query caching
- Translation caching

### Performance Optimization
- Lazy loading of translations
- Paginated results
- Indexed searches
- Batch operations

## Multi-Language Architecture

### Language Support
- UTF-8 encoding throughout
- RTL language support (Arabic, Hebrew)
- Character set handling (CJK languages)
- Cultural adaptations (measurements, terms)

### Translation Management
- Professional translator workflow
- Community contributions
- Version control for translations
- Context-aware translations

## Error Handling

### Graceful Degradation
- Fallback to English if translation missing
- Approximate ingredient matching
- Flexible unit conversion
- Partial recipe rendering

### Error Recovery
- Transaction rollback
- Retry mechanisms
- Error logging
- User notifications

## Monitoring & Analytics

### System Monitoring
- Database performance metrics
- API response times
- Error rates
- Resource utilization

### User Analytics
- Recipe popularity
- Search patterns
- Inventory usage
- Translation requests

## Deployment Architecture

### Infrastructure
```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚      Cloudflare (CDN/DDoS)      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
             â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚    Vercel (Frontend/API)        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
             â”‚
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Supabase (Database/Auth)      â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚   PostgreSQL Database   â”‚    â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤    â”‚
â”‚  â”‚    Edge Functions       â”‚    â”‚
â”‚  â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤    â”‚
â”‚  â”‚     Realtime/Auth       â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Environments
- **Development**: Local Docker setup
- **Staging**: Supabase preview branches
- **Production**: Multi-region deployment

## Future Architecture Considerations

### Phase 1 (Current)
- Core encoding/decoding
- Basic inventory matching
- English + 5 languages

### Phase 2
- AI-powered parsing
- Smart substitutions
- Voice integration
- 20+ languages

### Phase 3
- ML recommendations
- Nutritional optimization
- Video generation
- Global recipe federation

## Technical Stack

- **Database**: PostgreSQL 15+ via Supabase
- **Backend**: Node.js/TypeScript
- **Frontend**: Next.js/React
- **Mobile**: React Native
- **Search**: PostgreSQL full-text + trigram
- **Caching**: Supabase CDN
- **Monitoring**: Supabase Dashboard
- **CI/CD**: GitHub Actions

## Conclusion

The URES architecture is designed for scalability, maintainability, and global reach. By separating content from presentation and using a language-agnostic encoding system, we enable perfect translations and programmatic recipe manipulation while maintaining a simple, efficient data model.
