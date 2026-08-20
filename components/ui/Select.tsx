import React, { forwardRef, useId } from 'react';
import ReactSelect from 'react-select';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: SelectOption[];
  value?: string | number | (string | number)[];
  onChange?: (val: any) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  isClearable?: boolean;
  isMulti?: boolean;
  isDisabled?: boolean;
  disabled?: boolean;
}

export const Select = forwardRef<any, CustomSelectProps>(
  ({ label, error, hint, required, options, value, onChange, placeholder, className, id, isClearable = false, isMulti = false, isDisabled = false, disabled = false, ...props }, ref) => {
    const reactId = useId();
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-') || reactId;

    const selectedOption = isMulti
      ? options.filter(o => (Array.isArray(value) ? value : []).map(String).includes(String(o.value)))
      : (options.find(o => String(o.value) === String(value) || (value !== null && value !== undefined && value !== '' && !isNaN(Number(value)) && Math.round(Number(o.value)) === Math.round(Number(value)))) || null);

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
        minHeight: '44px',
        borderWidth: '1.5px',
        borderRadius: 'var(--radius-md)',
        borderColor: error ? 'var(--danger)' : state.isFocused ? 'var(--border-focus)' : 'var(--border-light)',
        boxShadow: state.isFocused ? (error ? '0 0 0 3px rgba(239, 68, 68, 0.12)' : '0 0 0 3px rgb(59 130 246 / 0.12)') : 'none',
        '&:hover': {
          borderColor: error ? 'var(--danger)' : state.isFocused ? 'var(--border-focus)' : 'var(--primary-400)'
        },
        fontSize: '0.9375rem'
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected ? 'var(--primary-500)' : state.isFocused ? 'var(--primary-50)' : 'white',
        color: state.isSelected ? 'white' : 'var(--text-primary)',
        fontSize: '0.9375rem',
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
            isDisabled={isDisabled || disabled}
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
