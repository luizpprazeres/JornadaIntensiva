import { cn } from "@/lib/utils/cn";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type SheetVariant = "paper" | "plain";

type SheetProps<T extends ElementType = "section"> = {
  as?: T;
  variant?: SheetVariant;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "variant" | "children">;

/**
 * Sheet — folha de papel. Substitui qualquer "Card" do design system tradicional.
 * Borda fina, cantos quase retos, sombra mínima. Retrô-sóbrio.
 */
export function Sheet<T extends ElementType = "section">({
  as,
  variant = "paper",
  className,
  children,
  ...rest
}: SheetProps<T>) {
  const Tag = (as ?? "section") as ElementType;
  return (
    <Tag
      className={cn(
        "relative rounded-sheet",
        variant === "paper" && "bg-paper-100 shadow-sheet",
        variant === "plain" && "bg-transparent",
        "px-5 py-5 md:px-9 md:py-8",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
