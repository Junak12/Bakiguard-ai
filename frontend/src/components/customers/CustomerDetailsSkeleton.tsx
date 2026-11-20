export default function CustomerDetailsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse">

      <div className="h-5 w-32 rounded bg-slate-200" />

      <div className="mt-6 h-36 rounded-3xl bg-slate-200" />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">

        <div className="h-32 rounded-3xl bg-slate-200" />

        <div className="h-32 rounded-3xl bg-slate-200" />

        <div className="h-32 rounded-3xl bg-slate-200" />

      </div>

      <div className="mt-8 h-64 rounded-3xl bg-slate-200" />

    </div>
  );
}