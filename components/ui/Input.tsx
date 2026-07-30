import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  onSuffixClick?: () => void;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefixIcon, suffixIcon, onSuffixClick, required, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="form-group">
        {label && (
          <label className="form-label" htmlFor={inputId}>
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}
        <div className="input-wrapper">
          {prefixIcon && (
            <span className="input-prefix-icon">{prefixIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'input',
              prefixIcon && 'input-icon-left',
              suffixIcon && 'input-icon-right',
              error && 'error',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {suffixIcon && (
            <span
              className="input-suffix-icon"
              onClick={onSuffixClick}
              role={onSuffixClick ? 'button' : undefined}
            >
              {suffixIcon}
            </span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="form-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="form-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
