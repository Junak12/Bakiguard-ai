"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";

import { useI18n } from "@/i18n/I18nProvider";

/** The parts of Google Identity Services we use. */
interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        ux_mode?: "popup" | "redirect";
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }): void;
      renderButton(
        parent: HTMLElement,
        options: {
          type?: "standard";
          theme?: "outline" | "filled_blue" | "filled_black";
          size?: "large" | "medium";
          text?: "continue_with" | "signin_with";
          shape?: "pill" | "rectangular";
          width?: number;
          locale?: string;
          logo_alignment?: "left" | "center";
        }
      ): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

interface Props {
  /** Receives the ID token; the parent sends it to the backend. */
  onCredential: (credential: string) => void;
  busy?: boolean;
}

/**
 * Official "Continue with Google" button (Google Identity Services).
 * Google renders the button itself, so it follows Google's branding rules.
 */
export default function GoogleSignInButton({ onCredential, busy = false }: Props) {
  const { t, lang } = useI18n();
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Keep the latest handler without re-initializing Google.
  const handler = useRef(onCredential);

  useEffect(() => {
    handler.current = onCredential;
  });

  const render = useCallback(() => {
    const google = window.google;
    if (!google || !container.current) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => handler.current(response.credential),
      ux_mode: "popup",
      cancel_on_tap_outside: true,
    });

    container.current.innerHTML = "";
    google.accounts.id.renderButton(container.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      shape: "pill",
      logo_alignment: "center",
      width: Math.min(400, container.current.offsetWidth || 320),
      locale: lang === "bn" ? "bn" : "en",
    });

    setReady(true);
  }, [lang]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {t("auth.googleNotConfigured")}
      </p>
    );
  }

  return (
    <div className="relative">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={render}
        onError={() => setFailed(true)}
      />

      {/* Re-render when the language changes so Google's button text matches. */}
      <div key={lang} ref={(node) => {
        container.current = node;
        if (node && window.google) render();
      }} className="flex min-h-11 w-full justify-center" />

      {!ready && !failed && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-slate-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("common.loading")}
        </div>
      )}

      {busy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/80 text-sm font-medium text-slate-700">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("auth.signingIn")}
        </div>
      )}

      {failed && <p className="mt-3 text-center text-sm text-red-600">{t("common.networkError")}</p>}
    </div>
  );
}
