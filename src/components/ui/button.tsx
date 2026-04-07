"use client";

import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "primary" | "secondary" | "destructive" | "minimal";
  size?: "sm" | "base" | "lg";
  loading?: boolean;
  StartIcon?: string;
}

const COLOR_CLASSES = {
  primary: "bg-[#D4A017] text-white hover:bg-[#B8860B] disabled:bg-[#D4A01799]",
  secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  destructive: "bg-red-500 text-white hover:bg-red-600",
  minimal: "bg-transparent text-gray-700 hover:bg-gray-100",
};

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-xs",
  base: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export function Button({
  color = "primary",
  size = "base",
  loading,
  StartIcon,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${COLOR_CLASSES[color]} ${SIZE_CLASSES[size]} ${className}`}>
      {loading && <span className="text-xs">⏳</span>}
      {!loading && StartIcon === "plus" && <span className="text-sm font-black leading-none">+</span>}
      {children}
    </button>
  );
}
