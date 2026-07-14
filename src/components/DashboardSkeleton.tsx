export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-24 rounded-xl bg-kedar-wheat/40" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-kedar-wheat/40" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-64 rounded-xl bg-kedar-wheat/40 lg:col-span-2" />
        <div className="space-y-4">
          <div className="h-40 rounded-xl bg-kedar-wheat/40" />
          <div className="h-48 rounded-xl bg-kedar-wheat/40" />
        </div>
      </div>
      <p className="text-center text-sm text-slate-500">
        Loading dashboard data… first load after idle may take up to a minute while the server wakes up.
      </p>
    </div>
  );
}
