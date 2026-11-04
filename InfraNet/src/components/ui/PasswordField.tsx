"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2C11.05 5.07 11.52 5 12 5c7 0 11 7 11 7a13.2 13.2 0 0 1-3.4 4.1M6.5 6.6C4 8.2 2 12 2 12s4 7 11 7c1.4 0 2.7-.27 3.8-.72" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );

const PasswordField = forwardRef<HTMLInputElement, Props>(
  ({ label, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const fieldId = id ?? props.name;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-sm font-medium text-white">
          {label}
        </label>
        <div
          className={`flex min-h-12 items-center rounded-xl border bg-[#171717] pr-2 transition-colors
            focus-within:border-[#C8FF00] focus-within:ring-2 focus-within:ring-[#C8FF00]/20
            ${error ? "border-white/70" : "border-[#2b2b2b]"}`}
        >
          <input
            ref={ref}
            id={fieldId}
            type={visible ? "text" : "password"}
            className="h-12 w-full min-w-0 rounded-xl bg-transparent px-3 text-base text-white placeholder:text-[#777] outline-none"
            aria-invalid={!!error}
            aria-describedby={error ? `${fieldId}-error` : undefined}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#b8b8b8] transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#C8FF00]"
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          >
            <EyeIcon open={visible} />
          </button>
        </div>
        {error && <p id={`${fieldId}-error`} className="text-xs text-white">{error}</p>}
      </div>
    );
  }
);

PasswordField.displayName = "PasswordField";
export default PasswordField;
