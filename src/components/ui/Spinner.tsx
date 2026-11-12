import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<SpinnerProps['size'] & string, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-[3px]',
  lg: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block rounded-full border-brand-gold border-t-transparent animate-spin',
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}
