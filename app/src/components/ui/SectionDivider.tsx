import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type SectionDividerProps = {
  label?: ReactNode;
  className?: string;
};

/**
 * SectionDivider — linha fina com rótulo central opcional, tipo capítulo de prontuário.
 */
export function SectionDivider({ label, className }: SectionDividerProps) {
  if (!label) {
    return <hr className={cn("doc-rule my-6", className)} />;
  }
  return (
    <div className={cn("my-6 flex items-center gap-3 text-ink-400", className)}>
      <span className="h-px flex-1 bg-paper-300" />
      <span className="doc-smallcaps font-sans text-doc-xs">{label}</span>
      <span className="h-px flex-1 bg-paper-300" />
    </div>
  );
}
