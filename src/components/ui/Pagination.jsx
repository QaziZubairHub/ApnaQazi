const Pagination = ({ currentPage, totalPages, onPageChange, pageSize = 10, totalCount = 0 }) => {
  const maxVisible = 5;
  const startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible);
  const pages = [];

  for (let i = startPage; i < endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 0) return null;

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 border-t border-slate-100 pt-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span>
          Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount} results
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="w-9 h-9 rounded-[12px] flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-9 h-9 rounded-[12px] flex items-center justify-center text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-primary text-white shadow-md shadow-primary/15'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {page + 1}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="w-9 h-9 rounded-[12px] flex items-center justify-center text-slate-400 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
