import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDateBR(value: Date | string | null | undefined, fmt = "dd/MM/yyyy"): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, fmt, { locale: ptBR });
}

export function formatDateTimeBR(value: Date | string | null | undefined): string {
  return formatDateBR(value, "dd/MM/yy HH:mm");
}

export function formatRelativeShort(value: Date | string | null | undefined): string {
  return formatDateBR(value, "dd/MM 'às' HH:mm");
}
