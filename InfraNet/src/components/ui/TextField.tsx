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
        <label htmlFor={fieldId} className="text-sm font-medium text-white">
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          className={`min-h-12 rounded-xl border bg-[#171717] px-3 text-base text-white placeholder:text-[#777]
            outline-none transition-colors
            focus:border-[#C8FF00] focus:ring-2 focus:ring-[#C8FF00]/20
            ${error ? "border-white/70" : "border-[#2b2b2b]"}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${fieldId}-hint`} className="text-xs text-[#999]">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${fieldId}-error`} className="text-xs text-white">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
export default TextField;
