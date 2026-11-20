import type { Metadata, Viewport } from "next";
import { Geist, Hind_Siliguri } from "next/font/google";

import { I18nProvider } from "@/i18n/I18nProvider";
import ServiceWorkerRegistrar from "@/components/pwa/ServiceWorkerRegistrar";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Clear, readable Bangla on low-end Android screens.
const hindSiliguri = Hind_Siliguri({
  variable: "--font-bangla",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "BakiGuard — বাকির খাতা",
    template: "%s · BakiGuard",
  },
  description:
    "বাকির হিসাব রাখুন, কে কত টাকা দেবে জানুন, সময়মতো টাকা তুলুন। Smart credit ledger for Bangladeshi shops.",
  applicationName: "BakiGuard",
  appleWebApp: {
    capable: true,
    title: "BakiGuard",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bn"
      className={`${geistSans.variable} ${hindSiliguri.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>{children}</I18nProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
