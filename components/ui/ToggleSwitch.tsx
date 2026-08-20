import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  id?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  loading = false,
  className,
  id,
}: ToggleSwitchProps) {
  const switchId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label htmlFor={switchId} className="text-xs font-bold text-slate-800 cursor-pointer block">
              {label}
            </label>
          )}
          {description && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
        </div>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          checked ? 'bg-primary-600' : 'bg-slate-200',
          (disabled || loading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="sr-only">{label || 'Toggle switch'}</span>
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        >
          {loading && <Loader2 size={12} className="animate-spin text-primary-600" />}
        </span>
      </button>
    </div>
  );
}
