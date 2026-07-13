const Skeleton = ({ className = "", rows = 1 }) => {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-shimmer rounded-[12px] ${className}`}
          style={{ height: i === 0 && rows > 1 ? "24px" : "16px" }}
        />
      ))}
    </div>
  );
};

export const StatCardSkeleton = () => (
  <div className="rounded-[20px] border border-slate-200/80 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between mb-4">
      <div className="h-11 w-11 rounded-[14px] skeleton-shimmer" />
      <div className="h-6 w-14 rounded-full skeleton-shimmer" />
    </div>
    <div className="h-3 w-20 rounded-[6px] skeleton-shimmer mb-2" />
    <div className="h-8 w-32 rounded-[8px] skeleton-shimmer" />
  </div>
);

export const TableRowSkeleton = ({ cols = 5 }) => (
  <tr className="border-b border-slate-100">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 rounded-[6px] skeleton-shimmer w-full" />
      </td>
    ))}
  </tr>
);

export const CardSkeleton = () => (
  <div className="rounded-[20px] border border-slate-200/80 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-4 mb-4">
      <div className="h-10 w-10 rounded-full skeleton-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded-[6px] skeleton-shimmer" />
        <div className="h-3 w-48 rounded-[6px] skeleton-shimmer" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 w-full rounded-[6px] skeleton-shimmer" />
      <div className="h-3 w-3/4 rounded-[6px] skeleton-shimmer" />
    </div>
  </div>
);

export default Skeleton;
