"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";

import AuthShell from "@/components/auth/AuthShell";
import { adoptAccountLanguage, useI18n } from "@/i18n/I18nProvider";
import { loginUser } from "@/lib/auth";
import { toApiError } from "@/lib/errors";

/** Login for accounts created with email before phone login existed. */
export default function EmailLoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await loginUser({ email: email.trim(), password });
      adoptAccountLanguage(result.user.language);
      router.replace("/dashboard");
    } catch (err) {
      const apiError = toApiError(err);

      setError(
        apiError.network
          ? t("common.networkError")
          : apiError.code === "RATE_LIMITED"
            ? t("auth.errors.tooManyAttempts")
            : apiError.status === 401 || apiError.status === 400
              ? t("auth.errors.invalidCredentials")
              : t("common.somethingWrong")
      );
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60";

  return (
    <AuthShell>
      <form onSubmit={handleSubmit} noValidate>
        <Link
          href="/login"
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> {t("auth.usePhone")}
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">{t("auth.emailTitle")}</h1>
        <p className="mt-2 text-sm text-slate-500">{t("auth.emailSubtitle")}</p>

        <label htmlFor="email" className="mt-8 block text-sm font-semibold text-slate-700">
          {t("auth.emailLabel")}
        </label>
        <div className="relative mt-2">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            disabled={loading}
            className={inputClass}
          />
        </div>

        <label htmlFor="password" className="mt-5 block text-sm font-semibold text-slate-700">
          {t("auth.passwordLabel")}
        </label>
        <div className="relative mt-2">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
            disabled={loading}
            className={`${inputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-700"
          >
            {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>

        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> {t("auth.loggingIn")}
            </>
          ) : (
            <>
              {t("auth.logIn")} <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
