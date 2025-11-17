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
  "1.01.007": {
    "name": "peach",
    "displayNameEnglish": "Peach",
    "displayNameFrench": "Pêche",
    "displayNameArabic": "خوخ",
    "displayNameMandarin": "桃",
    "displayNameSpanish": "Melocotón",
    "category": "Tree Fruits",
    "variety": {
      "name": "yellow",
      "displayNameEnglish": "Yellow",
      "displayNameFrench": "Jaune",
      "displayNameArabic": "أصفر",
      "displayNameMandarin": "黄色",
      "displayNameSpanish": "Amarillo"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730246400,
    "quantity": 5,
    "kitchenLocation": "fridge"
  },
  "1.01.008": {
    "name": "plum",
    "displayNameEnglish": "Plum",
    "displayNameFrench": "Prune",
    "displayNameArabic": "برقوق",
    "displayNameMandarin": "李子",
    "displayNameSpanish": "Ciruela",
    "category": "Tree Fruits",
    "variety": {
      "name": "black",
      "displayNameEnglish": "Black",
      "displayNameFrench": "Noir",
      "displayNameArabic": "أسود",
      "displayNameMandarin": "黑色",
      "displayNameSpanish": "Negro"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730160000,
    "quantity": 8,
    "kitchenLocation": "fridge"
  },
  "1.01.009": {
    "name": "apricot",
    "displayNameEnglish": "Apricot",
    "displayNameFrench": "Abricot",
    "displayNameArabic": "مشمش",
    "displayNameMandarin": "杏",
    "displayNameSpanish": "Albaricoque",
    "category": "Tree Fruits",
    "variety": {
      "name": "turkish",
      "displayNameEnglish": "Turkish",
      "displayNameFrench": "Turc",
      "displayNameArabic": "تركي",
      "displayNameMandarin": "土耳其",
      "displayNameSpanish": "Turco"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730332800,
    "quantity": 6,
    "kitchenLocation": "fridge"
  },
  "1.01.010": {
    "name": "cherry",
    "displayNameEnglish": "Cherry",
    "displayNameFrench": "Cerise",
    "displayNameArabic": "كرز",
    "displayNameMandarin": "樱桃",
    "displayNameSpanish": "Cereza",
    "category": "Tree Fruits",
    "variety": {
      "name": "bing",
      "displayNameEnglish": "Bing",
      "displayNameFrench": "Bing",
      "displayNameArabic": "بينغ",
      "displayNameMandarin": "宾樱桃",
      "displayNameSpanish": "Bing"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730073600,
    "quantity": 12,
    "kitchenLocation": "fridge"
  },
  "1.01.011": {
    "name": "nectarine",
    "displayNameEnglish": "Nectarine",
    "displayNameFrench": "Nectarine",
    "displayNameArabic": "نكتارين",
    "displayNameMandarin": "油桃",
    "displayNameSpanish": "Nectarina",
    "category": "Tree Fruits",
    "variety": {
      "name": "white",
      "displayNameEnglish": "White",
      "displayNameFrench": "Blanc",
      "displayNameArabic": "أبيض",
      "displayNameMandarin": "白色",
      "displayNameSpanish": "Blanco"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730419200,
    "quantity": 4,
    "kitchenLocation": "fridge"
  },
  "1.01.012": {
    "name": "fig",
    "displayNameEnglish": "Fig",
    "displayNameFrench": "Figue",
    "displayNameArabic": "تين",
    "displayNameMandarin": "无花果",
    "displayNameSpanish": "Higo",
    "category": "Tree Fruits",
    "variety": {
      "name": "black_mission",
      "displayNameEnglish": "Black Mission",
      "displayNameFrench": "Mission Noire",
      "displayNameArabic": "ميشن أسود",
      "displayNameMandarin": "黑任务",
      "displayNameSpanish": "Misión Negra"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1729987200,
    "quantity": 10,
    "kitchenLocation": "fridge"
  },
  "1.01.013": {
    "name": "persimmon",
    "displayNameEnglish": "Persimmon",
    "displayNameFrench": "Kaki",
    "displayNameArabic": "كاكي",
    "displayNameMandarin": "柿子",
    "displayNameSpanish": "Caqui",
    "category": "Tree Fruits",
    "variety": {
      "name": "fuyu",
      "displayNameEnglish": "Fuyu",
      "displayNameFrench": "Fuyu",
      "displayNameArabic": "فويو",
      "displayNameMandarin": "富有",
      "displayNameSpanish": "Fuyu"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730505600,
    "quantity": 3,
    "kitchenLocation": "fridge"
  },
  "1.01.014": {
    "name": "pomegranate",
    "displayNameEnglish": "Pomegranate",
    "displayNameFrench": "Grenade",
    "displayNameArabic": "رمان",
    "displayNameMandarin": "石榴",
    "displayNameSpanish": "Granada",
    "category": "Tree Fruits",
    "variety": {
      "name": "wonderful",
      "displayNameEnglish": "Wonderful",
      "displayNameFrench": "Merveilleux",
      "displayNameArabic": "رائع",
      "displayNameMandarin": "美妙",
      "displayNameSpanish": "Maravilloso"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730592000,
    "quantity": 2,
    "kitchenLocation": "fridge"
  },
  "1.02.001": {
    "name": "strawberry",
    "displayNameEnglish": "Strawberry",
    "displayNameFrench": "Fraise",
    "displayNameArabic": "فراولة",
    "displayNameMandarin": "草莓",
    "displayNameSpanish": "Fresa",
    "category": "Berries",
    "variety": {
      "name": "sweet",
      "displayNameEnglish": "Sweet",
      "displayNameFrench": "Sucré",
      "displayNameArabic": "حلو",
      "displayNameMandarin": "甜",
      "displayNameSpanish": "Dulce"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730678400,
    "quantity": 16,
    "kitchenLocation": "fridge"
  },
  "1.02.002": {
    "name": "blueberry",
    "displayNameEnglish": "Blueberry",
    "displayNameFrench": "Myrtille",
    "displayNameArabic": "توت أزرق",
    "displayNameMandarin": "蓝莓",
    "displayNameSpanish": "Arándano",
    "category": "Berries",
    "variety": {
      "name": "wild",
      "displayNameEnglish": "Wild",
      "displayNameFrench": "Sauvage",
      "displayNameArabic": "بري",
      "displayNameMandarin": "野生",
      "displayNameSpanish": "Silvestre"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730764800,
    "quantity": 20,
    "kitchenLocation": "fridge"
  },
  "1.02.003": {
    "name": "raspberry",
    "displayNameEnglish": "Raspberry",
    "displayNameFrench": "Framboise",
    "displayNameArabic": "توت العليق",
    "displayNameMandarin": "覆盆子",
    "displayNameSpanish": "Frambuesa",
    "category": "Berries",
    "variety": {
      "name": "red",
      "displayNameEnglish": "Red",
      "displayNameFrench": "Rouge",
      "displayNameArabic": "أحمر",
      "displayNameMandarin": "红色",
      "displayNameSpanish": "Rojo"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1729900800,
    "quantity": 12,
    "kitchenLocation": "fridge"
  },
  "2.01.001": {
    "name": "broccoli",
    "displayNameEnglish": "Broccoli",
    "displayNameFrench": "Brocoli",
    "displayNameArabic": "بروكلي",
    "displayNameMandarin": "西兰花",
    "displayNameSpanish": "Brócoli",
    "category": "Vegetables",
    "variety": {
      "name": "calabrese",
      "displayNameEnglish": "Calabrese",
      "displayNameFrench": "Calabrese",
      "displayNameArabic": "كالابريزي",
      "displayNameMandarin": "卡拉布里亚",
      "displayNameSpanish": "Calabrese"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730851200,
    "quantity": 2,
    "kitchenLocation": "fridge"
  },
  "2.01.002": {
    "name": "carrot",
    "displayNameEnglish": "Carrot",
    "displayNameFrench": "Carotte",
    "displayNameArabic": "جزر",
    "displayNameMandarin": "胡萝卜",
    "displayNameSpanish": "Zanahoria",
    "category": "Vegetables",
    "variety": {
      "name": "orange",
      "displayNameEnglish": "Orange",
      "displayNameFrench": "Orange",
      "displayNameArabic": "برتقالي",
      "displayNameMandarin": "橙色",
      "displayNameSpanish": "Naranja"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1730937600,
    "quantity": 10,
    "kitchenLocation": "fridge"
  },
  "2.01.003": {
    "name": "spinach",
    "displayNameEnglish": "Spinach",
    "displayNameFrench": "Épinard",
    "displayNameArabic": "سبانخ",
    "displayNameMandarin": "菠菜",
    "displayNameSpanish": "Espinaca",
    "category": "Vegetables",
    "variety": {
      "name": "baby",
      "displayNameEnglish": "Baby",
      "displayNameFrench": "Jeune",
      "displayNameArabic": "صغير",
      "displayNameMandarin": "嫩叶",
      "displayNameSpanish": "Tierna"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731024000,
    "quantity": 1,
    "kitchenLocation": "fridge"
  },
  "3.01.001": {
    "name": "chicken_breast",
    "displayNameEnglish": "Chicken Breast",
    "displayNameFrench": "Poitrine de Poulet",
    "displayNameArabic": "صدر دجاج",
    "displayNameMandarin": "鸡胸肉",
    "displayNameSpanish": "Pechuga de Pollo",
    "category": "Meat",
    "variety": {
      "name": "boneless",
      "displayNameEnglish": "Boneless",
      "displayNameFrench": "Sans Os",
      "displayNameArabic": "بدون عظم",
      "displayNameMandarin": "无骨",
      "displayNameSpanish": "Sin Hueso"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731110400,
    "quantity": 4,
    "kitchenLocation": "freezer"
  },
  "3.01.002": {
    "name": "ground_beef",
    "displayNameEnglish": "Ground Beef",
    "displayNameFrench": "Bœuf Haché",
    "displayNameArabic": "لحم بقري مفروم",
    "displayNameMandarin": "牛肉末",
    "displayNameSpanish": "Carne Molida",
    "category": "Meat",
    "variety": {
      "name": "lean",
      "displayNameEnglish": "Lean",
      "displayNameFrench": "Maigre",
      "displayNameArabic": "قليل الدهن",
      "displayNameMandarin": "瘦肉",
      "displayNameSpanish": "Magra"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731196800,
    "quantity": 2,
    "kitchenLocation": "freezer"
  },
  "3.02.001": {
    "name": "salmon",
    "displayNameEnglish": "Salmon",
    "displayNameFrench": "Saumon",
    "displayNameArabic": "سلمون",
    "displayNameMandarin": "三文鱼",
    "displayNameSpanish": "Salmón",
    "category": "Seafood",
    "variety": {
      "name": "atlantic",
      "displayNameEnglish": "Atlantic",
      "displayNameFrench": "Atlantique",
      "displayNameArabic": "أطلسي",
      "displayNameMandarin": "大西洋",
      "displayNameSpanish": "Atlántico"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731283200,
    "quantity": 2,
    "kitchenLocation": "freezer"
  },
  "4.61.001": {
    "name": "basmati_rice",
    "displayNameEnglish": "Basmati Rice",
    "displayNameFrench": "Riz Basmati",
    "displayNameArabic": "أرز بسمتي",
    "displayNameMandarin": "印度香米",
    "displayNameSpanish": "Arroz Basmati",
    "category": "Rice",
    "variety": {
      "name": "white",
      "displayNameEnglish": "White",
      "displayNameFrench": "Blanc",
      "displayNameArabic": "أبيض",
      "displayNameMandarin": "白色",
      "displayNameSpanish": "Blanco"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731369600,
    "quantity": 1,
    "kitchenLocation": "pantry"
  },
  "4.61.002": {
    "name": "jasmine_rice",
    "displayNameEnglish": "Jasmine Rice",
    "displayNameFrench": "Riz Jasmin",
    "displayNameArabic": "أرز ياسمين",
    "displayNameMandarin": "茉莉香米",
    "displayNameSpanish": "Arroz Jazmín",
    "category": "Rice",
    "variety": {
      "name": "thai",
      "displayNameEnglish": "Thai",
      "displayNameFrench": "Thaï",
      "displayNameArabic": "تايلاندي",
      "displayNameMandarin": "泰国",
      "displayNameSpanish": "Tailandés"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731456000,
    "quantity": 1,
    "kitchenLocation": "pantry"
  },
  "4.61.003": {
    "name": "arborio_rice",
    "displayNameEnglish": "Arborio Rice",
    "displayNameFrench": "Riz Arborio",
    "displayNameArabic": "أرز أربوريو",
    "displayNameMandarin": "阿勃留大米",
    "displayNameSpanish": "Arroz Arborio",
    "category": "Rice",
    "variety": {
      "name": "italian",
      "displayNameEnglish": "Italian",
      "displayNameFrench": "Italien",
      "displayNameArabic": "إيطالي",
      "displayNameMandarin": "意大利",
      "displayNameSpanish": "Italiano"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731542400,
    "quantity": 1,
    "kitchenLocation": "pantry"
  },
  "4.62.001": {
    "name": "spaghetti",
    "displayNameEnglish": "Spaghetti",
    "displayNameFrench": "Spaghetti",
    "displayNameArabic": "سباغيتي",
    "displayNameMandarin": "意大利面",
    "displayNameSpanish": "Espagueti",
    "category": "Pasta",
    "variety": {
      "name": "traditional",
      "displayNameEnglish": "Traditional",
      "displayNameFrench": "Traditionnel",
      "displayNameArabic": "تقليدي",
      "displayNameMandarin": "传统",
      "displayNameSpanish": "Tradicional"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731628800,
    "quantity": 2,
    "kitchenLocation": "pantry"
  },
  "4.62.002": {
    "name": "penne",
    "displayNameEnglish": "Penne",
    "displayNameFrench": "Penne",
    "displayNameArabic": "بيني",
    "displayNameMandarin": "通心粉",
    "displayNameSpanish": "Penne",
    "category": "Pasta",
    "variety": {
      "name": "rigate",
      "displayNameEnglish": "Rigate",
      "displayNameFrench": "Rigate",
      "displayNameArabic": "ريجات",
      "displayNameMandarin": "条纹",
      "displayNameSpanish": "Rigate"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731715200,
    "quantity": 3,
    "kitchenLocation": "pantry"
  },
  "4.62.003": {
    "name": "rigatoni",
    "displayNameEnglish": "Rigatoni",
    "displayNameFrench": "Rigatoni",
    "displayNameArabic": "ريجاتوني",
    "displayNameMandarin": "里加托尼",
    "displayNameSpanish": "Rigatoni",
    "category": "Pasta",
    "variety": {
      "name": "large",
      "displayNameEnglish": "Large",
      "displayNameFrench": "Grand",
      "displayNameArabic": "كبير",
      "displayNameMandarin": "大号",
      "displayNameSpanish": "Grande"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731801600,
    "quantity": 1,
    "kitchenLocation": "pantry"
  },
  "5.01.001": {
    "name": "basil",
    "displayNameEnglish": "Basil",
    "displayNameFrench": "Basilic",
    "displayNameArabic": "ريحان",
    "displayNameMandarin": "罗勒",
    "displayNameSpanish": "Albahaca",
    "category": "Herbs & Spices",
    "variety": {
      "name": "sweet",
      "displayNameEnglish": "Sweet",
      "displayNameFrench": "Doux",
      "displayNameArabic": "حلو",
      "displayNameMandarin": "甜",
      "displayNameSpanish": "Dulce"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731888000,
    "quantity": 1,
    "kitchenLocation": "spicecabinet"
  },
  "5.01.002": {
    "name": "oregano",
    "displayNameEnglish": "Oregano",
    "displayNameFrench": "Origan",
    "displayNameArabic": "أوريجانو",
    "displayNameMandarin": "牛至",
    "displayNameSpanish": "Orégano",
    "category": "Herbs & Spices",
    "variety": {
      "name": "dried",
      "displayNameEnglish": "Dried",
      "displayNameFrench": "Séché",
      "displayNameArabic": "مجفف",
      "displayNameMandarin": "干",
      "displayNameSpanish": "Seco"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1731974400,
    "quantity": 1,
    "kitchenLocation": "spicecabinet"
  },
  "5.01.003": {
    "name": "cumin",
    "displayNameEnglish": "Cumin",
    "displayNameFrench": "Cumin",
    "displayNameArabic": "كمون",
    "displayNameMandarin": "孜然",
    "displayNameSpanish": "Comino",
    "category": "Herbs & Spices",
    "variety": {
      "name": "ground",
      "displayNameEnglish": "Ground",
      "displayNameFrench": "Moulu",
      "displayNameArabic": "مطحون",
      "displayNameMandarin": "粉末",
      "displayNameSpanish": "Molido"
    },
    "imageUrl": "https://placehold.net/400x400.png",
    "purchaseDate": 1732060800,
    "quantity": 1,
    "kitchenLocation": "spicecabinet"
  }
};
