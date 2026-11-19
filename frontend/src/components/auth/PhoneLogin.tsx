"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Phone, Store, User } from "lucide-react";

import { adoptAccountLanguage, useI18n } from "@/i18n/I18nProvider";
import { toAsciiDigits } from "@/i18n/format";
import { requestOtp, verifyOtp } from "@/lib/auth";
import { toApiError } from "@/lib/errors";
import { BD_PHONE_PATTERN as PHONE_PATTERN, normalizePhone } from "@/lib/phone";


type Step = "phone" | "code";

/** Phone + SMS code login. Shown only when NEXT_PUBLIC_PHONE_LOGIN=true. */
export default function PhoneLogin() {
  const router = useRouter();
  const { t, number } = useI18n();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const codeInput = useRef<HTMLInputElement>(null);

  // Ticks once a second while a resend countdown is running.
  useEffect(() => {
    if (resendAt <= Date.now()) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000));

  function explain(err: unknown) {
    const apiError = toApiError(err);

    if (apiError.network) return t("common.networkError");

    switch (apiError.code) {
      case "OTP_INVALID":
        return t("auth.errors.wrongCode");
      case "OTP_COOLDOWN":
        return t("auth.errors.cooldown", {
          seconds: number(Number(apiError.errors?.retryAfterSeconds ?? 60)),
        });
      case "OTP_LIMIT":
        return t("auth.errors.tooManyCodes");
      case "NAME_REQUIRED":
        return t("auth.errors.nameRequired");
      case "RATE_LIMITED":
        return t("auth.errors.tooManyAttempts");
      case "VALIDATION_ERROR":
        return apiError.errors?.phone ? t("auth.errors.invalidPhone") : t("common.somethingWrong");
      default:
        return t("common.somethingWrong");
    }
  }

  async function sendCode(isResend = false) {
    const normalized = normalizePhone(phone);

    if (!PHONE_PATTERN.test(normalized)) {
      setError(t("auth.errors.invalidPhone"));
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const result = await requestOtp(normalized);

      setPhone(normalized);
      setIsNewUser(result.isNewUser);
      setResendAt(Date.now() + result.resendAfterSeconds * 1000);
      setNow(Date.now());
      setStep("code");

      if (isResend) setNotice(t("auth.codeResent"));

      setTimeout(() => codeInput.current?.focus(), 50);
    } catch (err) {
      setError(explain(err));
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanCode = toAsciiDigits(code).replace(/\D/g, "");

    if (cleanCode.length !== 6) {
      setError(t("auth.errors.invalidCode"));
      return;
    }

    if (isNewUser && name.trim().length < 2) {
      setError(t("auth.errors.nameRequired"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyOtp({
        phone,
        code: cleanCode,
        ...(isNewUser ? { name: name.trim(), shopName: shopName.trim() || undefined } : {}),
      });

      adoptAccountLanguage(result.user.language);
      router.replace(result.isNewUser ? "/customers/new" : "/dashboard");
    } catch (err) {
      setError(explain(err));
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60";

  return (
    <>
      {step === "phone" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendCode();
          }}
          noValidate
        >
          <h1 className="text-2xl font-bold text-slate-900">{t("auth.phoneStepTitle")}</h1>
          <p className="mt-2 text-sm text-slate-500">{t("auth.phoneStepSubtitle")}</p>

          <label htmlFor="phone" className="mt-8 block text-sm font-semibold text-slate-700">
            {t("auth.phoneLabel")}
          </label>
          <div className="relative mt-2">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={t("auth.phonePlaceholder")}
              disabled={loading}
              className={`${inputClass} tracking-wide`}
            />
          </div>

          {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> {t("auth.sendingCode")}
              </>
            ) : (
              <>
                {t("auth.sendCode")} <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} noValidate>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setCode("");
              setError("");
              setNotice("");
            }}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" /> {t("auth.changeNumber")}
          </button>

          <h1 className="text-2xl font-bold text-slate-900">
            {isNewUser ? t("auth.newAccountTitle") : t("auth.codeStepTitle")}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {t("auth.codeStepSubtitle", { phone })}
            {isNewUser && <> {t("auth.newAccountSubtitle")}</>}
          </p>

          <label htmlFor="code" className="mt-8 block text-sm font-semibold text-slate-700">
            {t("auth.codeLabel")}
          </label>
          <div className="relative mt-2">
            <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              ref={codeInput}
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="••••••"
              disabled={loading}
              className={`${inputClass} text-xl font-semibold tracking-[0.5em]`}
            />
          </div>

          {isNewUser && (
            <>
              <label htmlFor="name" className="mt-5 block text-sm font-semibold text-slate-700">
                {t("auth.nameLabel")}
              </label>
              <div className="relative mt-2">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("auth.namePlaceholder")}
                  disabled={loading}
                  className={inputClass}
                />
              </div>

              <label
                htmlFor="shopName"
                className="mt-5 flex items-center justify-between text-sm font-semibold text-slate-700"
              >
                {t("auth.shopNameLabel")}
                <span className="text-xs font-normal text-slate-400">{t("common.optional")}</span>
              </label>
              <div className="relative mt-2">
                <Store className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="shopName"
                  autoComplete="organization"
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  placeholder={t("auth.shopNamePlaceholder")}
                  disabled={loading}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
          {notice && !error && <p className="mt-3 text-sm text-emerald-700">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> {t("auth.verifying")}
              </>
            ) : (
              <>
                {t("auth.verify")} <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <div className="mt-5 text-center text-sm">
            {secondsLeft > 0 ? (
              <span className="text-slate-400">
                {t("auth.resendIn", { seconds: number(secondsLeft) })}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void sendCode(true)}
                disabled={loading}
                className="font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {t("auth.resend")}
              </button>
            )}
          </div>
        </form>
      )}
    </>
  );
}
