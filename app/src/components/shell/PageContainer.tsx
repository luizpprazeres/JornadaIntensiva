import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn("mx-auto w-full max-w-[760px] flex-1 px-5 py-6 md:px-9 md:py-10", className)}>
      {children}
    </main>
  );
}
