# Rail Component System Guide

## Overview

The Rail component system provides a flexible, reusable way to display horizontal scrolling lists of inventory items with multiple card variants. This system was designed to showcase different levels of item detail in an intuitive, mobile-friendly interface.

## Architecture

### Component Structure

```
components/
├── Rail.tsx                    # Main rail container component
└── cards/
    ├── CompactCard.tsx        # Small card variant (120px wide)
    ├── StandardCard.tsx       # Medium card variant (160px wide)
    └── DetailedCard.tsx       # Large card variant (240px wide)

hooks/
└── useInventoryDisplay.ts     # Hook that maps user inventory to displayable data

types/
└── food.ts                    # Shared food catalog and inventory interfaces
```

## Components

### 1. Rail Component (`components/Rail.tsx`)

The Rail component is a container that renders a header, subheader, and horizontal scrolling list of cards.

#### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `header` | `string` | Yes | Main title displayed at the top of the rail |
| `subheader` | `string` | No | Optional descriptive text below the header |
| `items` | `{ id: string; data: InventoryDisplayItem }[]` | Yes | Array of items to display |
| `variant` | `'compact' \| 'standard' \| 'detailed'` | Yes | Card variant to use for this rail |
| `onSeeAll` | `() => void` | No | Callback when "See All" button is pressed |
| `onItemPress` | `(itemId: string, item: InventoryDisplayItem) => void` | No | Callback when an item card is pressed |

#### Features

- **Horizontal Scrolling**: Smooth horizontal scroll with momentum
- **Snap-to-Interval**: Cards snap to alignment based on variant size
- **Themed**: Automatically uses theme colors from `ThemeContext`
- **Optional "See All" Button**: Displays when `onSeeAll` prop is provided
- **Press Handling**: Optional tap handling for individual items

#### Example Usage

```tsx
<Rail
  header="Fresh Produce"
  subheader="Fruits and berries in your kitchen"
  items={freshProduceItems}
  variant="compact"
  onSeeAll={() => handleSeeAll("Fresh Produce")}
  onItemPress={handleItemPress}
/>
```

### 2. Card Variants

All card variants share common features:
- Themed colors from `ThemeContext`
- Image display with placeholder support
- Press feedback (opacity change on press)
- Shadow/elevation for depth
- Rounded corners (12px border radius)

#### CompactCard (`components/cards/CompactCard.tsx`)

**Size**: 120px × ~136px
**Best For**: Dense information display, large inventories

**Displays**:
- Item image (80px height)
- Item name (English)
- Quantity

**Visual Style**: Minimal, space-efficient design

#### StandardCard (`components/cards/StandardCard.tsx`)

**Size**: 160px × ~208px
**Best For**: Balanced information display, most common use case

**Displays**:
- Item image (120px height)
- Item name (English)
- Variety name (English)
- Quantity
- Purchase date (formatted as "Mon DD")

**Visual Style**: Clean, well-balanced design with footer section

#### DetailedCard (`components/cards/DetailedCard.tsx`)

**Size**: 240px × ~340px
**Best For**: Critical information, priority items, detailed view

**Displays**:
- Item image (160px height)
- Item name (English)
- Variety name (English)
- Quantity badge (circular, top-right)
- Category
- Kitchen location (capitalized)
- Purchase date (formatted as "Mon DD, YYYY")
- Expiry indicator (color-coded banner)
  - Green: 5+ days remaining
  - Orange: 3-4 days remaining
  - Red: 0-2 days remaining

**Visual Style**: Rich, information-dense design with status indicators

**Expiry Calculation**: Assumes 7-day shelf life from purchase date (customizable in code)

## Data Structure

### InventoryDisplayItem Interface

The rail system now consumes fully decorated items returned by the `useInventoryDisplay` hook. The hook resolves user inventory
entries against the shared food library and localizes names based on the active profile language.

```typescript
export interface InventoryDisplayItem {
  itemCode: string;                                     // Hierarchical catalog code (e.g., "1.01.001")
  category: string;                                     // Canonical category name
  categoryName: string;                                 // Localized category label
  displayName: string;                                  // Localized item name
  displayVariety?: string;                              // Localized variety name (if present)
  quantity: number;                                     // Quantity in the user's pantry
  purchaseDate: number;                                 // Unix timestamp (seconds)
  kitchenLocation: "pantry" | "fridge" | "freezer" | "spicecabinet";
  imageUrl: string;                                     // Resolved image URL from library or override
  shelfLifeDays: number;                                // Shelf-life metadata from the food library
}
```

The hook combines three data sources:

1. `households.inventory` documents from Convex (household-specific quantities, purchase dates, locations).
2. `foodLibrary` documents from Convex (multilingual names, imagery, shelf-life data).
3. The user's preferred language (for localized labels).

Refer to `hooks/useInventoryDisplay.ts` for the mapping logic.

## Integration Guide

### Step 1: Import Required Components

```tsx
import { Rail } from "@/components/Rail";
import { useInventoryDisplay } from "@/hooks/useInventoryDisplay";
```

### Step 2: Prepare Data

Use the hook to retrieve localized items and map them into the structure the rail expects:

```tsx
const { inventoryItems } = useInventoryDisplay();

const decoratedInventoryDisplayItems = useMemo(
  () =>
    inventoryItems.map((item, index) => ({
      id: `${item.itemCode}-${index}`,
      data: item,
    })),
  [inventoryItems],
);
```

### Step 3: Filter Items (Optional)

Group items by category or other criteria:

```tsx
const freshProduceItems = decoratedInventoryDisplayItems.filter(
  ({ data }) => data.category === "Tree Fruits" || data.category === "Berries"
);

const pantryItems = decoratedInventoryDisplayItems.filter(
  ({ data }) => data.category === "Rice" || data.category === "Pasta"
);
```

### Step 4: Add Event Handlers

```tsx
const handleItemPress = (itemId: string, item: InventoryDisplayItem) => {
  console.log("Item pressed:", itemId, item.displayName);
  // Navigate to detail screen or show modal
};

const handleSeeAll = (category: string) => {
  console.log("See all pressed for:", category);
  // Navigate to category list screen
};
```

### Step 5: Render Rails

```tsx
<ScrollView>
  <Rail
    header="Fresh Produce"
    subheader="Fruits and berries in your kitchen"
    items={freshProduceItems}
    variant="compact"
    onSeeAll={() => handleSeeAll("Fresh Produce")}
    onItemPress={handleItemPress}
  />

  {/* Add more rails as needed */}
</ScrollView>
```

## Customization Guide

### Adding New Card Variants

1. **Create New Card Component**

   ```tsx
   // components/cards/CustomCard.tsx
   import React from 'react';
   import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
   import type { InventoryDisplayItem } from '@/types/food';
   import { useTheme } from '@/contexts/ThemeContext';

   interface CustomCardProps {
     item: InventoryDisplayItem;
     itemId: string;
     onPress?: () => void;
   }

   export const CustomCard: React.FC<CustomCardProps> = ({ item, itemId, onPress }) => {
     const { colors } = useTheme();

     return (
       <Pressable onPress={onPress} style={[styles.container, { backgroundColor: colors.surface }]}>
         {/* Your custom layout here */}
       </Pressable>
     );
   };

   const styles = StyleSheet.create({
     container: {
       width: 200, // Define your custom width
       // ... other styles
     },
   });
   ```

2. **Update Rail Component**

   Add import:
   ```tsx
   import { CustomCard } from './cards/CustomCard';
   ```

   Update type definition:
   ```tsx
   export type CardVariant = 'compact' | 'standard' | 'detailed' | 'custom';
   ```

   Add case to `renderCard`:
   ```tsx
   case 'custom':
     return <CustomCard key={id} itemId={id} item={item} onPress={handlePress} />;
   ```

   Update snap interval calculation:
   ```tsx
   snapToInterval={
     variant === 'compact' ? 132 :
     variant === 'standard' ? 172 :
     variant === 'detailed' ? 252 :
     variant === 'custom' ? 212 : // card width + margin
     172
   }
   ```

### Modifying Existing Cards

#### Change Card Dimensions

Update the `width` in the card's StyleSheet:

```tsx
const styles = StyleSheet.create({
  container: {
    width: 180, // Change from 160
    // ...
  },
});
```

Remember to update the Rail's `snapToInterval` value accordingly.

#### Customize Colors

Cards automatically use theme colors from `ThemeContext`:
- `colors.surface` - Card background
- `colors.text` - Primary text
- `colors.textSecondary` - Secondary text
- `colors.primary` - Accent colors

To add custom colors, access them from the theme:

```tsx
const { colors } = useTheme();
<View style={{ backgroundColor: colors.customColor }} />
```

#### Add New Fields

1. Update the display in the card component
2. Ensure the data is available in `InventoryDisplayItem` interface
3. Add the field to test data if needed

### Changing Date Formats

Date formatting is handled in individual card components:

```tsx
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric' // Add or remove as needed
  });
};
```

### Adjusting Expiry Logic (DetailedCard)

Modify the `getDaysUntilExpiry` function:

```tsx
const getDaysUntilExpiry = (purchaseDate: number) => {
  const now = Date.now();
  const purchase = purchaseDate * 1000;
  const shelfLife = 14; // Change from 7 to 14 days
  const expiryDate = purchase + (shelfLife * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((expiryDate - now) / (24 * 60 * 60 * 1000));
  return daysLeft;
};
```

Adjust color thresholds:

```tsx
const expiryColor =
  daysLeft <= 3 ? '#ef4444' :  // Red: 3 or fewer days
  daysLeft <= 7 ? '#f59e0b' :  // Orange: 4-7 days
  '#10b981';                    // Green: 8+ days
```

## Best Practices

### Performance

1. **Memoization**: Consider memoizing filtered item arrays if they're computed from large datasets
   ```tsx
   const freshProduceItems = useMemo(
     () => inventoryItems.filter(({ data }) =>
       data.category === "Tree Fruits" || data.category === "Berries"
     ),
     [inventoryItems]
   );
   ```

2. **Image Optimization**: Use properly sized images (400×400px as per test data)

3. **Limit Items**: For performance, consider limiting rail items to 10-20 per rail

### Accessibility

1. **Add Labels**: Include `accessibilityLabel` props on interactive elements
   ```tsx
   <Pressable
     accessibilityLabel={`View details for ${item.displayNameEnglish}`}
     onPress={onPress}
   >
   ```

2. **Screen Reader Support**: Ensure important information is accessible
   ```tsx
   <Text accessibilityRole="header">{header}</Text>
   ```

### UX Considerations

1. **Loading States**: Add loading indicators when fetching real data
2. **Empty States**: Display helpful messages when rails have no items
3. **Error Handling**: Gracefully handle missing images or data
4. **Responsive Design**: Test on various screen sizes

## Testing

### Manual Testing Checklist

- [ ] Cards render with correct data
- [ ] Horizontal scrolling works smoothly
- [ ] Press feedback is visible
- [ ] "See All" button appears when handler provided
- [ ] Item press callbacks fire correctly
- [ ] Theme colors apply correctly in different themes
- [ ] Snap-to-interval works for all variants
- [ ] Images load properly
- [ ] Text truncates correctly (no overflow)
- [ ] Shadows/elevation display on all platforms

### Sample Data Verification

The Convex seeding utilities load 15 canonical items spanning multiple categories:
- **4 Produce items** (tree fruits and berries)
- **3 Protein items** (poultry and beef cuts)
- **4 Pantry staples** (bread, rice, pasta, oils)
- **3 Dairy or dairy-adjacent items** (cheeses, butter, almond milk)
- **1 Beverage alternative**

## Real Data Integration

When integrating with Convex or other backend:

1. **Update Data Source**

   Replace test data import:
   ```tsx
   // Remove: import { testInventory } from "@/data/testInventory";

   // Add: useInventoryDisplay (handles Convex queries internally)
   const { inventoryItems, isLoading } = useInventoryDisplay();
   ```

2. **Map Data Format**

   Ensure backend data matches `InventoryDisplayItem` interface or map it:
   ```tsx
   const mappedItems = inventoryItems.map((item, index) => ({
     id: `${item.itemCode}-${index}`,
     data: item,
   }));
   ```

3. **Handle Loading States**

   ```tsx
  if (isLoading) {
    return <LoadingSpinner />;
  }
   ```

4. **Update Schema**

   Ensure your Convex schema includes all required fields from `InventoryDisplayItem`

## Future Enhancements

Potential improvements to consider:

1. **Virtualization**: For very long lists, implement FlatList with horizontal orientation
2. **Animations**: Add enter/exit animations for items
3. **Drag to Reorder**: Allow users to reorder items within rails
4. **Pull to Refresh**: Add refresh capability to rails
5. **Infinite Scroll**: Load more items as user scrolls
6. **Search/Filter**: Add search bar above rails
7. **Sort Options**: Allow sorting by date, quantity, name, etc.
8. **Localization**: Support for multiple languages in display names
9. **Gestures**: Swipe-to-delete or swipe-to-mark-as-used
10. **Card Transitions**: Animate between card variants

## Troubleshooting

### Cards Not Displaying

- Verify imports are correct
- Check that items array is not empty
- Ensure ThemeContext is provided in app root

### Images Not Loading

- Verify `imageUrl` is valid
- Check network connectivity
- Add error handling for failed image loads

### Snap-to-Interval Not Working

- Verify `snapToInterval` matches card width + margin
- Check that `decelerationRate="fast"` is set

### Theme Colors Not Applying

- Ensure `ThemeProvider` wraps the component tree
- Verify theme colors are defined in theme configuration

### TypeScript Errors

- Ensure all interfaces are properly imported
- Check that data structure matches `InventoryDisplayItem` interface
- Verify generic types in event handlers

## Support

For questions or issues:
1. Check this documentation
2. Review component source code
3. Consult React Native and Expo documentation
4. Check TypeScript types for proper usage

---

**Created**: October 2024
**Last Updated**: October 2024
**Version**: 1.0.0
