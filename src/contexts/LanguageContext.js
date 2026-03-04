import React, { createContext, useState, useContext } from 'react';

export const LanguageContext = createContext();

export const translations = {
  en: {
    // Dashboard
    welcome: "Welcome to ZaraiVerse",
    dashboard: "Dashboard",
    myCrops: "My Crops",
    cropProgress: "Crop Progress",
    reqPrescription: "Expert Prescription",
    knowledgeHub: "Knowledge Hub",
    tasks: "Task Reminders",
    orders: "My Orders",
    analytics: "Analytics",
    cart: "My Cart",
    marketplace: "Marketplace",
    weather: "Weather",
    chat: "Chat",
    profile: "Profile",
    logout: "Logout",
    selectLanguage: "Select Language",
    myFields: "My Fields",
    myQueries: "My Queries",
    chatbot: "AI Chatbot",
    manageSubtext: "Manage your farm efficiently",

    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    error: "Error",
    success: "Success",
    retry: "Retry",
    loading: "Loading...",

    // MyCropsScreen
    expertAdviceTitle: "Need Expert Advice?",
    expertAdviceSubtext: "Get a prescription for your crops.",
    askNow: "Ask Now",
    planted: "Planted:",
    statusLabel: "Status:",
    noCropsFound: "No crops found.",

    // ProfileScreen
    myProfile: "My Profile",
    editProfile: "Edit Profile",
    editName: "Edit Name",
    helpCenter: "Help Center",
    privacyPolicy: "Privacy Policy",
    logOut: "Log Out",
    nameEmptyError: "Name cannot be empty.",
    nameUpdated: "Name updated!",
    profileUpdateFailed: "Failed to update profile.",
    photoUpdateFailed: "Photo update failed.",

    // WeatherForecastScreen
    loadingWeather: "Loading Weather...",
    next5Days: "Next 5 Days (Tap for details)",
    today: "Today",

    // AnalyticsScreen
    smartAnalytics: "Smart Analytics",
    analyticsSubtitle: "AI-driven insights for your farm",
    cropDistribution: "Crop Distribution",
    addCropsForChart: "Add crops to see distribution charts.",
    actionableInsights: "Actionable Insights",
    allLooksGood: "All Looks Good",
    noActionsNeeded: "No specific actions needed today based on your current crop data.",

    // TaskRemindersScreen
    myTasks: "My Tasks",
    stayOrganized: "Stay organized & productive",
    noTasksYet: "No Tasks Yet",
    addReminderHint: "Tap the + button to add a new reminder.",
    editTask: "Edit Task",
    newTask: "New Task",
    taskTitle: "Task Title",
    dueTime: "Due Time",
    saveTask: "Save Task",
    deleteTask: "Delete Task",
    removeTaskConfirm: "Remove this task?",
    missingTitle: "Missing Title",
    enterTaskTitle: "Please enter a task title.",
    couldNotSaveTask: "Could not save task.",

    // CartScreen
    cartEmpty: "Your cart is empty.",
    total: "Total:",
    proceedToPayment: "Proceed to Payment",

    // OrdersScreen
    noOrdersFound: "No orders found.",
    rentalCost: "Rental Cost",
    amount: "Amount",
    viewRentalStatus: "View Rental Status",

    // MarketplaceScreen
    searchMarketplace: "Search seeds, tools, fertilizers...",
    noProductsFound: "No products found.",

    // MyFieldsScreen
    deleteField: "Delete Field",
    confirmDeleteField: "Are you sure? This cannot be undone.",
    noFieldsAdded: "No fields added yet.",
    noFieldsAddedText: "Add your plots of land to manage crops better.",

    // MyQueriesScreen
    yourQuestion: "Your Question:",
    expertResponse: "Expert Response",
    waitingForExpert: "Waiting for an expert to review...",
    noQueriesYet: "No queries sent yet.",

    // RequestPrescriptionScreen
    askAnExpert: "Ask an Expert",
    prescriptionSubtext: "Describe your crop issue and attach a photo for better advice.",
    cropNameLabel: "Crop Name",
    problemDescription: "Problem Description",
    attachment: "Attachment (Optional)",
    tapToAddPhoto: "Tap to add photo",
    submitRequest: "Submit Request",
    validatingImage: "Validating image...",
    imageGood: "Image looks good!",
    invalidImageMsg: "Please upload an image of your crop or the affected plant/area.",
    permissionRequired: "Permission Required",
    allowPhotoAccess: "Please allow access to photos.",
    missingDetails: "Missing Details",
    enterCropDetails: "Please enter crop name and description.",
    invalidImage: "Invalid Image",
    invalidImageBody: "The attached image does not appear to show a crop or plant issue. Please upload a relevant photo.",
    requestSentSuccess: "Your request has been sent to an expert!",
    couldNotSendRequest: "Could not send request. Please try again.",

    // AddCropScreen
    addNewCrop: "Add New Crop",
    cropNamePlaceholder: "e.g., Wheat, Corn, Rice",
    selectField: "Select Field",
    tapToSelectField: "Tap to select a field...",
    plantedDate: "Planted Date",
    initialHealth: "Initial Health",
    saveCrop: "Save Crop",
    selectAField: "Select a Field",
    noFields: "No Fields",
    addFieldFirst: "Please add a field first in the 'My Fields' section.",
    cropNameRequired: "Please enter a name for your crop.",
    fieldRequired: "Please select a field for this crop.",
    couldNotSaveCrop: "Could not save crop.",
  },
  ur: {
    // Dashboard
    welcome: "زرعی ورس میں خوش آمدید",
    dashboard: "ڈیش بورڈ",
    myCrops: "میری فصلیں",
    cropProgress: "فصل کی نشوونما",
    reqPrescription: "ماہر کا نسخہ",
    knowledgeHub: "معلوماتی مرکز",
    tasks: "کام کی یاد دہانی",
    orders: "میرے آرڈرز",
    analytics: "تجزیہ",
    cart: "کارٹ",
    marketplace: "منڈی",
    weather: "موسم",
    chat: "بات چیت",
    profile: "پروفائل",
    logout: "لاگ آؤٹ",
    selectLanguage: "زبان منتخب کریں",
    myFields: "میرے کھیت",
    myQueries: "میرے سوالات",
    chatbot: "اے آئی چیٹ بوٹ",
    manageSubtext: "اپنے فارم کا مؤثر طریقے سے انتظام کریں",

    // Common
    save: "محفوظ کریں",
    cancel: "منسوخ",
    delete: "حذف کریں",
    error: "خرابی",
    success: "کامیابی",
    retry: "دوبارہ کوشش کریں",
    loading: "لوڈ ہو رہا ہے...",

    // MyCropsScreen
    expertAdviceTitle: "ماہر مشورہ چاہیے؟",
    expertAdviceSubtext: "اپنی فصلوں کے لیے نسخہ حاصل کریں۔",
    askNow: "ابھی پوچھیں",
    planted: "کاشت:",
    statusLabel: "حالت:",
    noCropsFound: "کوئی فصل نہیں ملی۔",

    // ProfileScreen
    myProfile: "میری پروفائل",
    editProfile: "پروفائل تبدیل کریں",
    editName: "نام تبدیل کریں",
    helpCenter: "مدد مرکز",
    privacyPolicy: "رازداری پالیسی",
    logOut: "لاگ آؤٹ",
    nameEmptyError: "نام خالی نہیں ہو سکتا۔",
    nameUpdated: "نام اپڈیٹ ہو گیا!",
    profileUpdateFailed: "پروفائل اپڈیٹ ناکام ہوئی۔",
    photoUpdateFailed: "تصویر اپڈیٹ ناکام ہوئی۔",

    // WeatherForecastScreen
    loadingWeather: "موسم لوڈ ہو رہا ہے...",
    next5Days: "اگلے 5 دن (تفصیل کے لیے ٹیپ کریں)",
    today: "آج",

    // AnalyticsScreen
    smartAnalytics: "ذہین تجزیہ",
    analyticsSubtitle: "آپ کے فارم کے لیے اے آئی بصیرت",
    cropDistribution: "فصل کی تقسیم",
    addCropsForChart: "تقسیم چارٹ دیکھنے کے لیے فصلیں شامل کریں۔",
    actionableInsights: "قابل عمل بصیرت",
    allLooksGood: "سب ٹھیک ہے",
    noActionsNeeded: "آج کے فصل کے اعداد و شمار کے مطابق کوئی خاص عمل درکار نہیں۔",

    // TaskRemindersScreen
    myTasks: "میرے کام",
    stayOrganized: "منظم اور پیداواری رہیں",
    noTasksYet: "ابھی کوئی کام نہیں",
    addReminderHint: "+ بٹن دبائیں نئی یاد دہانی شامل کرنے کے لیے۔",
    editTask: "کام ترمیم کریں",
    newTask: "نیا کام",
    taskTitle: "کام کا عنوان",
    dueTime: "وقت مقررہ",
    saveTask: "کام محفوظ کریں",
    deleteTask: "کام حذف کریں",
    removeTaskConfirm: "کیا یہ کام ہٹانا ہے؟",
    missingTitle: "عنوان درکار ہے",
    enterTaskTitle: "کام کا عنوان درج کریں۔",
    couldNotSaveTask: "کام محفوظ نہیں ہو سکا۔",

    // CartScreen
    cartEmpty: "آپ کی ٹوکری خالی ہے۔",
    total: "مجموعی:",
    proceedToPayment: "ادائیگی کی طرف جائیں",

    // OrdersScreen
    noOrdersFound: "کوئی آرڈر نہیں ملا۔",
    rentalCost: "کرائے کی لاگت",
    amount: "رقم",
    viewRentalStatus: "کرائے کی حیثیت دیکھیں",

    // MarketplaceScreen
    searchMarketplace: "بیج، اوزار، کھاد تلاش کریں...",
    noProductsFound: "کوئی مصنوعات نہیں ملی۔",

    // MyFieldsScreen
    deleteField: "کھیت حذف کریں",
    confirmDeleteField: "کیا آپ واقعی یہ کرنا چاہتے ہیں؟ اسے واپس نہیں کیا جا سکتا۔",
    noFieldsAdded: "ابھی کوئی کھیت شامل نہیں کیا گیا۔",
    noFieldsAddedText: "بہتر فصل انتظام کے لیے اپنی زمین کے پلاٹ شامل کریں۔",

    // MyQueriesScreen
    yourQuestion: "آپ کا سوال:",
    expertResponse: "ماہر کا جواب",
    waitingForExpert: "ماہر کے جائزے کا انتظار ہے...",
    noQueriesYet: "ابھی کوئی سوال نہیں بھیجا گیا۔",

    // RequestPrescriptionScreen
    askAnExpert: "ماہر سے پوچھیں",
    prescriptionSubtext: "بہتر مشورے کے لیے اپنی فصل کا مسئلہ بیان کریں اور تصویر لگائیں۔",
    cropNameLabel: "فصل کا نام",
    problemDescription: "مسئلے کی تفصیل",
    attachment: "منسلکہ (اختیاری)",
    tapToAddPhoto: "تصویر شامل کرنے کے لیے ٹیپ کریں",
    submitRequest: "درخواست جمع کروائیں",
    validatingImage: "تصویر کی تصدیق ہو رہی ہے...",
    imageGood: "تصویر ٹھیک ہے!",
    invalidImageMsg: "اپنی فصل یا متاثرہ علاقے کی تصویر اپ لوڈ کریں۔",
    permissionRequired: "اجازت درکار ہے",
    allowPhotoAccess: "براہ کرم تصاویر تک رسائی کی اجازت دیں۔",
    missingDetails: "تفصیلات درکار ہیں",
    enterCropDetails: "فصل کا نام اور تفصیل درج کریں۔",
    invalidImage: "غلط تصویر",
    invalidImageBody: "منسلک تصویر فصل یا پودے کا مسئلہ نہیں دکھا رہی۔ براہ کرم متعلقہ تصویر اپ لوڈ کریں۔",
    requestSentSuccess: "آپ کی درخواست ماہر کو بھیج دی گئی ہے!",
    couldNotSendRequest: "درخواست نہیں بھیجی جا سکی۔ دوبارہ کوشش کریں۔",

    // AddCropScreen
    addNewCrop: "نئی فصل شامل کریں",
    cropNamePlaceholder: "مثال: گندم، مکئی، چاول",
    selectField: "کھیت منتخب کریں",
    tapToSelectField: "کھیت منتخب کرنے کے لیے ٹیپ کریں...",
    plantedDate: "کاشت کی تاریخ",
    initialHealth: "ابتدائی صحت",
    saveCrop: "فصل محفوظ کریں",
    selectAField: "کھیت منتخب کریں",
    noFields: "کوئی کھیت نہیں",
    addFieldFirst: "پہلے 'میرے کھیت' سیکشن میں کھیت شامل کریں۔",
    cropNameRequired: "فصل کا نام درج کریں۔",
    fieldRequired: "اس فصل کے لیے کھیت منتخب کریں۔",
    couldNotSaveCrop: "فصل محفوظ نہیں ہو سکی۔",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
