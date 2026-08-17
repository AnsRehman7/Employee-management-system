import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const buildPageList = (page, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const ordered = [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);

  return ordered.reduce((items, value, index) => {
    if (index > 0 && value - ordered[index - 1] > 1) items.push(`gap-${value}`);
    items.push(value);
    return items;
  }, []);
};

const Pagination = ({
  className = "",
  firstItem,
  itemLabel = "records",
  lastItem,
  onPageChange,
  page,
  total,
  totalPages,
}) => {
  if (!total) return null;

  const pageButtonClass = (isActive) =>
    `flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-xs font-bold transition ${
      isActive
        ? "border-emerald-600 bg-emerald-700 text-white"
        : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    }`;

  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className={`flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-xs font-semibold text-slate-500">
        Showing {firstItem}-{lastItem} of {total} {itemLabel}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        {buildPageList(page, totalPages).map((value) =>
          typeof value === "number" ? (
            <button
              aria-current={value === page ? "page" : undefined}
              className={pageButtonClass(value === page)}
              key={value}
              onClick={() => onPageChange(value)}
              type="button"
            >
              {value}
            </button>
          ) : (
            <span className="px-1 text-xs font-bold text-slate-400" key={value}>
              ...
            </span>
          ),
        )}

        <button
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
