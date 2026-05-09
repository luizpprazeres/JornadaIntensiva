import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type FieldGroupProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FieldGroup({ label, hint, error, children, className }: FieldGroupProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="font-sans text-doc-xs uppercase tracking-[0.08em] text-ink-500">
        {label}
      </label>
      {children}
      {hint && !error && <span className="text-doc-xs italic text-ink-400">{hint}</span>}
      {error && <span className="text-doc-xs text-clinical-alert">{error}</span>}
    </div>
  );
}

const baseField =
  "w-full rounded-chip border border-paper-300 bg-paper-50 px-3 py-2 font-sans text-doc-base text-ink-800 placeholder:text-paper-400 hover:border-paper-400 focus:border-sepia-500 focus:bg-paper-100";

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseField, "min-h-[44px]", className)} {...rest} />;
}

export function TextArea({
  className,
  rows = 6,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={cn(baseField, "resize-y leading-relaxed font-sans", className)}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select className={cn(baseField, "min-h-[44px] pr-8", className)} {...rest}>
      {children}
    </select>
  );
}
