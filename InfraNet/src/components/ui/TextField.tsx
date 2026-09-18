import { InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

const TextField = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, id, ...props }, ref) => {
    const fieldId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={`h-11 rounded-md border px-3 text-sm text-ink-900 placeholder:text-ink-300
            outline-none transition-colors
            focus:border-brand-600 focus:ring-2 focus:ring-brand-50
            ${error ? "border-danger" : "border-line"}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="text-xs text-ink-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
export default TextField;
