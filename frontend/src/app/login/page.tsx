"use client";

import AuthShell from "@/components/auth/AuthShell";
import EmailPasswordForm from "@/components/auth/EmailPasswordForm";
import PhoneLogin from "@/components/auth/PhoneLogin";
import { useI18n } from "@/i18n/I18nProvider";

/** Phone login is built but switched off until an SMS provider is chosen. */
const PHONE_LOGIN = process.env.NEXT_PUBLIC_PHONE_LOGIN === "true";

export default function LoginPage() {
  const { t } = useI18n();

  return (
    <AuthShell>
      <EmailPasswordForm mode="login" />

      {PHONE_LOGIN && (
        <>
          <div className="my-8 flex items-center gap-3 text-xs uppercase text-slate-400">
            <span className="h-px flex-1 bg-slate-200" /> {t("auth.or")}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <PhoneLogin />
        </>
      )}
    </AuthShell>
  );
}
