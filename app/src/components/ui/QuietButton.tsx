import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "quiet" | "primary";

type QuietButtonProps = {
  variant?: Variant;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * QuietButton — botão de baixa atenção visual. Default `quiet` para tudo.
 * Variant `primary` (sépia) reservada para ações inegavelmente principais.
 */
export function QuietButton({
  variant = "quiet",
  className,
  children,
  type = "button",
  ...rest
}: QuietButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-chip px-3 py-1.5 font-sans text-doc-sm transition-colors duration-100",
        "min-h-[40px] md:min-h-[36px]",
        "border focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        variant === "quiet" &&
          "border-paper-300 bg-paper-50 text-ink-700 hover:bg-paper-200",
        variant === "primary" &&
          "border-sepia-600 bg-sepia-600 text-paper-50 hover:bg-sepia-500",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
