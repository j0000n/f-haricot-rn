export interface InventoryItem {
  name: string;
  displayNameEnglish: string;
  displayNameFrench: string;
  displayNameArabic: string;
  displayNameMandarin: string;
  displayNameSpanish: string;
  category: string;
  variety: {
    name: string;
    displayNameEnglish: string;
    displayNameFrench: string;
    displayNameArabic: string;
    displayNameMandarin: string;
    displayNameSpanish: string;
  };
  imageUrl: string;
  purchaseDate: number;
  quantity: number;
  kitchenLocation: string;
}

export const testInventory: Record<string, InventoryItem> = {
  "1.11.003": {
    name: "yellow onion",
    displayNameEnglish: "Yellow onion",
    displayNameFrench: "Oignon jaune",
    displayNameArabic: "بصلة صفراء",
    displayNameMandarin: "黄洋葱",
    displayNameSpanish: "Cebolla amarilla",
    category: "Alliums",
    variety: {
      name: "yellow",
      displayNameEnglish: "Yellow",
      displayNameFrench: "Jaune",
      displayNameArabic: "صفراء",
      displayNameMandarin: "黄",
      displayNameSpanish: "Amarilla",
    },
    imageUrl: "https://placehold.net/400x400.png",
    purchaseDate: 1731456000,
    quantity: 6,
    kitchenLocation: "pantry",
  },
  "5.70.001": {
    name: "olive oil",
    displayNameEnglish: "Olive oil",
    displayNameFrench: "Huile d'olive",
    displayNameArabic: "زيت زيتون",
    displayNameMandarin: "橄榄油",
    displayNameSpanish: "Aceite de oliva",
    category: "Oils",
    variety: {
      name: "extra_virgin",
      displayNameEnglish: "Extra virgin",
      displayNameFrench: "Extra vierge",
      displayNameArabic: "بكر ممتاز",
      displayNameMandarin: "特级初榨",
      displayNameSpanish: "Extra virgen",
    },
    imageUrl: "https://placehold.net/400x400.png",
    purchaseDate: 1730947200,
    quantity: 1,
    kitchenLocation: "pantry",
  },
  "4.60.003": {
    name: "long-grain rice",
    displayNameEnglish: "Long-grain rice",
    displayNameFrench: "Riz long grain",
    displayNameArabic: "أرز حبة طويلة",
    displayNameMandarin: "长粒米",
    displayNameSpanish: "Arroz de grano largo",
    category: "Grains",
    variety: {
      name: "basmati",
      displayNameEnglish: "Basmati",
      displayNameFrench: "Basmati",
      displayNameArabic: "بسمتي",
      displayNameMandarin: "巴斯马蒂",
      displayNameSpanish: "Basmati",
    },
    imageUrl: "https://placehold.net/400x400.png",
    purchaseDate: 1730860800,
    quantity: 2,
    kitchenLocation: "pantry",
  },
};
