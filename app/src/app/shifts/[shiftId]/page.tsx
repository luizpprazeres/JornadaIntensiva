import Link from "next/link";
import { notFound } from "next/navigation";

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
import { getShift, listPatientCases, listSources } from "@/lib/repos";
import { formatDateTimeBR } from "@/lib/utils/format";

import { createPatientCaseAction, endShiftAction } from "./actions";

export default async function ShiftCentralPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const { shiftId } = await params;
  const shift = await getShift(shiftId);
  if (!shift) notFound();

  const patientCases = await listPatientCases(shiftId);
  const counts = await Promise.all(
    patientCases.map(async (pc) => ({ id: pc.id, sourceCount: (await listSources(pc.id)).length })),
  );
  const countsById = new Map(counts.map((c) => [c.id, c.sourceCount]));

  const handleEnd = async () => {
    "use server";
    await endShiftAction(shiftId);
  };

  const handleCreate = async (formData: FormData) => {
    "use server";
    await createPatientCaseAction(shiftId, formData);
  };

  return (
    <>
      <AppHeader
        trail={shift.label ?? "plantão"}
        rightSlot={
          <Link href="/" className="text-doc-sm italic text-sepia-600 hover:underline">
            ← plantões
          </Link>
        }
      />
      <PageContainer>
        <Sheet>
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-doc-h1 font-semibold text-ink-900">
                {shift.label ?? "Plantão sem identificação"}
              </h1>
              <MetaLine className="mt-1">
                início {formatDateTimeBR(shift.started_at)}
                {shift.ended_at ? ` · término ${formatDateTimeBR(shift.ended_at)}` : null}
                {" · "}
                {patientCases.length} {patientCases.length === 1 ? "leito" : "leitos"}
              </MetaLine>
            </div>
            {!shift.ended_at && (
              <form action={handleEnd}>
                <QuietButton type="submit" className="text-doc-xs">
                  Encerrar plantão
                </QuietButton>
              </form>
            )}
          </header>

          <SectionDivider label="adicionar leito" />

          <form
            action={handleCreate}
            className="grid gap-3 md:grid-cols-2"
          >
            <FieldGroup label="Leito" hint="Ex.: 'Leito 7'">
              <TextInput name="bed_label" required maxLength={32} placeholder="Leito 7" />
            </FieldGroup>
            <FieldGroup label="Identificador" hint="Iniciais ou pseudônimo. Não usar nome real.">
              <TextInput
                name="patient_name_or_identifier"
                required
                maxLength={64}
                placeholder="J.M."
              />
            </FieldGroup>
            <FieldGroup label="Idade">
              <TextInput name="age" inputMode="numeric" pattern="\d*" maxLength={3} placeholder="68" />
            </FieldGroup>
            <FieldGroup label="Data de admissão">
              <TextInput type="date" name="admission_date" />
            </FieldGroup>
            <FieldGroup label="Diagnóstico principal" className="md:col-span-2">
              <TextInput
                name="main_diagnosis"
                maxLength={200}
                placeholder="Pneumonia adquirida na comunidade grave (CURB-65 4)"
              />
            </FieldGroup>
            <div className="md:col-span-2 flex justify-end">
              <QuietButton type="submit" variant="primary">
                Adicionar leito
              </QuietButton>
            </div>
          </form>

          <SectionDivider label="leitos do plantão" />

          {patientCases.length === 0 ? (
            <EmptyHint>Nenhum leito ainda. Adicione o primeiro acima.</EmptyHint>
          ) : (
            <ul className="divide-y divide-paper-300 border-y border-paper-300">
              {patientCases.map((pc) => (
                <li key={pc.id}>
                  <Link
                    href={`/shifts/${shiftId}/beds/${pc.id}`}
                    className="block py-3 hover:bg-paper-200/40"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-serif text-doc-lg font-semibold text-ink-900">
                          {pc.bed_label}
                          <span className="ml-2 font-sans text-doc-sm italic text-ink-500">
                            · {pc.patient_name_or_identifier}
                            {pc.age != null ? `, ${pc.age}a` : null}
                          </span>
                        </p>
                        {pc.main_diagnosis && (
                          <p className="mt-0.5 line-clamp-1 text-doc-sm text-ink-700">
                            {pc.main_diagnosis}
                          </p>
                        )}
                        <MetaLine className="mt-1">
                          {pc.admission_date
                            ? `adm. ${formatDateTimeBR(pc.admission_date)}`
                            : "data de admissão não informada"}
                          {" · "}
                          {countsById.get(pc.id) ?? 0}{" "}
                          {(countsById.get(pc.id) ?? 0) === 1 ? "fonte" : "fontes"}
                        </MetaLine>
                      </div>
                      <MarkChip tone={pc.is_active ? "neutral" : "warn"}>
                        {pc.is_active ? "ativo" : "inativo"}
                      </MarkChip>
                    </div>
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
