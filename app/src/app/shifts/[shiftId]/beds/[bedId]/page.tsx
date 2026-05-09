import Link from "next/link";
import { notFound } from "next/navigation";

import { AppFooter } from "@/components/shell/AppFooter";
import { AppHeader } from "@/components/shell/AppHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import {
  MarkChip,
  MetaLine,
  Sheet,
} from "@/components/ui";
import { AskCaseTab } from "@/components/tabs/AskCaseTab";
import { Controls24hTab } from "@/components/tabs/Controls24hTab";
import { EvolutionTab } from "@/components/tabs/EvolutionTab";
import { FamilyTab } from "@/components/tabs/FamilyTab";
import { HandoffTab } from "@/components/tabs/HandoffTab";
import { ImagingTab } from "@/components/tabs/ImagingTab";
import { LaboratoryTab } from "@/components/tabs/LaboratoryTab";
import { PrescriptionTab } from "@/components/tabs/PrescriptionTab";
import { SourcesTab } from "@/components/tabs/SourcesTab";
import { SummaryTab } from "@/components/tabs/SummaryTab";
import { TabBar, isTabKey, type TabKey } from "@/components/tabs/TabBar";
import {
  getLatestHandoff,
  getLatestReview,
  getPatientCase,
  getShift,
  getSnapshot,
  listSources,
} from "@/lib/repos";
import { formatDateTimeBR } from "@/lib/utils/format";

import {
  addSourceAction,
  askCaseAction,
  deleteSourceAction,
  generateFamilySummaryAction,
  generateHandoffAction,
  generatePrescriptionReviewAction,
  regenerateSnapshotAction,
} from "./actions";

type PageProps = {
  params: Promise<{ shiftId: string; bedId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function BedPage({ params, searchParams }: PageProps) {
  const { shiftId, bedId } = await params;
  const { tab } = await searchParams;
  const activeTab: TabKey = isTabKey(tab) ? tab : "resumo";

  const [shift, patientCase] = await Promise.all([getShift(shiftId), getPatientCase(bedId)]);
  if (!shift || !patientCase || patientCase.shift_id !== shiftId) notFound();

  const [sources, snapshot, handoff, review] = await Promise.all([
    listSources(bedId),
    getSnapshot(bedId),
    getLatestHandoff(bedId),
    getLatestReview(bedId),
  ]);

  const basePath = `/shifts/${shiftId}/beds/${bedId}`;

  // Server Action wrappers (com shift/bed bindados)
  const addSource = async (formData: FormData) => {
    "use server";
    await addSourceAction(shiftId, bedId, formData);
  };
  const deleteSource = async (sourceId: string) => {
    "use server";
    await deleteSourceAction(shiftId, bedId, sourceId);
  };
  const regenerate = async () => {
    "use server";
    await regenerateSnapshotAction(shiftId, bedId);
  };
  const handoffGen = async () => {
    "use server";
    await generateHandoffAction(shiftId, bedId);
  };
  const reviewGen = async () => {
    "use server";
    await generatePrescriptionReviewAction(shiftId, bedId);
  };
  const familyGen = async () => {
    "use server";
    return generateFamilySummaryAction(bedId);
  };
  const ask = async (question: string) => {
    "use server";
    return askCaseAction(bedId, question);
  };

  return (
    <>
      <AppHeader
        trail={`${shift.label ?? "plantão"} · ${patientCase.bed_label}`}
        rightSlot={
          <Link
            href={`/shifts/${shiftId}`}
            className="text-doc-sm italic text-sepia-600 hover:underline"
          >
            ← {shift.label ? "central" : "plantão"}
          </Link>
        }
      />
      <PageContainer>
        <Sheet>
          <header className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-doc-h1 font-semibold text-ink-900">
                {patientCase.bed_label}
                <span className="ml-3 font-sans text-doc-base font-normal italic text-ink-500">
                  · {patientCase.patient_name_or_identifier}
                  {patientCase.age != null ? `, ${patientCase.age}a` : null}
                </span>
              </h1>
              {patientCase.main_diagnosis && (
                <p className="mt-1 text-doc-base text-ink-700">{patientCase.main_diagnosis}</p>
              )}
              <MetaLine className="mt-1">
                {patientCase.admission_date
                  ? `adm. ${formatDateTimeBR(patientCase.admission_date)}`
                  : "data de admissão não informada"}
                {" · "}
                {sources.length} {sources.length === 1 ? "fonte" : "fontes"}
                {snapshot ? ` · ficha atualizada ${formatDateTimeBR(snapshot.updated_at)}` : null}
              </MetaLine>
            </div>
            <MarkChip tone={patientCase.is_active ? "neutral" : "warn"}>
              {patientCase.is_active ? "ativo" : "inativo"}
            </MarkChip>
          </header>

          <TabBar basePath={basePath} active={activeTab} />

          <div className="mt-4">
            {activeTab === "resumo" && (
              <SummaryTab
                patientCase={patientCase}
                snapshot={snapshot}
                regenerateAction={regenerate}
              />
            )}
            {activeTab === "fontes" && (
              <SourcesTab
                sources={sources}
                addSourceAction={addSource}
                deleteSourceAction={deleteSource}
              />
            )}
            {activeTab === "laboratorio" && <LaboratoryTab sources={sources} />}
            {activeTab === "imagem" && <ImagingTab sources={sources} />}
            {activeTab === "controles" && <Controls24hTab sources={sources} />}
            {activeTab === "prescricao" && (
              <PrescriptionTab review={review} generateAction={reviewGen} />
            )}
            {activeTab === "evolucao" && <EvolutionTab sources={sources} />}
            {activeTab === "familia" && <FamilyTab generateAction={familyGen} />}
            {activeTab === "passagem" && (
              <HandoffTab initial={handoff} generateAction={handoffGen} />
            )}
            {activeTab === "perguntar" && <AskCaseTab askAction={ask} />}
          </div>
        </Sheet>
      </PageContainer>
      <AppFooter />
    </>
  );
}
