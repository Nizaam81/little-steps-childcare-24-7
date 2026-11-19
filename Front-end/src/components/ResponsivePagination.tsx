import { ChevronLeft, ChevronRight } from "lucide-react";

type ResponsivePaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export default function ResponsivePagination({
  page,
  pageCount,
  onPageChange,
}: ResponsivePaginationProps) {
  if (pageCount <= 1) return null;

  const pages = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => {
      const start = Math.max(1, Math.min(page - 2, pageCount - 4));
      return start + index;
    },
  );

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 px-4 py-4"
    >
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={16} /> <span className="hidden sm:inline">Previous</span>
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          aria-current={item === page ? "page" : undefined}
          onClick={() => onPageChange(item)}
          className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold ${
            item === page
              ? "bg-[#278a70] text-white"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
      </button>
    </nav>
  );
}
