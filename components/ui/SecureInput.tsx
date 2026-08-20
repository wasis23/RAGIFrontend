import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  allowCopy?: boolean;
}

export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ label, error, hint, required, allowCopy = true, className, id, type = 'password', value, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const handleCopy = () => {
      if (value) {
        navigator.clipboard.writeText(String(value));
        setCopied(true);
        toast.success('Kredensial berhasil disalin!');
        setTimeout(() => setCopied(false), 2500);
      }
    };

    const isSecretType = type === 'password';
    const inputType = isSecretType ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="form-group">
        {label && (
          <label className="form-label text-xs font-bold text-slate-700" htmlFor={inputId}>
            {label}
            {required && <span className="text-rose-500 font-bold ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            value={value}
            className={cn(
              'input pr-20 font-mono text-xs text-slate-800 transition-all',
              error && 'error border-rose-500 bg-rose-50/20',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          <div className="absolute right-2 flex items-center gap-1">
            {allowCopy && value && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                title="Salin Kredensial"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            )}
            {isSecretType && (
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                title={showPassword ? 'Sembunyikan' : 'Tampilkan Kredensial'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
        </div>
        {error && (
          <p id={`${inputId}-error`} className="form-error text-xs text-rose-500 mt-1 font-medium">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="form-hint text-[11px] text-slate-400 mt-1">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';
