"use server";

import { revalidatePath } from "next/cache";

import { getAI } from "@/lib/ai";
import {
  createHandoff,
  createPending,
  createReview,
  createSource,
  deleteSource,
  getPatientCase,
  listSources,
  togglePending,
  updateSource,
  upsertSnapshot,
  type SourceType,
} from "@/lib/repos";

const SOURCE_TYPE_VALUES = [
  "handoff",
  "medical_evolution",
  "diarist_evolution",
  "prescription",
  "laboratory",
  "imaging",
  "controls_24h",
  "physician_note",
  "family_conversation",
  "other",
] as const satisfies readonly SourceType[];

function bedPath(shiftId: string, bedId: string) {
  return `/shifts/${shiftId}/beds/${bedId}`;
}

async function loadCaseAndSources(patientCaseId: string) {
  const patientCase = await getPatientCase(patientCaseId);
  if (!patientCase) throw new Error("Leito não encontrado");
  const sources = await listSources(patientCaseId);
  return { patientCase, sources };
}

export async function addSourceAction(
  shiftId: string,
  patientCaseId: string,
  formData: FormData,
): Promise<void> {
  const sourceTypeRaw = String(formData.get("source_type") ?? "");
  const sourceType = SOURCE_TYPE_VALUES.find((v) => v === sourceTypeRaw);
  if (!sourceType) throw new Error("Tipo de fonte inválido");

  const rawText = String(formData.get("raw_text") ?? "").trim();
  if (!rawText) throw new Error("raw_text é obrigatório");

  const titleRaw = String(formData.get("title") ?? "").trim();
  const dateRaw = String(formData.get("source_datetime") ?? "").trim();
  const sourceDatetime = dateRaw ? new Date(dateRaw) : null;

  await createSource({
    patient_case_id: patientCaseId,
    source_type: sourceType,
    title: titleRaw || undefined,
    raw_text: rawText,
    source_datetime: sourceDatetime && !Number.isNaN(sourceDatetime.getTime()) ? sourceDatetime : null,
  });

  revalidatePath(bedPath(shiftId, patientCaseId));
}

export async function updateSourceSummaryAction(
  shiftId: string,
  patientCaseId: string,
  sourceId: string,
  summary: string,
): Promise<void> {
  await updateSource(patientCaseId, sourceId, { structured_summary: summary || null });
  revalidatePath(bedPath(shiftId, patientCaseId));
}

export async function deleteSourceAction(
  shiftId: string,
  patientCaseId: string,
  sourceId: string,
): Promise<void> {
  await deleteSource(patientCaseId, sourceId);
  revalidatePath(bedPath(shiftId, patientCaseId));
}

export async function regenerateSnapshotAction(
  shiftId: string,
  patientCaseId: string,
): Promise<void> {
  const { patientCase, sources } = await loadCaseAndSources(patientCaseId);
  const ai = getAI();
  const snapshotInput = await ai.generateClinicalSnapshot({ patientCase, sources });
  await upsertSnapshot(patientCaseId, snapshotInput);
  revalidatePath(bedPath(shiftId, patientCaseId));
}

export async function generateHandoffAction(
  shiftId: string,
  patientCaseId: string,
): Promise<void> {
  const { patientCase, sources } = await loadCaseAndSources(patientCaseId);
  const ai = getAI();
  const body = await ai.generateHandoff({ patientCase, sources });
  await createHandoff(patientCaseId, body);
  revalidatePath(bedPath(shiftId, patientCaseId));
}

export async function generateFamilySummaryAction(patientCaseId: string): Promise<string> {
  const { patientCase, sources } = await loadCaseAndSources(patientCaseId);
  const ai = getAI();
  return ai.generateFamilySummary({ patientCase, sources });
}

export async function generatePrescriptionReviewAction(
  shiftId: string,
  patientCaseId: string,
): Promise<void> {
  const { patientCase, sources } = await loadCaseAndSources(patientCaseId);
  const ai = getAI();
  const items = await ai.generatePrescriptionChecklist({ patientCase, sources });
  await createReview(patientCaseId, items);
  revalidatePath(bedPath(shiftId, patientCaseId));
}

export async function askCaseAction(
  patientCaseId: string,
  question: string,
): Promise<{ answer: string; cited: string[] }> {
  const { patientCase, sources } = await loadCaseAndSources(patientCaseId);
  const ai = getAI();
  return ai.askCase({ patientCase, sources, question });
}

export async function addPendingAction(
  shiftId: string,
  patientCaseId: string,
  description: string,
): Promise<void> {
  if (!description.trim()) return;
  await createPending(patientCaseId, description.trim());
  revalidatePath(bedPath(shiftId, patientCaseId));
}

export async function togglePendingAction(
  shiftId: string,
  patientCaseId: string,
  pendingId: string,
): Promise<void> {
  await togglePending(patientCaseId, pendingId);
  revalidatePath(bedPath(shiftId, patientCaseId));
}
