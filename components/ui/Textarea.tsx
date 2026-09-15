import { forwardRef, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const cleanLabel = label ? label.replace(/\s*\*+$/, '') : undefined;
    const textareaId = id || cleanLabel?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="form-group">
        {cleanLabel && (
          <label className="form-label" htmlFor={textareaId}>
            {cleanLabel}
            {required && <span className="required">*</span>}
          </label>
        )}
        <div className="input-wrapper">
          <textarea
            ref={ref}
            id={textareaId}
            className={cn(
              'input',
              'min-h-[100px] resize-y py-2',
              error && 'error',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={`${textareaId}-error`} className="form-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="form-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
