import {
  ArrowDownRight,
  ArrowUpRight,
  LucideIcon,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: "positive" | "negative" | "neutral";
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendType = "neutral",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
          <Icon
            size={19}
            className="text-zinc-700"
          />
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              trendType === "positive"
                ? "bg-emerald-50 text-emerald-600"
                : trendType === "negative"
                ? "bg-red-50 text-red-600"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {trendType === "positive" && (
              <ArrowUpRight size={13} />
            )}

            {trendType === "negative" && (
              <ArrowDownRight size={13} />
            )}

            {trend}
          </div>
        )}
      </div>

      <div className="mt-5">
        <p className="text-sm text-zinc-500">
          {title}
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
          {value}
        </h2>

        <p className="mt-1 text-xs text-zinc-400">
          {description}
        </p>
      </div>
    </div>
  );
}