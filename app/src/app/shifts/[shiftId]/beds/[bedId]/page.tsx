import Link from "next/link";
import { notFound } from "next/navigation";

import { AppFooter } from "@/components/shell/AppFooter";
import { AppHeader } from "@/components/shell/AppHeader";
import { PageContainer } from "@/components/shell/PageContainer";
import { MarkChip, MetaLine, Sheet } from "@/components/ui";
import { AskCaseTab } from "@/components/tabs/AskCaseTab";
import { IngestTab } from "@/components/tabs/IngestTab";
import { SummaryTab } from "@/components/tabs/SummaryTab";
import { TabBar, isTabKey, type TabKey } from "@/components/tabs/TabBar";
import {
  getLatestHandoff,
  getLatestReview,
  getPatientCase,
  getShift,
  getSnapshot,
  listCaseQuestions,
  listSnapshotHistory,
  listSources,
} from "@/lib/repos";
import { formatDateTimeBR } from "@/lib/utils/format";
import type { IngestedFragment } from "@/types/domain";

import {
  askCaseAction,
  confirmIngestAction,
  deleteCaseQuestionAction,
  deleteSourceAction,
  detectGapsAction,
  generateFamilySummaryAction,
  generateHandoffAction,
  generatePrescriptionReviewAction,
  ingestTextAction,
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

  const [sources, snapshot, handoff, review, snapshotHistory, questionHistory, { gaps, freshness }] =
    await Promise.all([
      listSources(bedId),
      getSnapshot(bedId),
      getLatestHandoff(bedId),
      getLatestReview(bedId),
      listSnapshotHistory(bedId),
      listCaseQuestions(bedId, 10),
      detectGapsAction(bedId),
    ]);

  const basePath = `/shifts/${shiftId}/beds/${bedId}`;

  // ── Server Action wrappers ──────────────────────────────────────────────────

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

  const ingest = async (rawText: string) => {
    "use server";
    return ingestTextAction(shiftId, bedId, rawText);
  };

  const confirmIngest = async (fragments: IngestedFragment[]) => {
    "use server";
    return confirmIngestAction(shiftId, bedId, fragments);
  };

  const deleteSource = async (sourceId: string) => {
    "use server";
    await deleteSourceAction(shiftId, bedId, sourceId);
  };

  const ask = async (question: string) => {
    "use server";
    return askCaseAction(bedId, question);
  };

  const deleteQ = async (questionId: string) => {
    "use server";
    await deleteCaseQuestionAction(bedId, questionId);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

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
                history={snapshotHistory}
                divergences={snapshot?.divergences ?? []}
                gaps={gaps}
                freshness={freshness}
                latestHandoff={handoff}
                latestReview={review}
                regenerateAction={regenerate}
                generateHandoffAction={handoffGen}
                generateFamilySummaryAction={familyGen}
                generatePrescriptionReviewAction={reviewGen}
              />
            )}

            {activeTab === "adicionar" && (
              <IngestTab
                existingSources={sources}
                ingestAction={ingest}
                confirmAction={confirmIngest}
                deleteSourceAction={deleteSource}
              />
            )}

            {activeTab === "perguntar" && (
              <AskCaseTab
                askAction={ask}
                deleteAction={deleteQ}
                initialHistory={questionHistory}
              />
            )}
          </div>
        </Sheet>
      </PageContainer>
      <AppFooter />
    </>
  );
}
