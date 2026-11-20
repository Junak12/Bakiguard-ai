"use client";

import { type FormEvent, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail, Store, User } from "lucide-react";

import { adoptAccountLanguage, useI18n } from "@/i18n/I18nProvider";
import { loginUser, registerUser } from "@/lib/auth";
import { toApiError } from "@/lib/errors";
import { nextPath } from "@/lib/redirect";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Log in or sign up with email + password. */
export default function EmailPasswordForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { t } = useI18n();
  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function validate() {
    if (isRegister && name.trim().length < 2) return t("auth.errors.nameRequired");
    if (!EMAIL_PATTERN.test(email.trim())) return t("auth.errors.invalidEmail");
    if (isRegister && password.length < 8) return t("auth.errors.passwordShort");
    if (isRegister && password !== confirm) return t("auth.errors.passwordMismatch");
    if (!password) return t("auth.errors.invalidCredentials");
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);

    try {
      const result = isRegister
        ? await registerUser({
            name: name.trim(),
            email: email.trim(),
            password,
            shopName: shopName.trim() || undefined,
          })
        : await loginUser({ email: email.trim(), password });

      adoptAccountLanguage(result.user.language);

      // New shops start in Settings to add their bKash number for reminders,
      // unless they came from a link (e.g. a staff invite).
      router.replace(nextPath(isRegister ? "/settings?welcome=1" : "/dashboard"));
    } catch (err) {
      const apiError = toApiError(err);

      setError(
        apiError.network
          ? t("common.networkError")
          : apiError.code === "RATE_LIMITED"
            ? t("auth.errors.tooManyAttempts")
            : apiError.code === "EMAIL_TAKEN"
              ? t("auth.errors.emailTaken")
              : !isRegister && (apiError.status === 401 || apiError.status === 400)
                ? t("auth.errors.invalidCredentials")
                : t("common.somethingWrong")
      );
      setLoading(false);
    }
  }

  // Keep ?next= when switching between login and sign-up. Read after hydration:
  // the page is pre-rendered without a URL, so a render-time read would stick at "".
  const search = useSyncExternalStore(
    () => () => undefined,
    () => window.location.search,
    () => ""
  );
  const otherHref = `${isRegister ? "/login" : "/register"}${search}`;

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60";
  const iconClass = "pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl font-bold text-slate-900">
        {isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        {isRegister ? t("auth.registerSubtitle") : t("auth.loginSubtitle")}
      </p>

      <div className="mt-8 space-y-5">
        {isRegister && (
          <>
            <label className="block text-sm font-semibold text-slate-700">
              {t("auth.nameLabel")}
              <span className="relative mt-2 block">
                <User className={iconClass} />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  autoFocus
                  placeholder={t("auth.namePlaceholder")}
                  disabled={loading}
                  className={inputClass}
                />
              </span>
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              <span className="flex items-center justify-between">
                {t("auth.shopNameLabel")}
                <span className="text-xs font-normal text-slate-400">{t("common.optional")}</span>
              </span>
              <span className="relative mt-2 block">
                <Store className={iconClass} />
                <input
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  autoComplete="organization"
                  placeholder={t("auth.shopNamePlaceholder")}
                  disabled={loading}
                  className={inputClass}
                />
              </span>
            </label>
          </>
        )}

        <label className="block text-sm font-semibold text-slate-700">
          {t("auth.emailLabel")}
          <span className="relative mt-2 block">
            <Mail className={iconClass} />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoFocus={!isRegister}
              placeholder={t("auth.emailPlaceholder")}
              disabled={loading}
              className={inputClass}
            />
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          {t("auth.passwordLabel")}
          <span className="relative mt-2 block">
            <LockKeyhole className={iconClass} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isRegister ? "new-password" : "current-password"}
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
          </span>
          {isRegister && <span className="mt-1.5 block text-xs font-normal text-slate-400">{t("auth.passwordHint")}</span>}
        </label>

        {isRegister && (
          <label className="block text-sm font-semibold text-slate-700">
            {t("auth.confirmPasswordLabel")}
            <span className="relative mt-2 block">
              <LockKeyhole className={iconClass} />
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                placeholder={t("auth.confirmPasswordPlaceholder")}
                disabled={loading}
                className={inputClass}
              />
            </span>
          </label>
        )}
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {isRegister ? t("auth.registering") : t("auth.loggingIn")}
          </>
        ) : (
          <>
            {isRegister ? t("auth.register") : t("auth.logIn")} <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      <p className="mt-6 text-center text-sm text-slate-500">
        {isRegister ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
        <Link href={otherHref} className="font-semibold text-emerald-700 hover:text-emerald-800">
          {isRegister ? t("auth.logIn") : t("auth.createAccount")}
        </Link>
      </p>

      {!isRegister && <p className="mt-3 text-center text-xs text-slate-400">{t("auth.forgotPassword")}</p>}
    </form>
  );
}
