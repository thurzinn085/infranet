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
        <label htmlFor={fieldId} className="text-sm font-medium text-neutral-200">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={`h-11 rounded-md border bg-neutral-950 px-3 text-sm text-neutral-100 placeholder:text-neutral-500
            outline-none transition-colors
            focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20
            ${error ? "border-red-400" : "border-neutral-700"}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="text-xs text-neutral-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
export default TextField;
