import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
  helperText?: string;
}

const Select = ({
  label,
  error,
  placeholder,
  options,
  helperText,
  className = '',
  id,
  ...props
}: SelectProps) => {
  const selectId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="label text-surface-600 flex items-center justify-between">
          <span>
            {label}
            {props.required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
          </span>
          {error && <span className="text-rose-500 text-[10px] normal-case tracking-normal">{error}</span>}
        </label>
      )}
      <div className="relative group">
        <select
          id={selectId}
          className={`
            input w-full appearance-none shadow-sm pr-10
            ${error 
              ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 text-rose-900 dark:text-rose-100' 
              : 'hover:border-surface-300 focus:border-primary-500 focus:ring-primary-500/20'} 
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={helperText || error ? `${selectId}-help` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-200 ${error ? 'text-rose-400' : 'text-surface-400 group-focus-within:text-primary-500'}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {helperText && !error && (
        <p id={`${selectId}-help`} className="text-[11px] text-surface-500 mt-0.5">{helperText}</p>
      )}
    </div>
  );
};

export default Select;
