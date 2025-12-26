// Arabic translations for Bam Burgers
import type { Translations } from './en';

export const ar: Translations = {
  // Navigation
  nav: {
    home: "الرئيسية",
    menu: "القائمة",
    about: "من نحن",
    contact: "اتصل بنا",
    cart: "السلة",
    orders: "طلباتي",
    loyalty: "الولاء",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
  },
  
  // Hero Section
  hero: {
    title: "برجر لذيذ،",
    titleHighlight: "طازج ومميز",
    subtitle: "مكونات طازجة، نكهات جريئة، وتوصيل سريع. جرب أفضل برجر في الكويت مع بام برجرز.",
    orderNow: "اطلب الآن",
    viewMenu: "عرض القائمة",
  },

  // Branch & Order Type
  branch: {
    selectBranch: "اختر الفرع",
    currentBranch: "الفرع الحالي",
    change: "تغيير",
  },

  orderType: {
    title: "كيف تريد طلبك؟",
    pickup: "استلام",
    pickupDesc: "استلم من متجرنا",
    delivery: "توصيل",
    deliveryDesc: "سنوصله إليك",
    continue: "متابعة",
  },

  // Menu
  menu: {
    title: "قائمتنا",
    subtitle: "استكشف مجموعتنا اللذيذة من البرجر والدجاج والأطباق الجانبية والمشروبات والحلويات.",
    allItems: "جميع الأصناف",
    popular: "الأكثر طلباً",
    addToCart: "أضف للسلة",
    customize: "تخصيص",
    noItems: "لا توجد عناصر في هذه الفئة.",
    outOfStock: "نفذت الكمية",
  },

  // Categories
  categories: {
    all: "الكل",
    signatureBurgers: "برجر مميز",
    chickenBurgers: "برجر دجاج",
    beefBurgers: "برجر لحم",
    sides: "أطباق جانبية",
    drinks: "مشروبات",
    desserts: "حلويات",
    mealCombos: "وجبات كومبو",
  },

  // Item Modal
  itemModal: {
    selectSize: "اختر الحجم",
    required: "مطلوب",
    optional: "اختياري",
    toppings: "الإضافات",
    sauces: "الصلصات",
    premiumAddons: "إضافات مميزة",
    specialInstructions: "تعليمات خاصة",
    specialInstructionsPlaceholder: "أي طلبات خاصة؟ (مثل: بدون بصل، صلصة إضافية)",
    addToCartBtn: "أضف للسلة",
    updateCart: "تحديث السلة",
    total: "المجموع",
  },

  // Modifiers
  modifiers: {
    pattySize: "حجم البرجر",
    single: "فردي",
    double: "مزدوج",
    triple: "ثلاثي",
    toppings: "الإضافات",
    lettuce: "خس",
    tomato: "طماطم",
    onions: "بصل",
    pickles: "مخلل",
    jalapenos: "هالابينو",
    sauces: "الصلصات",
    mayo: "مايونيز",
    ketchup: "كاتشب",
    mustard: "خردل",
    bbqSauce: "صلصة باربكيو",
    spicyMayo: "مايونيز حار",
    premiumAddons: "إضافات مميزة",
    extraCheese: "جبنة إضافية",
    bacon: "لحم مقدد",
    mushrooms: "فطر",
    friedEgg: "بيض مقلي",
    free: "مجاني",
  },

  // Cart
  cart: {
    title: "سلتك",
    empty: "سلتك فارغة",
    emptyDesc: "أضف بعض الأصناف اللذيذة من قائمتنا!",
    browseMenu: "تصفح القائمة",
    continueShopping: "متابعة التسوق",
    subtotal: "المجموع الفرعي",
    deliveryFee: "رسوم التوصيل",
    discount: "الخصم",
    total: "المجموع",
    checkout: "إتمام الطلب",
    remove: "حذف",
    coupon: "كود الخصم",
    applyCoupon: "تطبيق",
    couponApplied: "مطبق",
    removeCoupon: "إزالة",
    free: "مجاني",
  },

  // Checkout
  checkout: {
    title: "إتمام الطلب",
    backToCart: "العودة للسلة",
    deliveryMethod: "طريقة التوصيل",
    deliveryAddress: "عنوان التوصيل",
    pickupLocation: "موقع الاستلام",
    customerInfo: "معلومات العميل",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    phone: "رقم الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    area: "المنطقة",
    block: "القطعة",
    building: "المبنى",
    floor: "الطابق",
    apartment: "الشقة",
    additionalInfo: "تعليمات إضافية",
    paymentMethod: "طريقة الدفع",
    cashOnDelivery: "الدفع عند الاستلام",
    cashOnPickup: "الدفع عند الاستلام",
    onlinePayment: "الدفع الإلكتروني",
    onlinePaymentDesc: "الدفع بالبطاقة عبر MyFatoorah/UPay",
    orderSummary: "ملخص الطلب",
    placeOrder: "تأكيد الطلب",
    processing: "جاري المعالجة...",
    payNow: "ادفع الآن",
    notes: "ملاحظات الطلب",
    notesPlaceholder: "أي طلبات خاصة لطلبك؟",
  },

  // Customer Auth
  auth: {
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    forgotPassword: "نسيت كلمة المرور؟",
    noAccount: "ليس لديك حساب؟",
    hasAccount: "لديك حساب بالفعل؟",
    createAccount: "إنشاء حساب",
    loginWithGoogle: "المتابعة مع Google",
    orContinueWith: "أو المتابعة بـ",
    loginSuccess: "مرحباً بعودتك!",
    signupSuccess: "تم إنشاء الحساب بنجاح!",
    phoneOtp: "رمز التحقق",
    phoneOtpDesc: "قريباً",
    guestCheckout: "المتابعة كضيف",
    loginToEarnPoints: "سجل دخولك لكسب نقاط الولاء!",
  },

  // Order Confirmation
  orderConfirmation: {
    title: "تم تأكيد الطلب!",
    thankYou: "شكراً لطلبك",
    orderNumber: "رقم الطلب",
    estimatedTime: "الوقت المتوقع",
    minutes: "دقيقة",
    trackOrder: "تتبع الطلب",
    orderAnother: "طلب آخر",
    orderDetails: "تفاصيل الطلب",
    paymentPending: "في انتظار الدفع",
    paymentSuccess: "تم الدفع بنجاح",
  },

  // Order Tracking
  orderTracking: {
    title: "تتبع طلبك",
    status: "حالة الطلب",
    orderPlaced: "تم الطلب",
    confirmed: "تم التأكيد",
    preparing: "قيد التحضير",
    ready: "جاهز",
    onTheWay: "في الطريق",
    delivered: "تم التوصيل",
    pickedUp: "تم الاستلام",
    cancelled: "ملغي",
    estimatedDelivery: "وقت التوصيل المتوقع",
    estimatedPickup: "وقت الاستلام المتوقع",
    driver: "السائق",
    contactDriver: "اتصل بالسائق",
  },

  // Loyalty
  loyalty: {
    title: "برنامج الولاء",
    subtitle: "اكسب نقاط مع كل طلب واحصل على مكافآت حصرية!",
    yourPoints: "نقاطك",
    earnPoints: "اكسب نقاط",
    redeemPoints: "استبدل نقاط",
    howItWorks: "كيف يعمل",
    step1: "اطلب طعامك المفضل",
    step2: "اكسب 1 نقطة لكل 1 دينار",
    step3: "استبدل النقاط بأصناف مجانية",
    bronze: "برونزي",
    silver: "فضي",
    gold: "ذهبي",
    platinum: "بلاتيني",
    currentTier: "المستوى الحالي",
    pointsToNext: "نقطة للمستوى التالي",
    joinNow: "انضم الآن",
    comingSoon: "قريباً",
  },

  // Footer
  footer: {
    description: "نقدم برجر لذيذ بمكونات عالية الجودة في الكويت. طازج، سريع، ومميز! توصيل فقط.",
    quickLinks: "روابط سريعة",
    ourMenu: "قائمتنا",
    aboutUs: "من نحن",
    loyaltyProgram: "برنامج الولاء",
    contact: "اتصل بنا",
    hours: "أوقات العمل",
    allRightsReserved: "جميع الحقوق محفوظة.",
    privacyPolicy: "سياسة الخصوصية",
    termsOfService: "شروط الخدمة",
  },

  // Common
  common: {
    loading: "جاري التحميل...",
    error: "حدث خطأ ما",
    tryAgain: "حاول مرة أخرى",
    cancel: "إلغاء",
    confirm: "تأكيد",
    save: "حفظ",
    delete: "حذف",
    edit: "تعديل",
    close: "إغلاق",
    search: "بحث",
    filter: "تصفية",
    sortBy: "ترتيب حسب",
    price: "السعر",
    name: "الاسم",
    date: "التاريخ",
    kwd: "د.ك",
    quantity: "الكمية",
    items: "عناصر",
    item: "عنصر",
  },

  // Errors
  errors: {
    required: "هذا الحقل مطلوب",
    invalidEmail: "البريد الإلكتروني غير صالح",
    invalidPhone: "رقم الهاتف غير صالح",
    minLength: "الحد الأدنى {{min}} حرف",
    maxLength: "الحد الأقصى {{max}} حرف",
    passwordMismatch: "كلمات المرور غير متطابقة",
    orderFailed: "فشل في تقديم الطلب. يرجى المحاولة مرة أخرى.",
    paymentFailed: "فشل الدفع. يرجى المحاولة مرة أخرى.",
    networkError: "خطأ في الشبكة. يرجى التحقق من اتصالك.",
  },

  // Success Messages
  success: {
    orderPlaced: "تم تقديم الطلب بنجاح!",
    addedToCart: "تمت الإضافة للسلة!",
    removedFromCart: "تمت الإزالة من السلة",
    couponApplied: "تم تطبيق الكوبون!",
    profileUpdated: "تم تحديث الملف الشخصي بنجاح",
  },

  // Restaurant Info
  restaurant: {
    name: "بام برجرز",
    tagline: "طازج. سريع. مميز.",
    phone: "+965 9474 5424",
    email: "hello@eatbam.me",
    hoursWeekday: "يومياً: 11:00 صباحاً - 1:00 صباحاً",
  },
};
