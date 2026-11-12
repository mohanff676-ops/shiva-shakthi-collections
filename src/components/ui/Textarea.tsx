import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, showCount, maxLength, value, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1.5">
        <div className="flex justify-between items-center">
          {label && (
            <label htmlFor={inputId} className="block text-xs font-semibold text-[#A8A29E]">
              {label}
              {props.required && <span className="text-rose-400 ml-1">*</span>}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-xs text-gray-400">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          id={inputId}
          ref={ref}
          value={value}
          maxLength={maxLength}
          rows={props.rows || 4}
          className={cn('input-field resize-y', error && 'input-error', className)}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
