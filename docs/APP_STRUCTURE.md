# App Structure Documentation

This document describes the current structure of the React Native app after refactoring.

## Directory Structure

```
/app                          # Expo Router app directory (file-based routing)
  /(tabs)                     # Tab navigation screens
    _layout.tsx               # Tab layout configuration
    index.tsx                 # Home screen
    kitchen.tsx               # Kitchen inventory screen
    lists.tsx                 # Recipe lists screen
  /ingredient                 # Ingredient detail screens
    [id].tsx                  # Dynamic ingredient detail route
  /lists                      # List detail screens
    [id].tsx                  # Dynamic list detail route
  /onboarding                 # Onboarding flow screens
    _layout.tsx               # Onboarding layout
    accessibility.tsx         # Accessibility preferences
    allergies.tsx             # Allergies setup
    cooking-styles.tsx        # Cooking styles preferences
    cuisines.tsx              # Cuisine preferences
    dietary.tsx               # Dietary preferences
    household.tsx             # Household setup
    household-code.tsx        # Household code entry
    index.tsx                 # Onboarding redirect
    meal-preferences.tsx      # Meal preferences
    theme.tsx                 # Theme selection
  /recipe                     # Recipe detail screens
    [id].tsx                  # Dynamic recipe detail route
  /search                     # Search screens
    [query].tsx               # Dynamic search results route
  /tasks                      # Task detail screens
    [id].tsx                  # Dynamic task detail route
  /webview                    # WebView screens
    [id].tsx                  # Dynamic webview route
  _layout.tsx                 # Root layout with providers
  add-task.tsx                # Add inventory task modal
  profile.tsx                 # User profile screen
  SignIn.tsx                  # Authentication screen

/components                    # Reusable React components
  /api                        # API-related components
  /cards                      # Card components
    CompactCard.tsx
    DetailedCard.tsx
    LinkPreviewCard.tsx
    RecipeCard.tsx
    StandardCard.tsx
  BrandLogo.tsx               # Brand logo component
  CompactColorPicker.tsx      # Compact color picker
  FeatherIconPicker.tsx       # Feather icon picker
  FontSelector.tsx            # Font selector
  ImageUpload.tsx             # Image upload component
  IngredientsList.tsx         # Ingredients list component
  LanguageSwitcher.tsx        # Language switcher
  LinkPreviewRail.tsx         # Link preview rail component
  LoadingScreen.tsx           # Loading screen component
  logoAssets.ts              # Logo assets
  LogoPicker.tsx              # Logo picker
  PageHeader.tsx             # Page header component
  Rail.tsx                   # Generic rail component
  RecipeHeader.tsx           # Recipe header component
  RecipeListPicker.tsx       # Recipe list picker
  RecipeRail.tsx             # Recipe rail component
  RecipeRunner.tsx           # Recipe runner component
  RobustColorPicker.tsx      # Robust color picker
  Slider.tsx                 # Slider component
  SvgLogo.tsx               # SVG logo component
  TabButton.tsx             # Tab button component
  ThemeCreatorModal.tsx     # Theme creator modal
  ThemeSwitcher.tsx         # Theme switcher component
  WebsiteStyleColorPicker.tsx # Website style color picker

/utils                         # Utility functions and helpers
  date.ts                    # Date formatting utilities
  fonts.ts                   # Font configuration
  formatting.ts              # General formatting utilities
  inventory.ts               # Inventory calculation utilities
  inventoryCategories.ts     # Inventory categorization
  kitchen.ts                 # Kitchen sorting and location utilities
  linkPreview.ts             # Link preview fetching utilities
  nativeSpeechRecognition.ts # Native speech recognition utilities
  recipeLists.ts             # Recipe list utilities
  recipes.ts                 # Recipe utilities
  translation.ts             # Translation and language utilities
  url.ts                     # URL parsing utilities

/hooks                         # Custom React hooks
  useInventoryDisplay.ts     # Inventory display hook
  useLinkPreviews.ts         # Link previews fetching hook
  useRecipeLists.tsx         # Recipe lists management hook
  useWidgetSync.ts           # Widget synchronization hook

/styles                        # Style definitions
  /themes                     # Theme definitions
    [theme files].ts
  addTaskStyles.ts           # Add task screen styles
  homeStyles.ts              # Home screen styles
  indexStyles.ts             # Index styles
  kitchenStyles.ts           # Kitchen screen styles
  layoutStyles.ts            # Layout styles
  listDetailStyles.ts        # List detail styles
  listsStyles.ts             # Lists screen styles
  onboardingStyles.ts        # Onboarding styles
  profileStyles.ts           # Profile screen styles
  searchStyles.ts            # Search screen styles
  signInStyles.ts            # Sign in styles
  tabLayoutStyles.ts         # Tab layout styles
  taskDetailStyles.ts        # Task detail styles
  themeContext.tsx           # Theme context provider
  tokens.ts                  # Design tokens

/convex                        # Convex backend functions
  /_generated                 # Generated Convex types
  /app                        # App-specific Convex functions
  allergies.ts                # Allergies functions
  auth.config.ts              # Auth configuration
  auth.ts                     # Authentication functions
  customThemes.ts            # Custom themes functions
  dietary.ts                  # Dietary functions
  fileUrls.ts                # File URL functions
  foodLibrary.ts             # Food library functions
  households.ts              # Household functions
  http.ts                    # HTTP functions
  images.ts                  # Image functions
  inventory.ts               # Inventory functions
  promptGenerators.ts        # Prompt generator functions
  recipes.ts                 # Recipe functions
  schema.ts                  # Database schema
  tasks.ts                   # Task functions
  testFunction.ts            # Test functions
  testFunctionNode.ts        # Node test functions
  users.ts                   # User functions

/i18n                          # Internationalization
  config.ts                  # i18n configuration
  /locales                    # Translation files
    [language].json
  useTranslation.ts          # Translation hook

/types                         # TypeScript type definitions
  emojiTags.ts               # Emoji tag types
  expo-speech-recognition.d.ts # Speech recognition types
  food.ts                    # Food-related types
  haricot-widgets.d.ts       # Widget types
  recipe.ts                  # Recipe types
```

## Key Architectural Patterns

### File-Based Routing
The app uses Expo Router for file-based routing. Routes are defined by the file structure in `/app`:
- `(tabs)` - Tab navigation group
- `[id]` - Dynamic route segments
- `_layout.tsx` - Layout files for route groups

### Component Organization
- **Screen Components**: Located in `/app`, handle routing and screen-level logic
- **Reusable Components**: Located in `/components`, can be used across multiple screens
- **Utilities**: Located in `/utils`, pure functions for data transformation and formatting
- **Hooks**: Located in `/hooks`, custom React hooks for shared state and side effects

### State Management
- **Convex**: Backend state management and real-time data
- **React Context**: Theme and translation providers
- **Local State**: React hooks (`useState`, `useReducer`) for component-specific state

### Styling
- **Themed Styles**: All styles use the theme system via `useThemedStyles()`
- **Style Files**: Each screen has a corresponding style file in `/styles`
- **Design Tokens**: Centralized design tokens in `/styles/tokens.ts`

### Data Flow
1. **Screens** fetch data using Convex hooks (`useQuery`, `useMutation`, `useAction`)
2. **Utilities** transform and format data
3. **Components** receive props and render UI
4. **Hooks** encapsulate complex logic and side effects

## Screen Responsibilities

### Home Screen (`app/(tabs)/index.tsx`)
- Displays featured recipes
- Shows inventory items by category (fresh produce, pantry, proteins)
- Provides recipe search functionality
- Shows link previews
- Manages tasks display

### Kitchen Screen (`app/(tabs)/kitchen.tsx`)
- Displays inventory items
- Supports filtering by location
- Supports sorting by location, quantity, or purchase date
- Supports list and grid view modes

### Lists Screen (`app/(tabs)/lists.tsx`)
- Displays recipe lists
- Shows recipe match percentages
- Supports filtering and sorting
- Supports list and detailed view modes

### Profile Screen (`app/profile.tsx`)
- User profile management
- Household management
- Theme and accessibility settings
- Language preferences
- Allergy management

### Recipe Detail (`app/recipe/[id].tsx`)
- Displays recipe details
- Shows ingredients and instructions
- Recipe runner mode for cooking

### List Detail (`app/lists/[id].tsx`)
- Displays recipes in a specific list
- Shows missing ingredients
- Supports filtering by emoji tags

### Ingredient Detail (`app/ingredient/[id].tsx`)
- Displays food library item details
- Shows translations and varieties
- Storage information

## Utility Categories

### Data Transformation
- `formatting.ts` - General data formatting
- `translation.ts` - Language and translation handling
- `date.ts` - Date formatting and calculations

### Domain-Specific
- `inventory.ts` - Inventory calculations
- `inventoryCategories.ts` - Inventory categorization
- `kitchen.ts` - Kitchen-specific sorting
- `recipeLists.ts` - Recipe list operations
- `recipes.ts` - Recipe utilities

### UI Support
- `linkPreview.ts` - Link preview fetching
- `url.ts` - URL parsing
- `fonts.ts` - Font configuration

## Best Practices

1. **Keep screens thin**: Screens should primarily handle routing and data fetching
2. **Extract reusable logic**: Move repeated logic to utilities or hooks
3. **Use typed utilities**: All utilities are fully typed with TypeScript
4. **Follow naming conventions**: 
   - Components: PascalCase
   - Utilities: camelCase
   - Files: camelCase for utilities, PascalCase for components
5. **Document utilities**: All utility functions include JSDoc comments
6. **Centralize constants**: Constants are defined in utility files or constants files


