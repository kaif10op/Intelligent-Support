import type { ReactNode } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helperText?: string;
}

const Input = ({
  label,
  error,
  icon,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) => {
  const inputId = id || props.name || Math.random().toString(36).substring(7);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="label text-surface-600 flex items-center justify-between">
          <span>
            {label}
            {props.required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
          </span>
          {error && <span className="text-rose-500 text-[10px] normal-case tracking-normal">{error}</span>}
        </label>
      )}
      <div className="relative flex items-center group">
        {icon && (
          <div className={`absolute left-3.5 pointer-events-none flex-shrink-0 transition-colors duration-200 z-10 ${error ? 'text-rose-400' : 'text-surface-400 group-focus-within:text-primary-500'}`}>
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            input w-full shadow-sm
            ${icon ? 'pl-10 relative' : ''} 
            ${error 
              ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 text-rose-900 dark:text-rose-100 placeholder-rose-300' 
              : 'hover:border-surface-300 focus:border-primary-500 focus:ring-primary-500/20'} 
            ${className}
          `}
          aria-invalid={!!error}
          aria-describedby={helperText || error ? `${inputId}-help` : undefined}
          {...props}
        />
      </div>
      {helperText && !error && (
        <p id={`${inputId}-help`} className="text-[11px] text-surface-500 mt-0.5">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
