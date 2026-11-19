"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  DEFAULT_LANGUAGE,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  formatTime,
  type Language,
} from "./format";
import { dictionaries, type Dictionary } from "./messages";

const STORAGE_KEY = "bakiguard.language";
const CHANGE_EVENT = "bakiguard:language";

// ------------------------------------------------------------
// Language store (localStorage, shared across components/tabs)
// ------------------------------------------------------------

function readStoredLanguage(): Language | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "bn" || value === "en" ? value : null;
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeLanguage(lang: Language) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private mode etc.: the choice just won't persist.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Adopts the language saved on the user's account, unless this device
 * already has an explicit choice (e.g. first login on a new phone).
 */
export function adoptAccountLanguage(lang: Language | null | undefined) {
  if (lang && !readStoredLanguage()) {
    writeLanguage(lang);
  }
}

// ------------------------------------------------------------
// Translation
// ------------------------------------------------------------

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;

/** "auth.login.title" style keys, checked at compile time. */
export type TranslationKey<T = Dictionary> = {
  [K in keyof T]: T[K] extends string ? K & string : Join<K, TranslationKey<T[K]>>;
}[keyof T];

type Vars = Record<string, string | number>;

function lookup(dictionary: Dictionary, key: string): string {
  let node: unknown = dictionary;

  for (const part of key.split(".")) {
    node = (node as Record<string, unknown> | undefined)?.[part];
  }

  return typeof node === "string" ? node : key;
}

function interpolate(template: string, vars?: Vars) {
  if (!vars) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

// ------------------------------------------------------------
// Context
// ------------------------------------------------------------

interface I18nValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
  money: (value: number) => string;
  number: (value: number) => string;
  date: (value: string | Date) => string;
  time: (value: string | Date) => string;
  dateTime: (value: string | Date) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Server render and first client render use the default language,
  // then the stored preference takes over (no hydration mismatch).
  const lang = useSyncExternalStore(
    subscribe,
    () => readStoredLanguage() ?? DEFAULT_LANGUAGE,
    () => DEFAULT_LANGUAGE
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Language) => writeLanguage(next), []);

  const value = useMemo<I18nValue>(() => {
    const dictionary = dictionaries[lang];

    return {
      lang,
      setLang,
      t: (key, vars) => interpolate(lookup(dictionary, key), vars),
      money: (n) => formatMoney(n, lang),
      number: (n) => formatNumber(n, lang),
      date: (d) => formatDate(d, lang),
      time: (d) => formatTime(d, lang),
      dateTime: (d) => formatDateTime(d, lang),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);

  if (!value) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }

  return value;
}
