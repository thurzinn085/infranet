import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
};

export default function Button({
  variant = "primary",
  loading,
  disabled,
  children,
  className = "",
  ...props
}: Props) {
  const base =
    "min-h-12 rounded-xl px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary: "bg-[#C8FF00] text-[#101010] hover:bg-[#d6ff45]",
    secondary: "border border-[#2b2b2b] text-white hover:bg-white/10",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Aguarde..." : children}
    </button>
  );
}
