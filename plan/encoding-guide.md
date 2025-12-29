# Recipe Encoding Guide
## Universal Recipe Encoding System (URES) v4.6

## Quick Start

The Universal Recipe Encoding System encodes recipes as language-agnostic operations that can be perfectly translated to any language.

### Basic Example
**Natural Language**: "Dice 2 onions and sautÃ© them in olive oil for 5 minutes until golden"

**Encoded Form**:
```
1.11.003.form.diced @quantity:2 -> T.03.003 @with:5.70.001 @time:5min @until:cue.golden
```

## Encoding Structure

### 1. Food Item Codes

Format: `X.YY.ZZZ`
- X = Namespace (1-9)
- YY = Subcategory (01-99)
- ZZZ = Item number (001-999)

Example: `1.11.003` = Produce (1) â†’ Root Vegetables (11) â†’ Onion (003)

### 2. Qualifiers

Qualifiers modify food items and follow strict ordering:
```
variety â†’ form â†’ prep â†’ state â†’ attribute
```

#### Valid Qualifiers

**Varieties** (cultivar/type):
```
1.01.001.granny_smith  # Granny Smith apple
2.21.001.angus        # Angus beef
```

**Forms** (physical presentation):
```
.form.sliced      # Cut into slices
.form.diced       # Cut into small cubes
.form.julienne    # Cut into matchsticks
.form.ground      # Ground/minced
```

**Preps** (irreversible processing):
```
.prep.roasted     # Cooked by roasting
.prep.marinated   # Soaked in marinade
.prep.caramelized # Browned with sugar
```

**States** (current condition):
```
.state.frozen     # Temperature state
.state.raw        # Uncooked
.state.softened   # Texture state
```

**Attributes** (enduring qualities):
```
.attribute.grade.prime           # Quality grade
.attribute.doneness.medium_rare  # Cooking doneness
.attribute.certification.organic # Certification
```

### 3. Parameters

Parameters provide additional information using @ symbol:

| Parameter | Purpose | Example |
|-----------|---------|---------|
| @quantity | Amount | @quantity:2 |
| @temp | Temperature | @temp:350F or @temp:175C |
| @time | Duration | @time:20min |
| @until | Endpoint condition | @until:cue.golden |
| @with | Agent/medium | @with:5.70.001 (olive oil) |
| @what | Target item | @what:mixture_a |
| @to | Destination | @to:KT.04.001 (bowl) |
| @from | Source | @from:container_1 |
| @zone | Spatial location | @zone:center |
| @label | Create identifier | @label:sauce_base |
| @ref | Reference identifier | @ref:sauce_base |
| @speed | Speed setting | @speed:medium |
| @power | Power setting | @power:high |
| @per | Scope | @per:side |
| @interval | Frequency | @interval:5min |
| @taste | To taste | @taste |
| @optional | Optional component | @optional |

### 4. Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| + | Combine/AND | item1 + item2 |
| -> | Then/sequence | step1 -> step2 |
| \|\| | Alternative | method1 \|\| method2 |
| * | Multiply/repeat | *3 (repeat 3 times) |
| / | Divide/portion | /4 (divide into 4) |
| () | Grouping | (A + B) -> C |
| [] | Concurrent | [step1 + step2] |
| {} | Conditional | {if_crispy -> remove} |
| = | Yields/becomes | -> =sauce |
| ~ | Approximately | ~30min |
| ! | Critical/safety | !@temp:165F |

## Encoding Process

### Step 1: Identify Ingredients

Map each ingredient to its code:
- "onion" â†’ 1.11.003
- "olive oil" â†’ 5.70.001
- "chicken breast" â†’ 2.20.001.form.breast

### Step 2: Apply Qualifiers

Add qualifiers in the correct order:
```
1.11.003.form.diced           # Diced onion
2.20.001.form.breast.state.raw # Raw chicken breast
```

### Step 3: Add Quantities

Use @quantity parameter:
```
1.11.003.form.diced @quantity:2cups
2.20.001.form.breast @quantity:4pieces
```

### Step 4: Encode Actions

Map cooking actions to techniques:
- "sautÃ©" â†’ T.03.003
- "boil" â†’ T.03.001
- "bake" â†’ T.03.006

### Step 5: Add Parameters

Include all relevant parameters:
```
T.03.003 @temp:medium @time:5min @until:cue.translucent
```

### Step 6: Sequence Operations

Use operators to show order:
```
A.01.001 1.11.003.form.diced -> T.03.003 @time:5min
```

## Complete Recipe Example

### Original Recipe:
"Season chicken breasts with salt and pepper. Heat olive oil in a pan over medium heat. SautÃ© diced onions until translucent. Add chicken and cook 6 minutes per side until golden. Rest for 5 minutes before serving."

### Encoded Recipe:
```
# Mise en place
@label:chicken 2.20.001.form.breast @quantity:4
@label:seasoning (5.73.001 + 5.73.002) @taste
@label:onions 1.11.003.form.diced @quantity:1cup
@label:oil 5.70.001 @quantity:2tbsp

# Cooking sequence
A.05.012 @ref:chicken @with:@ref:seasoning ->
KT.03.003 @zone:stovetop @power:medium ->
A.01.001 @ref:oil @to:KT.04.009 ->
T.03.003 @ref:onions @until:cue.translucent ->
A.01.001 @ref:chicken ->
T.03.003 @time:6min @per:side @until:cue.golden ->
A.04.010 @time:5min
```

## Advanced Encoding Patterns

### Concurrent Operations
Use brackets for simultaneous tasks:
```
[T.03.001 4.62.001 @time:10min + T.03.003 1.11.003.form.diced]
```
(Boil pasta while sautÃ©ing onions)

### Conditional Operations
Use braces for conditions:
```
{@until:texture.tender -> A.01.002}
```
(When tender, remove)

### Composite Techniques
Reference complex techniques:
```
CT.02.001 @ref:steak  # Execute reverse-sear technique
```

### Nested Operations
Group related operations:
```
(A.01.001 3.50.005 + T.02.001 @speed:medium) -> T.03.006
```
(Add cream and mix at medium speed, then bake)

## Validation Rules

### 1. Qualifier Order
âœ… Correct: `1.01.001.granny_smith.form.sliced.state.fresh`
âŒ Wrong: `1.01.001.state.fresh.form.sliced.granny_smith`

### 2. Mutual Exclusions
âŒ Invalid: `state.frozen + state.hot`
âŒ Invalid: `state.raw + attribute.doneness.medium`
âœ… Valid: `state.cooked + attribute.doneness.medium`

### 3. Parameter Requirements
- @until MUST have namespace: `@until:cue.golden` âœ…
- Not: `@until:golden` âŒ

### 4. Snake Case Convention
âœ… Correct: `sweet_potato`, `extra_virgin`
âŒ Wrong: `sweet-potato`, `extra virgin`

## Common Patterns

### Mise en Place Section
Start recipes with ingredient preparation:
```
@label:veggie_mix (1.11.001.form.diced + 1.15.002.form.diced + 1.11.003.form.diced)
@label:spice_blend (5.73.006 + 5.73.007 + 5.73.008) @quantity:1tsp:each
```

### Marinading Pattern
```
A.01.004 @ref:protein @with:@ref:marinade ->
A.04.012 @time:2hr @zone:refrigerator
```

### Deglazing Pattern
```
A.05.001 @with:6.84.002.white @quantity:1/2cup ->
T.03.002 @until:state.reduced/2
```

### Layering Pattern
```
A.01.001 @ref:sauce @to:KT.04.005 ->
A.01.001 @ref:pasta @zone:top ->
A.01.001 @ref:cheese @zone:surface ->
*repeat_layers
```

## Encoding Tools

### Validation Checklist
- [ ] All food items have valid codes
- [ ] Qualifiers in correct order
- [ ] Parameters include required namespaces
- [ ] Mutual exclusions respected
- [ ] Snake_case used throughout
- [ ] Quantities specified where needed
- [ ] Techniques have required parameters
- [ ] Labels defined before references

### Common Technique Codes
```
T.03.001 - Boil
T.03.002 - Simmer
T.03.003 - SautÃ©
T.03.004 - Sear
T.03.005 - Steam
T.03.006 - Bake
T.03.007 - Roast
T.03.008 - Broil
T.03.009 - Grill
T.03.010 - Fry
```

### Common Action Codes
```
A.01.001 - Add
A.01.002 - Remove
A.01.003 - Transfer
A.01.004 - Combine
A.01.005 - Separate
A.02.001 - Stir
A.02.002 - Whisk
A.02.003 - Fold
A.04.001 - Cool
A.04.002 - Rest
```

## Error Prevention

### Common Mistakes to Avoid

1. **Wrong qualifier type**:
   - âŒ `1.11.002.form.mashed` (mashed is prep, not form)
   - âœ… `1.11.002.prep.mashed`

2. **Missing namespace in @until**:
   - âŒ `@until:golden`
   - âœ… `@until:cue.golden`

3. **Hyphenated names**:
   - âŒ `sweet-potato`, `stir-fried`
   - âœ… `sweet_potato`, `stir_fried`

4. **Conflicting states**:
   - âŒ `state.raw.attribute.doneness.medium`
   - âœ… `state.cooked.attribute.doneness.medium`

5. **Out-of-order qualifiers**:
   - âŒ `form.sliced.granny_smith`
   - âœ… `granny_smith.form.sliced`

## Best Practices

1. **Be Explicit**: Include all relevant parameters
2. **Use Labels**: Create readable references for complex ingredients
3. **Group Operations**: Use parentheses for clarity
4. **Validate Early**: Check encoding as you write
5. **Comment Sections**: Add # comments for recipe sections
6. **Test Decodability**: Ensure recipe can be decoded unambiguously

## Conclusion

The encoding system prioritizes precision, consistency, and language independence. By following these guidelines, recipes become programmatically processable while maintaining all culinary nuance.
