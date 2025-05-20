import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import pt from "./locales/pt.json"
import en from "./locales/en.json"
import es from "./locales/es.json"
import { getLocales } from 'expo-localization';


const resources = {
    pt: {
        translation: pt
    },
    en: {
        translation: en
    },
    es: {
        translation: es
    },
}

i18next
    .use(initReactI18next)
    .init({
        resources,
        lng: getLocales()[0].languageCode || 'pt',
    })

export default i18next;
