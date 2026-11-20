"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthShell from "@/components/auth/AuthShell";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import PhoneLogin from "@/components/auth/PhoneLogin";
import { adoptAccountLanguage, useI18n } from "@/i18n/I18nProvider";
import { googleLogin } from "@/lib/auth";
import { toApiError } from "@/lib/errors";

/** Phone login is built but switched off until an SMS provider is chosen. */
const PHONE_LOGIN = process.env.NEXT_PUBLIC_PHONE_LOGIN === "true";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCredential(credential: string) {
    setBusy(true);
    setError("");

    try {
      const result = await googleLogin(credential);
      adoptAccountLanguage(result.user.language);
      // New shops start in Settings to add their shop name and bKash number,
      // which appear on every reminder.
      router.replace(result.isNewUser ? "/settings?welcome=1" : "/dashboard");
    } catch (err) {
      const apiError = toApiError(err);

      setError(
        apiError.network
          ? t("common.networkError")
          : apiError.code === "GOOGLE_NOT_CONFIGURED"
            ? t("auth.googleNotConfigured")
            : apiError.code === "RATE_LIMITED"
              ? t("auth.errors.tooManyAttempts")
              : t("auth.googleFailed")
      );
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-slate-900">{t("auth.welcome")}</h1>
      <p className="mt-2 text-sm text-slate-500">{t("auth.googleSubtitle")}</p>

      <div className="mt-8">
        <GoogleSignInButton onCredential={handleCredential} busy={busy} />
      </div>

      {error && <p role="alert" className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {PHONE_LOGIN && (
        <>
          <div className="my-8 flex items-center gap-3 text-xs uppercase text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> {t("auth.or")}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <PhoneLogin />
        </>
      )}

      <Link
        href="/login/email"
        className="mt-8 block text-center text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        {t("auth.useEmail")}
      </Link>
    </AuthShell>
  );
}
