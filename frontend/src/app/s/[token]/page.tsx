"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Link2Off, ShieldCheck, Wallet } from "lucide-react";

import LanguageToggle from "@/components/i18n/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";

interface PublicStatement {
  shop: { name: string; paymentInfo: string | null };
  customer: { name: string; totalDue: number; nextDueAt: string | null; overdueAmount: number };
  transactions: {
    type: "CREDIT" | "PAYMENT";
    amount: number;
    description?: string;
    dueDate?: string;
    createdAt: string;
  }[];
  generatedAt: string;
}

/**
 * What a customer sees when they open the link from a reminder.
 * No login; uses plain fetch so no session logic runs here.
 */
export default function StatementPage() {
  const { token } = useParams<{ token: string }>();
  const { t, money, date, dateTime } = useI18n();

  const [statement, setStatement] = useState<PublicStatement | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    let active = true;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/statements/${encodeURIComponent(token)}`, {
      cache: "no-store",
      credentials: "omit",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const body = await response.json();
        if (active) setStatement(body.data);
      })
      .catch(() => active && setInvalid(true));

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="mb-5 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> {t("statement.title")}
          </span>
          <LanguageToggle />
        </div>

        {invalid ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Link2Off className="mx-auto h-10 w-10 text-slate-400" />
            <h1 className="mt-4 text-lg font-bold text-slate-900">{t("statement.invalidTitle")}</h1>
            <p className="mt-2 text-sm text-slate-500">{t("statement.invalidText")}</p>
          </div>
        ) : !statement ? (
          <div className="space-y-3">
            <div className="h-48 animate-pulse rounded-2xl bg-white" />
            <div className="h-64 animate-pulse rounded-2xl bg-white" />
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-2xl bg-[#07110d] p-6 text-white shadow-lg">
              <p className="text-sm text-white/60">{t("statement.from", { shop: statement.shop.name })}</p>
              <p className="text-sm text-white/60">{t("statement.for", { name: statement.customer.name })}</p>

              {statement.customer.totalDue > 0 ? (
                <>
                  <p className="mt-5 text-sm text-white/60">{t("statement.balance")}</p>
                  <p className="text-4xl font-bold">{money(statement.customer.totalDue)}</p>

                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    {statement.customer.overdueAmount > 0 && (
                      <span className="rounded-full bg-rose-500/20 px-3 py-1 text-rose-200">
                        {t("statement.overdue")}: {money(statement.customer.overdueAmount)}
                      </span>
                    )}
                    {statement.customer.nextDueAt && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
                        {t("statement.nextDue")}: {date(statement.customer.nextDueAt)}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-5 flex items-center gap-2 text-lg font-semibold text-emerald-300">
                  <CheckCircle2 className="h-6 w-6" /> {t("statement.settled")}
                </p>
              )}
            </section>

            {statement.shop.paymentInfo && statement.customer.totalDue > 0 && (
              <section className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{t("statement.payVia")}</p>
                  <p className="mt-0.5 text-base font-medium text-emerald-800">{statement.shop.paymentInfo}</p>
                </div>
              </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h2 className="border-b border-slate-100 p-4 font-bold text-slate-900">{t("statement.history")}</h2>
              <ul className="divide-y divide-slate-100">
                {statement.transactions.map((entry, index) => {
                  const isCredit = entry.type === "CREDIT";
                  return (
                    <li key={index} className="flex items-start gap-3 p-4">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isCredit ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {isCredit ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {isCredit ? t("statement.credit") : t("statement.payment")}
                          {entry.description && <span className="font-normal text-slate-500"> · {entry.description}</span>}
                        </p>
                        <p className="text-xs text-slate-400">
                          {dateTime(entry.createdAt)}
                          {isCredit && entry.dueDate && <> · {t("statement.due", { date: date(entry.dueDate) })}</>}
                        </p>
                      </div>
                      <p className={`shrink-0 text-sm font-bold ${isCredit ? "text-amber-600" : "text-emerald-600"}`}>
                        {isCredit ? "+" : "−"}
                        {money(entry.amount)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>

            <p className="text-center text-xs text-slate-400">
              {t("statement.asOf", { date: dateTime(statement.generatedAt) })} · {t("statement.poweredBy")}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
