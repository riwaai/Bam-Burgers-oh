// Menu item types and mock data for Bam Burgers
// This will be replaced with Supabase data once tables are populated

export interface MenuItem {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  category_id: string;
  image: string;
  is_popular: boolean;
  is_available: boolean;
  calories?: number;
  prep_time_minutes?: number;
  modifier_group_ids: string[];
}

export interface Category {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  image?: string;
  sort_order: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  name_ar: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  modifiers: Modifier[];
}

export interface Modifier {
  id: string;
  name: string;
  name_ar: string;
  price: number;
  is_available: boolean;
  is_default: boolean;
}

// Categories
export const categories: Category[] = [
  { id: 'all', name: 'All Items', name_ar: 'جميع الأصناف', sort_order: 0 },
  { id: 'signature', name: 'Signature Burgers', name_ar: 'برجر مميز', sort_order: 1 },
  { id: 'chicken', name: 'Chicken Burgers', name_ar: 'برجر دجاج', sort_order: 2 },
  { id: 'beef', name: 'Beef Burgers', name_ar: 'برجر لحم', sort_order: 3 },
  { id: 'sides', name: 'Sides', name_ar: 'أطباق جانبية', sort_order: 4 },
  { id: 'drinks', name: 'Drinks', name_ar: 'مشروبات', sort_order: 5 },
  { id: 'desserts', name: 'Desserts', name_ar: 'حلويات', sort_order: 6 },
  { id: 'combos', name: 'Meal Combos', name_ar: 'وجبات كومبو', sort_order: 7 },
];

// Modifier Groups
export const modifierGroups: ModifierGroup[] = [
  {
    id: 'patty-size',
    name: 'Patty Size',
    name_ar: 'حجم البرجر',
    is_required: true,
    min_selections: 1,
    max_selections: 1,
    modifiers: [
      { id: 'single', name: 'Single', name_ar: 'فردي', price: 0, is_available: true, is_default: true },
      { id: 'double', name: 'Double', name_ar: 'مزدوج', price: 1.000, is_available: true, is_default: false },
      { id: 'triple', name: 'Triple', name_ar: 'ثلاثي', price: 2.000, is_available: true, is_default: false },
    ],
  },
  {
    id: 'toppings',
    name: 'Toppings',
    name_ar: 'الإضافات',
    is_required: false,
    min_selections: 0,
    max_selections: 10,
    modifiers: [
      { id: 'lettuce', name: 'Lettuce', name_ar: 'خس', price: 0, is_available: true, is_default: true },
      { id: 'tomato', name: 'Tomato', name_ar: 'طماطم', price: 0, is_available: true, is_default: true },
      { id: 'onions', name: 'Onions', name_ar: 'بصل', price: 0, is_available: true, is_default: true },
      { id: 'pickles', name: 'Pickles', name_ar: 'مخلل', price: 0, is_available: true, is_default: false },
      { id: 'jalapenos', name: 'Jalapeños', name_ar: 'هالابينو', price: 0, is_available: true, is_default: false },
    ],
  },
  {
    id: 'sauces',
    name: 'Sauces',
    name_ar: 'الصلصات',
    is_required: false,
    min_selections: 0,
    max_selections: 3,
    modifiers: [
      { id: 'mayo', name: 'Mayo', name_ar: 'مايونيز', price: 0, is_available: true, is_default: true },
      { id: 'ketchup', name: 'Ketchup', name_ar: 'كاتشب', price: 0, is_available: true, is_default: false },
      { id: 'mustard', name: 'Mustard', name_ar: 'خردل', price: 0, is_available: true, is_default: false },
      { id: 'bbq', name: 'BBQ Sauce', name_ar: 'صلصة باربكيو', price: 0, is_available: true, is_default: false },
      { id: 'spicy-mayo', name: 'Spicy Mayo', name_ar: 'مايونيز حار', price: 0, is_available: true, is_default: false },
    ],
  },
  {
    id: 'premium-addons',
    name: 'Premium Add-ons',
    name_ar: 'إضافات مميزة',
    is_required: false,
    min_selections: 0,
    max_selections: 5,
    modifiers: [
      { id: 'extra-cheese', name: 'Extra Cheese', name_ar: 'جبنة إضافية', price: 0.500, is_available: true, is_default: false },
      { id: 'bacon', name: 'Bacon', name_ar: 'لحم مقدد', price: 1.000, is_available: true, is_default: false },
      { id: 'mushrooms', name: 'Mushrooms', name_ar: 'فطر', price: 0.800, is_available: true, is_default: false },
      { id: 'fried-egg', name: 'Fried Egg', name_ar: 'بيض مقلي', price: 0.500, is_available: true, is_default: false },
    ],
  },
];

// Menu Items
export const menuItems: MenuItem[] = [
  // Signature Burgers
  {
    id: 'bam-classic',
    name: 'Bam Classic Burger',
    name_ar: 'بام كلاسيك برجر',
    description: 'Our signature beef patty with melted cheddar, fresh lettuce, tomato, pickles, and our secret Bam sauce',
    description_ar: 'برجر لحم مميز مع جبنة شيدر ذائبة، خس طازج، طماطم، مخلل، وصلصة بام السرية',
    price: 2.500,
    category_id: 'signature',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
    is_popular: true,
    is_available: true,
    calories: 650,
    prep_time_minutes: 10,
    modifier_group_ids: ['patty-size', 'toppings', 'sauces', 'premium-addons'],
  },
  {
    id: 'bam-deluxe',
    name: 'Bam Deluxe Burger',
    name_ar: 'بام ديلوكس برجر',
    description: 'Double beef patty, double cheese, caramelized onions, bacon, and our signature sauce',
    description_ar: 'برجر لحم مزدوج، جبنة مزدوجة، بصل مكرمل، لحم مقدد، وصلصتنا المميزة',
    price: 3.200,
    category_id: 'signature',
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500',
    is_popular: true,
    is_available: true,
    calories: 920,
    prep_time_minutes: 12,
    modifier_group_ids: ['patty-size', 'toppings', 'sauces', 'premium-addons'],
  },
  // Chicken Burgers
  {
    id: 'spicy-chicken',
    name: 'Spicy Chicken Burger',
    name_ar: 'برجر دجاج حار',
    description: 'Crispy chicken breast with spicy mayo, jalapeños, lettuce, and pickles',
    description_ar: 'صدر دجاج مقرمش مع مايونيز حار، هالابينو، خس، ومخلل',
    price: 2.700,
    category_id: 'chicken',
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500',
    is_popular: true,
    is_available: true,
    calories: 580,
    prep_time_minutes: 10,
    modifier_group_ids: ['toppings', 'sauces', 'premium-addons'],
  },
  {
    id: 'crispy-chicken',
    name: 'Crispy Chicken Burger',
    name_ar: 'برجر دجاج مقرمش',
    description: 'Golden crispy chicken fillet with coleslaw, mayo, and our special seasoning',
    description_ar: 'فيليه دجاج مقرمش ذهبي مع سلطة كول سلو، مايونيز، وتوابلنا الخاصة',
    price: 2.500,
    category_id: 'chicken',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500',
    is_popular: false,
    is_available: true,
    calories: 520,
    prep_time_minutes: 10,
    modifier_group_ids: ['toppings', 'sauces', 'premium-addons'],
  },
  // Beef Burgers
  {
    id: 'double-beef',
    name: 'Double Beef Burger',
    name_ar: 'برجر لحم مزدوج',
    description: 'Two juicy beef patties with American cheese, pickles, onions, and classic sauce',
    description_ar: 'قطعتان من اللحم العصير مع جبنة أمريكية، مخلل، بصل، وصلصة كلاسيكية',
    price: 3.500,
    category_id: 'beef',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500',
    is_popular: true,
    is_available: true,
    calories: 850,
    prep_time_minutes: 12,
    modifier_group_ids: ['patty-size', 'toppings', 'sauces', 'premium-addons'],
  },
  {
    id: 'mushroom-swiss',
    name: 'Mushroom Swiss Burger',
    name_ar: 'برجر الفطر والجبنة السويسرية',
    description: 'Premium beef patty with sautéed mushrooms, Swiss cheese, and truffle mayo',
    description_ar: 'برجر لحم فاخر مع فطر مقلي، جبنة سويسرية، ومايونيز الكمأة',
    price: 3.800,
    category_id: 'beef',
    image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500',
    is_popular: false,
    is_available: true,
    calories: 780,
    prep_time_minutes: 12,
    modifier_group_ids: ['patty-size', 'toppings', 'sauces', 'premium-addons'],
  },
  // Sides
  {
    id: 'crispy-fries',
    name: 'Crispy Fries',
    name_ar: 'بطاطس مقلية',
    description: 'Golden crispy French fries with our signature seasoning',
    description_ar: 'بطاطس مقلية ذهبية مقرمشة مع توابلنا المميزة',
    price: 0.800,
    category_id: 'sides',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
    is_popular: true,
    is_available: true,
    calories: 320,
    prep_time_minutes: 5,
    modifier_group_ids: [],
  },
  {
    id: 'loaded-fries',
    name: 'Loaded Fries',
    name_ar: 'بطاطس محملة',
    description: 'Crispy fries topped with cheese sauce, bacon bits, and green onions',
    description_ar: 'بطاطس مقرمشة مع صلصة الجبنة، قطع اللحم المقدد، والبصل الأخضر',
    price: 1.500,
    category_id: 'sides',
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=500',
    is_popular: false,
    is_available: true,
    calories: 580,
    prep_time_minutes: 7,
    modifier_group_ids: [],
  },
  {
    id: 'onion-rings',
    name: 'Onion Rings',
    name_ar: 'حلقات البصل',
    description: 'Thick-cut onion rings with golden crispy batter',
    description_ar: 'حلقات بصل سميكة مع خليط ذهبي مقرمش',
    price: 1.000,
    category_id: 'sides',
    image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=500',
    is_popular: false,
    is_available: true,
    calories: 280,
    prep_time_minutes: 5,
    modifier_group_ids: [],
  },
  // Drinks
  {
    id: 'pepsi',
    name: 'Pepsi',
    name_ar: 'بيبسي',
    description: 'Ice-cold Pepsi',
    description_ar: 'بيبسي مثلجة',
    price: 0.500,
    category_id: 'drinks',
    image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500',
    is_popular: false,
    is_available: true,
    calories: 150,
    prep_time_minutes: 1,
    modifier_group_ids: [],
  },
  {
    id: 'fresh-lemonade',
    name: 'Fresh Lemonade',
    name_ar: 'ليموناضة طازجة',
    description: 'House-made fresh lemonade with mint',
    description_ar: 'ليموناضة طازجة محضرة في المنزل مع النعناع',
    price: 1.000,
    category_id: 'drinks',
    image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500',
    is_popular: false,
    is_available: true,
    calories: 120,
    prep_time_minutes: 2,
    modifier_group_ids: [],
  },
  // Desserts
  {
    id: 'chocolate-shake',
    name: 'Chocolate Shake',
    name_ar: 'ميلك شيك شوكولاتة',
    description: 'Creamy chocolate milkshake with whipped cream',
    description_ar: 'ميلك شيك شوكولاتة كريمي مع كريمة مخفوقة',
    price: 1.500,
    category_id: 'desserts',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500',
    is_popular: true,
    is_available: true,
    calories: 450,
    prep_time_minutes: 3,
    modifier_group_ids: [],
  },
  {
    id: 'brownie-sundae',
    name: 'Brownie Sundae',
    name_ar: 'براوني سانداي',
    description: 'Warm chocolate brownie with vanilla ice cream and chocolate sauce',
    description_ar: 'براوني شوكولاتة دافئة مع آيس كريم فانيلا وصلصة الشوكولاتة',
    price: 1.800,
    category_id: 'desserts',
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500',
    is_popular: false,
    is_available: true,
    calories: 580,
    prep_time_minutes: 5,
    modifier_group_ids: [],
  },
  // Meal Combos
  {
    id: 'bam-classic-combo',
    name: 'Bam Classic Combo',
    name_ar: 'وجبة بام كلاسيك',
    description: 'Bam Classic Burger + Crispy Fries + Pepsi',
    description_ar: 'بام كلاسيك برجر + بطاطس مقلية + بيبسي',
    price: 3.500,
    category_id: 'combos',
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500',
    is_popular: true,
    is_available: true,
    calories: 1120,
    prep_time_minutes: 12,
    modifier_group_ids: ['patty-size', 'toppings', 'sauces', 'premium-addons'],
  },
  {
    id: 'chicken-combo',
    name: 'Chicken Burger Combo',
    name_ar: 'وجبة برجر دجاج',
    description: 'Crispy Chicken Burger + Crispy Fries + Pepsi',
    description_ar: 'برجر دجاج مقرمش + بطاطس مقلية + بيبسي',
    price: 3.200,
    category_id: 'combos',
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500',
    is_popular: false,
    is_available: true,
    calories: 990,
    prep_time_minutes: 12,
    modifier_group_ids: ['toppings', 'sauces', 'premium-addons'],
  },
];

// Get modifier groups for an item
export const getModifierGroupsForItem = (item: MenuItem): ModifierGroup[] => {
  return item.modifier_group_ids
    .map(id => modifierGroups.find(g => g.id === id))
    .filter((g): g is ModifierGroup => g !== undefined);
};

// Format price in KWD
export const formatPrice = (price: number): string => {
  return price.toFixed(3);
};

// Format price with currency
export const formatPriceWithCurrency = (price: number, language: 'en' | 'ar' = 'en'): string => {
  const formatted = formatPrice(price);
  return language === 'ar' ? `${formatted} د.ك` : `${formatted} KWD`;
};
