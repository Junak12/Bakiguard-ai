import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react";

interface AIInsightsProps {
  overdueCustomers: number;
  highRiskCustomers: number;
}

export default function AIInsights({
  overdueCustomers,
  highRiskCustomers,
}: AIInsightsProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-900 p-6 text-white shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <BrainCircuit size={20} />
          </div>

          <div>
            <h2 className="font-semibold">
              BakiGuard AI
            </h2>

            <p className="text-xs text-zinc-400">
              Business intelligence
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
          ACTIVE
        </span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <AlertTriangle
            size={17}
            className="text-amber-400"
          />

          <div className="flex-1">
            <p className="text-sm">
              {overdueCustomers} overdue customers
            </p>

            <p className="text-xs text-zinc-500">
              May require follow-up
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <BrainCircuit
            size={17}
            className="text-violet-400"
          />

          <div className="flex-1">
            <p className="text-sm">
              {highRiskCustomers} high-risk accounts
            </p>

            <p className="text-xs text-zinc-500">
              Based on payment behavior
            </p>
          </div>
        </div>

        {overdueCustomers === 0 &&
          highRiskCustomers === 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-400/10 p-3">
              <CheckCircle2
                size={17}
                className="text-emerald-400"
              />

              <p className="text-sm text-emerald-300">
                Everything looks healthy.
              </p>
            </div>
          )}
      </div>

      <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-medium transition hover:bg-white/15">
        View AI insights
        <ArrowRight size={16} />
      </button>
    </div>
  );
}