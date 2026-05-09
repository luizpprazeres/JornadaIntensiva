import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type MonoBlockProps = {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

/**
 * MonoBlock — bloco monoespaçado para dados clínicos: laboratório, controles, citações.
 * Fundo paper-100 muito sutil, borda fina à esquerda como margem documental.
 */
export function MonoBlock({ children, className, ariaLabel }: MonoBlockProps) {
  return (
    <pre
      aria-label={ariaLabel}
      className={cn(
        "doc-mono whitespace-pre-wrap break-words rounded-chip border-l-2 border-paper-300 bg-paper-50/60 py-3 pl-4 pr-3 text-doc-sm leading-relaxed text-ink-700",
        className,
      )}
    >
      {children}
    </pre>
  );
}
