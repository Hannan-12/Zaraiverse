import React, { createContext, useState, useContext } from 'react';

export const LanguageContext = createContext();

export const translations = {
  en: {
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
  },
  ur: {
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