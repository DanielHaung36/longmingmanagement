import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import cn from "./cn.json";
import profile_en from '@/locales/en/profile.json'
import profile_cn from "@/locales/cn/profile.json"

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en,profile: profile_en, },
    cn: { translation: cn,profile: profile_cn, }
  },
  lng: "en", // 默认语言
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
