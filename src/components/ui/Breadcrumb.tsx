import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs sm:text-sm text-[#8E8A85] py-3 overflow-x-auto no-scrollbar">
      <Link to="/" className="hover:text-[#DFBE76] transition-colors flex items-center gap-1 shrink-0">
        <Home className="w-3.5 h-3.5 text-[#C5A059]" />
        <span className="sr-only">Home</span>
      </Link>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center shrink-0">
            <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-[#44403C]" />
            {isLast || !item.href ? (
              <span className="font-medium text-[#F7F5F0] line-clamp-1">{item.label}</span>
            ) : (
              <Link to={item.href} className="hover:text-[#DFBE76] transition-colors line-clamp-1 text-[#A8A29E]">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
