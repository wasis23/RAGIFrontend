import React, { forwardRef } from 'react';
import ReactAsyncSelect from 'react-select/async';
import { cn } from '@/lib/utils';

interface AsyncSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  loadOptions: (inputValue: string) => Promise<any[]>;
  value?: any;
  onChange?: (val: any) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  defaultOptions?: boolean | any[];
}

export const AsyncSelect = forwardRef<any, AsyncSelectProps>(
  ({ label, error, hint, required, loadOptions, value, onChange, placeholder, className, id, defaultOptions = true, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const customStyles = {
      control: (base: any, state: any) => ({
        ...base,
        minHeight: '2.5rem',
        borderRadius: '0.375rem',
        borderColor: error ? 'var(--danger)' : state.isFocused ? 'var(--primary-500)' : 'var(--border-light)',
        boxShadow: state.isFocused ? (error ? '0 0 0 1px var(--danger)' : '0 0 0 1px var(--primary-500)') : 'none',
        '&:hover': {
          borderColor: error ? 'var(--danger)' : 'var(--primary-400)'
        },
        fontSize: '0.875rem'
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected ? 'var(--primary-500)' : state.isFocused ? 'var(--primary-50)' : 'white',
        color: state.isSelected ? 'white' : 'var(--text-primary)',
        fontSize: '0.875rem',
        '&:active': {
          backgroundColor: state.isSelected ? 'var(--primary-600)' : 'var(--primary-100)',
        }
      }),
      menuPortal: (base: any) => ({
        ...base,
        zIndex: 9999
      }),
      menu: (base: any) => ({
        ...base,
        zIndex: 9999
      })
    };

    return (
      <div className="form-group">
        {label && (
          <label className="form-label" htmlFor={selectId}>
            {label}
            {required && <span className="required">*</span>}
          </label>
        )}
        <div className="input-wrapper" style={{ display: 'block' }}>
          <ReactAsyncSelect
            ref={ref}
            inputId={selectId}
            cacheOptions
            defaultOptions={defaultOptions}
            loadOptions={loadOptions}
            value={value}
            onChange={onChange}
            placeholder={placeholder || 'Cari...'}
            styles={customStyles}
            className={cn('react-select-container', className)}
            classNamePrefix="react-select"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            menuPosition="fixed"
            {...props}
          />
        </div>
        {error && (
          <p id={`${selectId}-error`} className="form-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${selectId}-hint`} className="form-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

AsyncSelect.displayName = 'AsyncSelect';
