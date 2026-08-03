import React, { forwardRef, useId } from 'react';
import ReactSelect from 'react-select';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: SelectOption[];
  value?: string | string[];
  onChange?: (val: any) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  isClearable?: boolean;
  isMulti?: boolean;
}

export const Select = forwardRef<any, CustomSelectProps>(
  ({ label, error, hint, required, options, value, onChange, placeholder, className, id, isClearable = false, isMulti = false, ...props }, ref) => {
    const reactId = useId();
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-') || reactId;
    
    const selectedOption = isMulti
      ? options.filter(o => (Array.isArray(value) ? value : []).includes(o.value))
      : (options.find(o => o.value === value) || null);

    const handleChange = (selected: any) => {
      if (onChange) {
        if (isMulti) {
          onChange(selected ? selected.map((s: any) => s.value) : []);
        } else {
          onChange(selected ? selected.value : '');
        }
      }
    };

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
          <ReactSelect
            ref={ref}
            inputId={selectId}
            instanceId={selectId}
            options={options}
            value={selectedOption}
            onChange={handleChange}
            placeholder={placeholder || 'Pilih...'}
            isClearable={isClearable}
            isMulti={isMulti}
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

Select.displayName = 'Select';
