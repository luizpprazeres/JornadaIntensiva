import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type AppHeaderProps = {
  trail?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
};

export function AppHeader({ trail, rightSlot, className }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-paper-300 bg-paper-50/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mx-auto flex max-w-[760px] items-center justify-between gap-3 px-5 py-3 md:px-9 md:py-4">
        <div className="flex min-w-0 items-baseline gap-3">
          <Link
            href="/"
            className="font-serif text-doc-lg font-semibold text-ink-900 hover:text-sepia-600"
          >
            Jornada Intensiva
          </Link>
          {trail && (
            <span className="truncate font-sans text-doc-xs italic text-ink-400">{trail}</span>
          )}
        </div>
        {rightSlot && <div className="shrink-0 text-doc-sm">{rightSlot}</div>}
      </div>
    </header>
  );
}
