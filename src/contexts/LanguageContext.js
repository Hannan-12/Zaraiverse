import React, { createContext, useState, useContext } from 'react';

export const LanguageContext = createContext();

export const translations = {
  en: {
    welcome: "Welcome to ZaraiVerse",
    dashboard: "Dashboard",
    myCrops: "My Crops",
    marketplace: "Marketplace",
    weather: "Weather",
    chat: "Chat",
    profile: "Profile",
    chatbot: "AI Chatbot",
    logout: "Logout",
    selectLanguage: "Select Language",
    save: "Save",
    cancel: "Cancel",
  },
  ur: {
    welcome: "زرعی ورس میں خوش آمدید",
    dashboard: "ڈیش بورڈ",
    myCrops: "میری فصلیں",
    marketplace: "منڈی",
    weather: "موسم",
    chat: "بات چیت",
    profile: "پروفائل",
    chatbot: "زرعی مددگار (AI)",
    logout: "لاگ آؤٹ",
    selectLanguage: "زبان منتخب کریں",
    save: "محفوظ کریں",
    cancel: "منسوخ کریں",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en'); // Default to English

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