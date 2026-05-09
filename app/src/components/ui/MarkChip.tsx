import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type Tone = "neutral" | "alert" | "warn" | "ok";

type MarkChipProps = {
  children: ReactNode;
  tone?: Tone;
  className?: string;
};

/**
 * MarkChip — etiqueta retangular pequena, tipo carimbo de prontuário.
 * Default neutro (sem cor). Tons clínicos só para informação semântica.
 */
export function MarkChip({ children, tone = "neutral", className }: MarkChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-chip border px-1.5 py-0.5 font-sans text-doc-xs uppercase tracking-[0.08em]",
        tone === "neutral" && "border-paper-300 bg-paper-50 text-ink-500",
        tone === "alert" && "border-clinical-alert/30 bg-clinical-alert/5 text-clinical-alert",
        tone === "warn" && "border-clinical-warn/30 bg-clinical-warn/5 text-clinical-warn",
        tone === "ok" && "border-clinical-ok/30 bg-clinical-ok/5 text-clinical-ok",
        className,
      )}
    >
      {children}
    </span>
  );
}
