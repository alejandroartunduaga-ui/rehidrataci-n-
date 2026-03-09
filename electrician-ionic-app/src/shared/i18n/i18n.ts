import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  esVisits,
  esLogin,
  esGlobal,
  TranslationNamespaces,
  esVisitManagement,
  esFormsManagement,
  esWorkOrders,
  esTechnicalLifeSheet,
  esScopes,
} from './index';

const resources = {
  es: {
    [TranslationNamespaces.GLOBAL]: esGlobal,
    [TranslationNamespaces.LOGIN]: esLogin,
    [TranslationNamespaces.VISITS]: esVisits,
    [TranslationNamespaces.VISIT_MANAGEMENT]: esVisitManagement,
    [TranslationNamespaces.FORMS_MANAGEMENT]: esFormsManagement,
    [TranslationNamespaces.WORK_ORDERS]: esWorkOrders,
    [TranslationNamespaces.TECHNICAL_LIFE_SHEET]: esTechnicalLifeSheet,
    [TranslationNamespaces.SCOPES]: esScopes,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'es', // idioma por defecto
  fallbackLng: 'es',
  ns: Object.values(TranslationNamespaces), // Namespaces
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
