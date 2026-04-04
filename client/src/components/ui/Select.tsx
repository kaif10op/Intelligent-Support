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
  ...props
}: SelectProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="label text-surface-600">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={`input w-full appearance-none ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
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
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-surface-500">{helperText}</p>
      )}
    </div>
  );
};

export default Select;
