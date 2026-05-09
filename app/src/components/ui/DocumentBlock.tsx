import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type DocumentBlockProps = {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * DocumentBlock — bloco de conteúdo dentro de uma Sheet.
 * Título serif + meta sans + ação discreta. Substitui CardHeader/CardBody do mundo SaaS.
 */
export function DocumentBlock({ title, meta, actions, children, className }: DocumentBlockProps) {
  const hasHeader = title || meta || actions;
  return (
    <article className={cn("py-3", className)}>
      {hasHeader && (
        <header className="mb-3 flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="font-serif text-doc-h2 font-semibold leading-tight text-ink-900">
                {title}
              </h3>
            )}
            {meta && <div className="mt-1 text-doc-xs italic text-ink-400">{meta}</div>}
          </div>
          {actions && <div className="shrink-0 text-doc-sm">{actions}</div>}
        </header>
      )}
      <div className="text-doc-base leading-relaxed text-ink-700">{children}</div>
    </article>
  );
}
