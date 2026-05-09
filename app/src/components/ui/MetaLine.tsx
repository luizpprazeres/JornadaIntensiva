import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type MetaLineProps = {
  children: ReactNode;
  className?: string;
};

/**
 * MetaLine — linha pequena de meta-informação (data, tipo, autor).
 * Itálico, ink-400, mono opcional via classe.
 */
export function MetaLine({ children, className }: MetaLineProps) {
  return (
    <p className={cn("text-doc-xs italic text-ink-400 leading-tight", className)}>{children}</p>
  );
}
