"use client";

import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { UseFormReturn, FieldValues } from "react-hook-form";

// ── Form wrapper ─────────────────────────────────────────────────────────────

interface FormProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  handleSubmit: (data: T) => void;
  children: ReactNode;
}

export function Form<T extends FieldValues>({ form, handleSubmit, children }: FormProps<T>) {
  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="px-6 pb-2">
      {children}
    </form>
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <label className={`block text-xs font-semibold text-gray-600 ${className}`}>{children}</label>;
}

// ── TextField ─────────────────────────────────────────────────────────────────

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const TextField = ({ label, className = "", ...props }: TextFieldProps) => (
  <div>
    {label && <Label className="mb-1">{label}</Label>}
    <input
      {...props}
      className={`w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A01733] ${className}`}
    />
  </div>
);

// ── TextArea ─────────────────────────────────────────────────────────────────

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea = ({ label, className = "", ...props }: TextAreaProps) => (
  <div>
    {label && <Label className="mb-1">{label}</Label>}
    <textarea
      {...props}
      rows={3}
      className={`w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A01733] ${className}`}
    />
  </div>
);

// ── Select (thin wrapper around react-select) ─────────────────────────────────

export { default as Select } from "react-select";
