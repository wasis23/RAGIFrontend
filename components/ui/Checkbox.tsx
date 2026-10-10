import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const checkboxId = id || (typeof label === 'string' && label ? label.toLowerCase().replace(/\s+/g, '-') : `cb-${Math.random().toString(36).substring(2,9)}`);

    return (
      <div className="form-group inline-flex items-center">
        <label 
          htmlFor={checkboxId} 
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="relative flex items-center">
            <input
              type="checkbox"
              ref={ref}
              id={checkboxId}
              className={cn(
                'w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer',
                error && 'border-red-500',
                className
              )}
              aria-invalid={!!error}
              aria-describedby={error ? `${checkboxId}-error` : hint ? `${checkboxId}-hint` : undefined}
              {...props}
            />
          </div>
          {label && (
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-700">{label}</span>
              {hint && !error && (
                <span id={`${checkboxId}-hint`} className="text-2xs text-slate-500 mt-0.5">
                  {hint}
                </span>
              )}
            </div>
          )}
        </label>
        {error && (
          <p id={`${checkboxId}-error`} className="text-xs text-red-500 mt-1 pl-6">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
