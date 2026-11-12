import React from 'react';
import { Button } from './Button';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-[#121215] border border-white/5 rounded-2xl', className)}>
      <div className="w-16 h-16 rounded-full bg-[#C5A059]/10 text-brand-champagne flex items-center justify-center mb-4 border border-[#C5A059]/20">
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>
      <h3 className="font-heading text-xl font-bold text-[#F7F5F0] mb-2">{title}</h3>
      <p className="text-[#A8A29E] max-w-sm mb-6 text-sm">{description}</p>
      {actionLabel && (
        <Button to={actionTo} onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
