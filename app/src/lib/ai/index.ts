import { createHeuristicAI } from "@/lib/ai/heuristic";
import type {
  ClinicalSnapshot,
  PatientCase,
  PrescriptionReviewItem,
  SourceDocument,
} from "@/types/domain";

export type ClinicalSnapshotInput = Omit<ClinicalSnapshot, "id" | "patient_case_id" | "updated_at">;

export interface ClinicalAI {
  generateClinicalSnapshot(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
  }): Promise<ClinicalSnapshotInput>;
  generateHandoff(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
    snapshot?: ClinicalSnapshot | null;
  }): Promise<string>;
  generateFamilySummary(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
  }): Promise<string>;
  generatePrescriptionChecklist(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
  }): Promise<PrescriptionReviewItem[]>;
  formatLaboratory(input: { sources: SourceDocument[] }): Promise<string>;
  formatImaging(input: { sources: SourceDocument[] }): Promise<string>;
  formatControls24h(input: { sources: SourceDocument[] }): Promise<string>;
  askCase(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
    question: string;
  }): Promise<{ answer: string; cited: string[] }>;
}

let ai: ClinicalAI | null = null;

export function getAI(): ClinicalAI {
  ai ??= createHeuristicAI();
  return ai;
}
