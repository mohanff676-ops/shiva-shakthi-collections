import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'maroon' | 'green' | 'red' | 'gray' | 'blue' | 'yellow';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'gold', size = 'sm', children, ...props }: BadgeProps) {
  const variantClass = {
    gold: 'badge-gold',
    maroon: 'badge-maroon',
    green: 'badge-green',
    red: 'badge-red',
    gray: 'badge-gray',
    blue: 'badge-blue',
    yellow: 'badge-yellow',
  }[variant];

  const sizeClass = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={cn('badge', variantClass, sizeClass, className)} {...props}>
      {children}
    </span>
  );
}
