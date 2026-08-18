/**
 * Loading placeholders that mirror the shape of the content being fetched, so the
 * layout does not jump when data lands.
 *
 * Each block is hidden from assistive tech and paired with a single polite status
 * message, rather than announcing dozens of empty bars.
 */
const shimmer = "animate-pulse rounded bg-slate-200";

export const Skeleton = ({ className = "", style }) => (
  <div aria-hidden="true" className={`${shimmer} ${className}`} style={style} />
);

const LoadingAnnouncement = ({ label }) => (
  <span aria-live="polite" className="sr-only" role="status">
    {label}
  </span>
);

/** Table-shaped placeholder for the list pages. */
export const TableSkeleton = ({ columns = 5, label = "Loading records", rows = 6 }) => (
  <div aria-busy="true" className="w-full">
    <LoadingAnnouncement label={label} />
    <div className="hidden border-b border-slate-200 bg-slate-50 px-4 py-3 lg:flex lg:gap-4">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton className="h-3 flex-1" key={`head-${index}`} />
      ))}
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="flex items-center gap-4 px-4 py-4" key={`row-${rowIndex}`}>
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-[45%]" />
            <Skeleton className="h-3 w-[28%]" />
          </div>
          {Array.from({ length: Math.max(0, columns - 2) }).map((_, cellIndex) => (
            <Skeleton className="hidden h-3 flex-1 lg:block" key={`cell-${rowIndex}-${cellIndex}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

/** Metric-tile row placeholder. */
export const StatsSkeleton = ({ count = 4, label = "Loading summary" }) => (
  <div
    aria-busy="true"
    className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 lg:grid-cols-4"
  >
    <LoadingAnnouncement label={label} />
    {Array.from({ length: count }).map((_, index) => (
      <div className="flex min-h-20 items-center gap-3 bg-white px-4 py-3" key={index}>
        <Skeleton className="h-5 w-5 shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);

/** Generic stacked-lines placeholder for cards and detail panels. */
export const CardSkeleton = ({ label = "Loading", lines = 3 }) => (
  <div aria-busy="true" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <LoadingAnnouncement label={label} />
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="mt-5 space-y-2.5">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton className="h-3" key={index} style={{ width: `${100 - index * 12}%` }} />
      ))}
    </div>
  </div>
);

export default Skeleton;
