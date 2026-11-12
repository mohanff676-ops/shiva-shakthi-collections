import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalCount, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-white/5">
      <p className="text-xs sm:text-sm text-[#A8A29E]">
        Showing <span className="font-medium text-[#F7F5F0]">{start}</span> to{' '}
        <span className="font-medium text-[#F7F5F0]">{end}</span> of{' '}
        <span className="font-medium text-[#F7F5F0]">{totalCount}</span> products
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2 min-h-[40px] min-w-[40px]"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => {
            return (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            );
          })
          .map((page, index, array) => {
            const showEllipsis = index > 0 && page - array[index - 1] > 1;
            return (
              <span key={page} className="flex items-center">
                {showEllipsis && <span className="px-2 text-[#78716C]">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-semibold transition-colors min-h-[36px] ${
                    currentPage === page
                      ? 'bg-brand-champagne text-[#0A0A0C] font-bold shadow-gold-sm'
                      : 'text-[#A8A29E] hover:text-[#F7F5F0] hover:bg-white/5'
                  }`}
                >
                  {page}
                </button>
              </span>
            );
          })}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2 min-h-[40px] min-w-[40px]"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
