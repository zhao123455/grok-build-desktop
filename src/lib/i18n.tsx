import { en } from './locales/en';
import { zh } from './locales/zh';

export type Locale = 'en' | 'zh';

const storageKey = 'grok-desktop-locale';
const messages: Record<Locale, Record<string, string>> = { en, zh };
const listeners = new Set<() => void>();

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'zh';
}

function readInitialLocale(): Locale {
  try {
    const stored = globalThis.localStorage?.getItem(storageKey);
    if (isLocale(stored)) return stored;
  } catch {
    // Ignore storage access failures in non-browser contexts.
  }
  return 'zh';
}

let locale: Locale = readInitialLocale();

function syncDocumentLang(next: Locale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  }
}

export function getLocale(): Locale {
  return locale;
}

export function subscribeLocale(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setLocale(next: Locale): void {
  if (next === locale) {
    syncDocumentLang(next);
    return;
  }
  locale = next;
  try {
    globalThis.localStorage?.setItem(storageKey, next);
  } catch {
    // Ignore storage access failures in non-browser contexts.
  }
  syncDocumentLang(next);
  listeners.forEach((cb) => cb());
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let value = messages[locale]?.[key] ?? messages.en[key] ?? key;
  if (!vars) return value;
  for (const [name, replacement] of Object.entries(vars)) {
    value = value.replace(new RegExp(`\\{${escapeRegExp(name)}\\}`, 'g'), String(replacement));
  }
  return value;
}

syncDocumentLang(locale);

export function __resetLocaleForTests(next: Locale = 'zh'): void {
  locale = next;
  syncDocumentLang(next);
  listeners.forEach((cb) => cb());
}
