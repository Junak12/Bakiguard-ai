import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  /** Visual emphasis: "warning" for money at risk, "success" for money in. */
  tone?: "neutral" | "warning" | "success" | "danger";
}

const tones = {
  neutral: "bg-slate-100 text-slate-700",
  warning: "bg-amber-50 text-amber-600",
  success: "bg-emerald-50 text-emerald-600",
  danger: "bg-rose-50 text-rose-600",
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "neutral",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={19} />
      </div>

      <p className="mt-4 text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
    </div>
  );
}
