import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'outline-danger';
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
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const fullClass = full ? 'btn-full' : '';
  const isBusy = loading || isLoading;

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${fullClass} ${className}`.trim()}
      disabled={disabled || isBusy}
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
