"use client";

import { Languages } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";
import type { Language } from "@/i18n/format";
import api from "@/lib/api";
import { getAccessToken } from "@/lib/session";

interface LanguageToggleProps {
  /** "dark" for use on dark backgrounds. */
  tone?: "light" | "dark";
  className?: string;
}

/** বাংলা | EN switch. Also saves the choice to the account when signed in. */
export default function LanguageToggle({ tone = "light", className = "" }: LanguageToggleProps) {
  const { lang, setLang, t } = useI18n();

  function choose(next: Language) {
    if (next === lang) return;

    setLang(next);

    if (getAccessToken()) {
      // Best effort: the device choice already applied.
      api.patch("/auth/me", { language: next }).catch(() => undefined);
    }
  }

  const base =
    tone === "dark"
      ? "border-white/15 bg-white/5 text-white/60"
      : "border-slate-200 bg-white text-slate-500";

  const active =
    tone === "dark" ? "bg-white text-slate-900" : "bg-slate-900 text-white";

  return (
    <div
      role="group"
      aria-label={t("common.language")}
      className={`inline-flex items-center gap-1 rounded-full border p-1 text-xs font-semibold ${base} ${className}`}
    >
      <Languages className="ml-1.5 h-3.5 w-3.5" aria-hidden />

      {(["bn", "en"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => choose(option)}
          aria-pressed={lang === option}
          className={`rounded-full px-2.5 py-1 transition ${
            lang === option ? active : "hover:opacity-80"
          }`}
        >
          {option === "bn" ? "বাংলা" : "EN"}
        </button>
      ))}
    </div>
  );
}
