export function UserTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl border border-black/10 bg-white/90 shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-black/10 text-left text-sm font-semibold text-black">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3 text-right">Generations last 30 d</th>
            <th className="px-4 py-3 text-right">Credits</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 10 }).map((_, i) => (
            <tr
              // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton rows don't have unique keys
              key={i}
              className="border-b border-black/5 text-sm text-black/80"
            >
              <td className="px-4 py-3">
                <div className="h-4 w-48 animate-pulse rounded-sm bg-black/10" />
              </td>
              <td className="px-4 py-3">
                <div className="ml-auto h-4 w-12 animate-pulse rounded-sm bg-black/10" />
              </td>
              <td className="px-4 py-3">
                <div className="ml-auto h-4 w-12 animate-pulse rounded-sm bg-black/10" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-24 animate-pulse rounded-sm bg-black/10" />
              </td>
              <td className="px-4 py-3">
                <div className="h-4 w-6 animate-pulse rounded-sm bg-black/10" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
