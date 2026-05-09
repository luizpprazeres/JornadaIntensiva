import Link from "next/link";

import { AppFooter } from "@/components/shell/AppFooter";
import { AppHeader } from "@/components/shell/AppHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import {
  EmptyHint,
  FieldGroup,
  MarkChip,
  MetaLine,
  QuietButton,
  SectionDivider,
  Sheet,
  TextInput,
} from "@/components/ui";
import { listShifts } from "@/lib/repos";
import { formatDateTimeBR } from "@/lib/utils/format";

import { createShiftAction } from "./actions";

export default async function ShiftsIndexPage() {
  const shifts = await listShifts();

  return (
    <>
      <AppHeader trail="lista de plantões" />
      <PageContainer>
        <Sheet>
          <h1 className="font-serif text-doc-h1 font-semibold text-ink-900">Plantões</h1>
          <MetaLine className="mt-1">
            Cada plantão agrupa os leitos cobertos em um turno. Crie um novo abaixo ou continue um
            existente.
          </MetaLine>

          <SectionDivider label="novo plantão" />

          <form action={createShiftAction} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <FieldGroup
              label="Identificação do plantão"
              hint="Opcional — ex.: 'Plantão diurno 09/05'"
            >
              <TextInput
                name="label"
                placeholder="Plantão diurno 09/05"
                autoComplete="off"
                maxLength={120}
              />
            </FieldGroup>
            <QuietButton type="submit" variant="primary" className="md:self-end">
              Iniciar plantão
            </QuietButton>
          </form>

          <SectionDivider label="plantões registrados" />

          {shifts.length === 0 ? (
            <EmptyHint>Nenhum plantão registrado ainda. Inicie o primeiro acima.</EmptyHint>
          ) : (
            <ul className="divide-y divide-paper-300 border-y border-paper-300">
              {shifts.map((shift) => (
                <li key={shift.id}>
                  <Link
                    href={`/shifts/${shift.id}`}
                    className="flex items-baseline justify-between gap-3 py-3 hover:bg-paper-200/40"
                  >
                    <div className="min-w-0">
                      <p className="font-serif text-doc-lg font-semibold text-ink-900">
                        {shift.label ?? "Plantão sem identificação"}
                      </p>
                      <MetaLine className="mt-0.5">
                        início {formatDateTimeBR(shift.started_at)}
                        {shift.ended_at ? ` · término ${formatDateTimeBR(shift.ended_at)}` : null}
                      </MetaLine>
                    </div>
                    <MarkChip tone={shift.ended_at ? "neutral" : "ok"}>
                      {shift.ended_at ? "encerrado" : "em curso"}
                    </MarkChip>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Sheet>
      </PageContainer>
      <AppFooter />
    </>
  );
}
