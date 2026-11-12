import React, { forwardRef } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'maroon' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  to?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, to, ...props }, ref) => {
    const baseVariantClass = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      maroon: 'btn-maroon',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      icon: 'btn-icon',
    }[variant];

    const sizeClass = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
    }[size];

    const combinedClasses = cn(baseVariantClass, sizeClass, className);

    if (to) {
      const { type: _type, ...restProps } = props as any;
      return (
        <Link to={to} className={combinedClasses} {...restProps}>
          {isLoading && <Spinner size="sm" />}
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={combinedClasses}
        {...props}
      >
        {isLoading && <Spinner size="sm" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
