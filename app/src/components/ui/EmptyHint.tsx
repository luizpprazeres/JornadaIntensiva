import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type EmptyHintProps = {
  children: ReactNode;
  className?: string;
};

export function EmptyHint({ children, className }: EmptyHintProps) {
  return (
    <p className={cn("py-6 text-center text-doc-sm italic text-ink-400", className)}>{children}</p>
  );
}
