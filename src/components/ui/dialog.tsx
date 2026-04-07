"use client";

import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 backdrop-blur-sm"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}>
      {children}
    </div>
  );
}

export function DialogContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative w-full max-w-[480px] rounded-2xl bg-white shadow-2xl ${className}`}
      onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  );
}

export function DialogHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-6 pb-2 pt-5">
      <h2 className="text-lg font-black text-[#1A1A1A]">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
      {children}
    </div>
  );
}

export function DialogClose({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
      Cancelar
    </button>
  );
}
