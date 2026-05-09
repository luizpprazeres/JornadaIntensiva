import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export const TAB_KEYS = [
  "resumo",
  "fontes",
  "laboratorio",
  "imagem",
  "controles",
  "prescricao",
  "evolucao",
  "familia",
  "passagem",
  "perguntar",
] as const;

export type TabKey = (typeof TAB_KEYS)[number];

const LABELS: Record<TabKey, string> = {
  resumo: "Resumo",
  fontes: "Fontes",
  laboratorio: "Laboratório",
  imagem: "Imagem",
  controles: "Controles",
  prescricao: "Prescrição",
  evolucao: "Evolução",
  familia: "Família",
  passagem: "Passagem",
  perguntar: "Perguntar ao caso",
};

type TabBarProps = {
  basePath: string;
  active: TabKey;
};

export function TabBar({ basePath, active }: TabBarProps) {
  return (
    <nav
      aria-label="Abas do leito"
      className="-mx-5 mt-1 overflow-x-auto border-b border-paper-300 px-5 md:-mx-9 md:px-9"
    >
      <ul className="flex min-w-max items-end gap-1">
        {TAB_KEYS.map((key) => {
          const isActive = key === active;
          return (
            <li key={key}>
              <Link
                href={`${basePath}?tab=${key}`}
                className={cn(
                  "inline-block whitespace-nowrap border-b-2 px-3 py-2 font-sans text-doc-sm transition-colors duration-100",
                  isActive
                    ? "border-sepia-600 text-ink-900"
                    : "border-transparent text-ink-500 hover:text-ink-800",
                )}
              >
                {LABELS[key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function isTabKey(value: string | undefined | null): value is TabKey {
  return Boolean(value && (TAB_KEYS as readonly string[]).includes(value));
}
