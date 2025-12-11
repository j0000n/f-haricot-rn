import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Add your custom properties below:
    age: v.optional(v.number()),      // Example: add 'age' as an optional number
    profileCompleted: v.optional(v.boolean()), // Example: add 'profileCompleted' as an optional boolean
    onboardingCompleted: v.optional(v.boolean()),
    dietaryRestrictions: v.optional(v.array(v.string())),
    customDiet: v.optional(
      v.union(
        v.null(),
        v.object({
          name: v.string(),
          description: v.optional(v.string()),
        })
      )
    ),
    allergies: v.optional(v.array(v.string())),
    householdSize: v.optional(v.number()),
    householdId: v.optional(v.id("households")),
    favoriteCuisines: v.optional(v.array(v.string())),
    cookingStylePreferences: v.optional(v.array(v.string())),
    mealPlanningPreferences: v.optional(v.array(v.string())),
    preferredTheme: v.optional(v.union(v.string(), v.null())),
    customThemeShareCode: v.optional(v.union(v.string(), v.null())),
    preferredTextSize: v.optional(
      v.union(
        v.literal("extraSmall"),
        v.literal("base"),
        v.literal("large"),
        v.literal("extraLarge")
      )
    ),
    dyslexiaMode: v.optional(v.boolean()),
    highContrastMode: v.optional(
      v.union(
        v.literal("off"),
        v.literal("light"),
        v.literal("dark"),
        v.boolean()
      )
    ),
    motionPreference: v.optional(
      v.union(v.literal("system"), v.literal("reduce"), v.literal("standard"))
    ),
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
    ),
    lastPendingApprovalSeenAt: v.optional(v.number()),
    pendingHouseholdId: v.optional(v.id("households")),
    userType: v.optional(
      v.union(v.literal(""), v.literal("creator"), v.literal("vendor"))
    ),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
  households: defineTable({
    code: v.string(),
    ownerId: v.id("users"),
    members: v.array(v.id("users")),
    pendingMembers: v.optional(
      v.array(
        v.object({
          userId: v.id("users"),
          requestedAt: v.number(),
        })
      )
    ),
    inventory: v.optional(
      v.array(
        v.object({
          itemCode: v.string(),
          varietyCode: v.optional(v.string()),
          quantity: v.number(),
          purchaseDate: v.number(),
          note: v.optional(v.string()),
          imageUrlOverride: v.optional(v.string()),
        })
      )
    ),
    children: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          allergies: v.array(v.string()),
          createdAt: v.number(),
        })
      )
    ),
    createdAt: v.number(),
  }).index("by_code", ["code"]),
  foodLibrary: defineTable({
    code: v.string(),
    namespace: v.string(),
    name: v.string(),
    translations: v.object({
      en: v.object({
        singular: v.string(),
        plural: v.string(),
      }),
      es: v.object({
        singular: v.string(),
        plural: v.string(),
      }),
      zh: v.object({
        singular: v.string(),
        plural: v.string(),
      }),
      fr: v.object({
        singular: v.string(),
        plural: v.string(),
      }),
      ar: v.object({
        singular: v.string(),
        plural: v.string(),
      }),
      ja: v.object({
        singular: v.string(),
        plural: v.string(),
      }),
      vi: v.object({
        singular: v.string(),
        plural: v.string(),
      }),
      tl: v.object({
        singular: v.string(),
        plural: v.string(),
      }),
    }),
    category: v.string(),
    categoryTranslations: v.object({
      en: v.string(),
      es: v.string(),
      zh: v.string(),
      fr: v.string(),
      ar: v.string(),
      ja: v.string(),
      vi: v.string(),
      tl: v.string(),
    }),
    defaultImageUrl: v.string(),
    emoji: v.optional(v.string()),
    shelfLifeDays: v.number(),
    storageLocation: v.union(
      v.literal("pantry"),
      v.literal("fridge"),
      v.literal("freezer"),
      v.literal("spicecabinet")
    ),
    storageTips: v.string(),
    varieties: v.array(
      v.object({
        code: v.string(),
        translations: v.object({
          en: v.string(),
          es: v.string(),
          zh: v.string(),
          fr: v.string(),
          ar: v.string(),
          ja: v.string(),
          vi: v.string(),
          tl: v.string(),
        }),
        defaultImageUrl: v.optional(v.string()),
      })
    ),
    nutritionPer100g: v.object({
      calories: v.number(),
      macronutrients: v.object({
        protein: v.number(),
        carbohydrates: v.number(),
        fat: v.number(),
        fiber: v.optional(v.number()),
        sugars: v.optional(v.number()),
      }),
      micronutrients: v.optional(
        v.array(
          v.object({
            label: v.string(),
            amount: v.number(),
            unit: v.string(),
            dailyValuePercent: v.optional(v.number()),
          })
        )
      ),
    }),
    densityHints: v.optional(
      v.object({
        gramsPerMilliliter: v.optional(v.number()),
        gramsPerPiece: v.optional(v.number()),
        defaultUnit: v.optional(
          v.union(v.literal("g"), v.literal("ml"), v.literal("piece"))
        ),
      })
    ),
  })
    .index("by_code", ["code"])
    .index("by_namespace", ["namespace"]),
  recipes: defineTable({
    recipeName: v.object({
      en: v.string(),
      es: v.string(),
      zh: v.string(),
      fr: v.string(),
      ar: v.string(),
      ja: v.string(),
      vi: v.string(),
      tl: v.string(),
    }),
    description: v.object({
      en: v.string(),
      es: v.string(),
      zh: v.string(),
      fr: v.string(),
      ar: v.string(),
      ja: v.string(),
      vi: v.string(),
      tl: v.string(),
    }),
    ingredients: v.array(
      v.object({
        foodCode: v.string(),
        varietyCode: v.optional(v.string()),
        quantity: v.number(),
        unit: v.string(),
        preparation: v.optional(v.string()),
        displayQuantity: v.optional(v.string()),
        displayUnit: v.optional(v.string()),
        normalizedQuantity: v.optional(v.number()),
        normalizedUnit: v.optional(
          v.union(v.literal("g"), v.literal("ml"), v.literal("count"))
        ),
        originalText: v.optional(v.string()),
        validation: v.optional(
          v.object({
            status: v.union(
              v.literal("matched"),
              v.literal("ambiguous"),
              v.literal("missing")
            ),
            suggestions: v.optional(v.array(v.string())),
          })
        ),
      })
    ),
    sourceSteps: v.optional(
      v.array(
        v.object({
          stepNumber: v.number(),
          text: v.string(),
          timeInMinutes: v.optional(v.number()),
          temperature: v.optional(
            v.object({
              value: v.number(),
              unit: v.union(v.literal("F"), v.literal("C")),
            }),
          ),
        })
      )
    ),
    emojiTags: v.array(v.string()),
    prepTimeMinutes: v.number(),
    cookTimeMinutes: v.number(),
    totalTimeMinutes: v.number(),
    servings: v.number(),
    sourceHost: v.optional(v.string()),
    authorName: v.optional(v.string()),
    authorWebsite: v.optional(v.string()),
    authorSocial: v.optional(
      v.object({
        instagram: v.optional(v.string()),
        pinterest: v.optional(v.string()),
        youtube: v.optional(v.string()),
        facebook: v.optional(v.string()),
      }),
    ),
    authorSocialInstagram: v.optional(v.string()),
    authorSocialPinterest: v.optional(v.string()),
    authorSocialYoutube: v.optional(v.string()),
    authorSocialFacebook: v.optional(v.string()),
    source: v.optional(v.union(
      v.literal("website"),
      v.literal("audio"),
      v.literal("text"),
      v.literal("photograph"),
      v.literal("instagram"),
      v.literal("tiktok"),
      v.literal("pinterest"),
      v.literal("youtube"),
      v.literal("cookbook"),
      v.literal("magazine"),
      v.literal("newspaper"),
      v.literal("recipe_card"),
      v.literal("handwritten"),
      v.literal("voice_note"),
      v.literal("video"),
      v.literal("facebook"),
      v.literal("twitter"),
      v.literal("reddit"),
      v.literal("blog"),
      v.literal("podcast"),
      v.literal("other")
    )),
    sourceUrl: v.string(),
    attribution: v.object({
      source: v.string(),
      sourceUrl: v.string(),
      author: v.optional(v.string()),
      authorName: v.optional(v.string()),
      authorWebsite: v.optional(v.string()),
      authorSocial: v.optional(
        v.object({
          instagram: v.optional(v.string()),
          pinterest: v.optional(v.string()),
          youtube: v.optional(v.string()),
          facebook: v.optional(v.string()),
        }),
      ),
      sourceHost: v.optional(v.string()),
      dateRetrieved: v.string(),
    }),
    imageUrls: v.optional(v.array(v.string())),
    originalImageLargeStorageId: v.optional(v.id("_storage")),
    originalImageSmallStorageId: v.optional(v.id("_storage")),
    transparentImageLargeStorageId: v.optional(v.id("_storage")),
    transparentImageSmallStorageId: v.optional(v.id("_storage")),
    encodedSteps: v.string(),
    encodingVersion: v.string(),
    foodItemsAdded: v.optional(v.array(v.id("foodLibrary"))),
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.optional(v.id("users")),
    isPublic: v.boolean(),
  })
    .index("by_emoji_tags", ["emojiTags"])
    .index("by_total_time", ["totalTimeMinutes"])
    .index("by_created_at", ["createdAt"])
    .index("by_source_host", ["sourceHost"])
    .index("by_author_name", ["authorName"])
    .index("by_author_instagram", ["authorSocialInstagram"])
    .index("by_author_pinterest", ["authorSocialPinterest"])
    .index("by_author_youtube", ["authorSocialYoutube"])
    .index("by_author_facebook", ["authorSocialFacebook"]),
  translationGuides: defineTable({
    code: v.string(),
    language: v.string(),
    text: v.string(),
    context: v.optional(v.string()),
    description: v.optional(v.string()),
  })
    .index("by_code", ["code"])
    .index("by_language", ["language"]),
  nutritionProfiles: defineTable({
    recipeId: v.id("recipes"),
    servings: v.number(),
    perServing: v.object({
      calories: v.number(),
      macronutrients: v.object({
        protein: v.number(),
        carbohydrates: v.number(),
        fat: v.number(),
        fiber: v.optional(v.number()),
        sugars: v.optional(v.number()),
      }),
      micronutrients: v.optional(
        v.array(
          v.object({
            label: v.string(),
            amount: v.number(),
            unit: v.string(),
            dailyValuePercent: v.optional(v.number()),
          })
        )
      ),
    }),
    encodingVersion: v.optional(v.string()),
    computedAt: v.number(),
  }).index("by_recipe", ["recipeId"]),
  tasks: defineTable({
    title: v.string(),
    description: v.string(),
    isCompleted: v.boolean(),
    userId: v.id("users"),
    // Multilingual display text for tasks
    displayTextEnglish: v.optional(v.string()),
    displayTextSpanish: v.optional(v.string()),
    displayTextChinese: v.optional(v.string()),
    displayTextFrench: v.optional(v.string()),
    displayTextTagalog: v.optional(v.string()),
    displayTextVietnamese: v.optional(v.string()),
    displayTextArabic: v.optional(v.string()),
    // Multilingual description for tasks
    descriptionEnglish: v.optional(v.string()),
    descriptionSpanish: v.optional(v.string()),
    descriptionChinese: v.optional(v.string()),
    descriptionFrench: v.optional(v.string()),
    descriptionTagalog: v.optional(v.string()),
    descriptionVietnamese: v.optional(v.string()),
    descriptionArabic: v.optional(v.string()),
  }).index("by_user", ["userId"]),
  qrEvents: defineTable({
    userId: v.id("users"),
    payload: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    accuracy: v.optional(v.number()),
    scannedAt: v.number(),
    pairedAt: v.optional(v.number()),
    pairedWith: v.optional(v.id("qrEvents")),
  })
    .index("by_payload", ["payload"])
    .index("by_user", ["userId"]),
  customThemes: defineTable({
    name: v.string(),
    shareCode: v.string(),
    creatorId: v.id("users"),
    isPublic: v.boolean(),
    // Theme tokens
    colors: v.object({
      background: v.string(),
      surface: v.string(),
      overlay: v.string(),
      textPrimary: v.string(),
      textSecondary: v.string(),
      textMuted: v.string(),
      border: v.string(),
      accent: v.string(),
      accentOnPrimary: v.string(),
      success: v.string(),
      danger: v.string(),
      info: v.string(),
      logoFill: v.optional(v.string()),
      imageBackgroundColor: v.optional(v.string()),
    }),
    spacing: v.object({
      xxs: v.number(),
      xs: v.number(),
      sm: v.number(),
      md: v.number(),
      lg: v.number(),
      xl: v.number(),
      xxl: v.number(),
    }),
    padding: v.object({
      screen: v.number(),
      section: v.number(),
      card: v.number(),
      compact: v.number(),
    }),
    radii: v.object({
      sm: v.number(),
      md: v.number(),
      lg: v.number(),
    }),
    typography: v.object({
      title: v.number(),
      heading: v.number(),
      subheading: v.number(),
      body: v.number(),
      small: v.number(),
      tiny: v.number(),
    }),
    fontFamilies: v.object({
      display: v.string(),
      regular: v.string(),
      light: v.string(),
      lightItalic: v.string(),
      medium: v.string(),
      semiBold: v.string(),
      bold: v.string(),
    }),
    logoAsset: v.string(), // Path to the logo asset
    tabBar: v.optional(v.object({
      containerBackground: v.string(),
      slotBackground: v.string(),
      list: v.object({
        paddingHorizontal: v.number(),
        paddingVertical: v.number(),
        marginHorizontal: v.number(),
        marginBottom: v.number(),
        borderRadius: v.number(),
        backgroundColor: v.string(),
        borderWidth: v.number(),
        borderColor: v.string(),
        shadow: v.union(v.literal("card"), v.literal("floating"), v.null()),
      }),
      trigger: v.object({
        paddingHorizontal: v.number(),
        paddingVertical: v.number(),
        borderRadius: v.number(),
        minHeight: v.number(),
        squareSize: v.optional(v.number()),
        shape: v.union(v.literal("pill"), v.literal("square")),
        inactiveBackgroundColor: v.string(),
        activeBackgroundColor: v.string(),
      }),
      label: v.object({
        show: v.boolean(),
        color: v.string(),
        activeColor: v.string(),
        uppercase: v.boolean(),
        letterSpacing: v.number(),
        marginLeftWithIcon: v.number(),
      }),
      icon: v.optional(v.object({
        show: v.boolean(),
        family: v.string(),
        size: v.number(),
        inactiveColor: v.string(),
        activeColor: v.string(),
        names: v.object({
          home: v.string(),
          kitchen: v.string(),
          lists: v.string(),
        }),
      })),
    })),
  })
    .index("by_share_code", ["shareCode"])
    .index("by_creator", ["creatorId"]),
  continents: defineTable({
    name: v.string(),
    slug: v.string(),
  }).index("by_slug", ["slug"]),
  regions: defineTable({
    continentId: v.id("continents"),
    name: v.string(),
    slug: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_continent", ["continentId"]),
  countries: defineTable({
    regionId: v.id("regions"),
    name: v.string(),
    slug: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_region", ["regionId"]),
  subregions: defineTable({
    countryId: v.id("countries"),
    name: v.string(),
    slug: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_country", ["countryId"]),
  cities: defineTable({
    countryId: v.id("countries"),
    subregionId: v.optional(v.id("subregions")),
    name: v.string(),
    slug: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_country", ["countryId"])
    .index("by_subregion", ["subregionId"]),
});

export default schema;
