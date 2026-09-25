import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'outline' | 'outline-danger' | 'tab';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  full?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  isLoading = false,
  icon,
  full = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isTab = variant === 'tab';
  const baseClass = isTab ? '' : 'btn';
  const variantClass = isTab ? '' : `btn-${variant}`;
  const sizeClass = size !== 'md' && !isTab ? `btn-${size}` : '';
  const fullClass = full ? 'btn-full' : '';
  const isBusy = loading || isLoading;

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${fullClass} ${className}`.trim()}
      disabled={disabled || isBusy}
      suppressHydrationWarning
      {...props}
    >
      {isBusy ? (
        <span className="spinner" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
