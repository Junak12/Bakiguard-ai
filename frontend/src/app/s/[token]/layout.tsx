import type { Metadata } from "next";
import type { ReactNode } from "react";

// Personal financial data: keep out of search engines, don't leak the URL as a referrer.
export const metadata: Metadata = {
  title: "হিসাবের বিবরণ",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function StatementLayout({ children }: { children: ReactNode }) {
  return children;
}
