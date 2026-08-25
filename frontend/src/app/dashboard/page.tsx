import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <p className="text-sm font-medium text-zinc-500">
            Tuesday, August 25, 2026
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900">
            Good morning, Junak 👋
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Here's what's happening with your business today.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-zinc-500">
            Dashboard content is coming next.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}