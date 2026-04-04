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
  ...props
}: InputProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="label text-surface-600">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-surface-400 pointer-events-none flex-shrink-0">
            {icon}
          </div>
        )}
        <input
          className={`input w-full ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-surface-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
