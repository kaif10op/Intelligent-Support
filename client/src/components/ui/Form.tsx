import type { ReactNode, FormHTMLAttributes } from 'react';
import Button from './Button';

interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  submitText?: string;
  cancelText?: string;
  onCancel?: () => void;
  loading?: boolean;
  isSubmitting?: boolean;
}

const Form = ({
  title,
  subtitle,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  onCancel,
  loading = false,
  isSubmitting = false,
  className = '',
  ...props
}: FormProps) => {
  return (
    <form className={`space-y-6 ${className}`} {...props}>
      {/* Header */}
      {(title || subtitle) && (
        <div>
          {title && <h2 className="heading-2">{title}</h2>}
          {subtitle && <p className="text-surface-600 mt-1">{subtitle}</p>}
        </div>
      )}

      {/* Fields */}
      <div className="space-y-3">{children}</div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-surface-200">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading || isSubmitting}
          >
            {cancelText}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={loading || isSubmitting}
          disabled={loading || isSubmitting}
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
};

export default Form;
