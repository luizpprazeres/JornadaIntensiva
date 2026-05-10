import { createHeuristicAI } from "@/lib/ai/heuristic";
import type {
  ClinicalSnapshot,
  Divergence,
  FreshnessEntry,
  Gap,
  IngestedFragment,
  PatientCase,
  PrescriptionReviewItem,
  SourceDocument,
} from "@/types/domain";

/**
 * Output cru da geração de snapshot — antes de versionamento e persistência.
 * `version`, `id`, `patient_case_id`, `updated_at` são responsabilidade do repo.
 */
export type ClinicalSnapshotInput = Omit<
  ClinicalSnapshot,
  "id" | "patient_case_id" | "updated_at" | "version"
>;

/**
 * Tudo que vem da geração de um artefato textual (handoff, family).
 * `cited` = ids de SourceDocument referenciados na resposta.
 */
export type GeneratedArtifact = {
  body: string;
  cited: string[];
  provider: string;
  model: string | null;
};

export type GeneratedChecklist = {
  items: PrescriptionReviewItem[];
  cited: string[];
  provider: string;
  model: string | null;
};

export type AskCaseResult = {
  answer: string;
  cited: string[];
  provider: string;
  model: string | null;
};

export type DivergenceResult = {
  divergences: Divergence[];
  provider: string;
  model: string | null;
};

/**
 * Resultado de uma ingestão livre de texto: peças fragmentadas + classificadas.
 * O `IngestTab` mostra como preview antes de persistir.
 */
export type IngestResult = {
  fragments: IngestedFragment[];
  /** Resumo de uma frase do que a IA detectou (mostrar no preview). */
  summary: string;
  provider: string;
  model: string | null;
};

/**
 * Resultado de detecção de lacunas + frescor das fontes do leito.
 */
export type GapsResult = {
  gaps: Gap[];
  freshness: FreshnessEntry[];
  provider: string;
  model: string | null;
};

/**
 * Interface estável da camada de IA clínica.
 * Implementações: heurística (Fase 1) ou LLM real (Fase 2).
 *
 * REGRA INVIOLÁVEL: toda função recebe sources já filtradas pelo PatientCase.
 * A impl deve verificar (assertSinglePatientCase) e recusar se houver leito alheio.
 */
export interface ClinicalAI {
  readonly providerName: string;
  readonly modelName: string | null;

  generateClinicalSnapshot(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
  }): Promise<ClinicalSnapshotInput>;

  generateHandoff(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
    snapshot?: ClinicalSnapshot | null;
  }): Promise<GeneratedArtifact>;

  generateFamilySummary(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
  }): Promise<GeneratedArtifact>;

  generatePrescriptionChecklist(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
  }): Promise<GeneratedChecklist>;

  formatLaboratory(input: { sources: SourceDocument[] }): Promise<string>;
  formatImaging(input: { sources: SourceDocument[] }): Promise<string>;
  formatControls24h(input: { sources: SourceDocument[] }): Promise<string>;

  askCase(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
    question: string;
  }): Promise<AskCaseResult>;

  /**
   * Detecta divergências entre as fontes do leito (F2.9).
   * Heurística: pares de linhas com negação contraditória sobre o mesmo termo.
   * LLM: pede para listar conflitos clínicos relevantes.
   */
  detectDivergences(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
  }): Promise<DivergenceResult>;

  /**
   * Ingestão tipo ChatGPT (F2.5).
   * Recebe um texto livre (pode ter várias seções misturadas) e retorna um array
   * de IngestedFragments, cada um classificado por `source_type` com data extraída.
   * O usuário confirma na UI antes de persistir como SourceDocuments.
   */
  ingestRawText(input: {
    patientCase: PatientCase;
    existingSources: SourceDocument[];
    rawText: string;
  }): Promise<IngestResult>;

  /**
   * Detecção de lacunas + frescor das fontes do leito (F2.5).
   * Para uma UTI típica, espera-se ter handoff, prescription, controls_24h,
   * laboratory, e medical_evolution atualizados em janelas razoáveis.
   * Retorna lista de gaps (ausentes/críticos) + freshness (idade de cada categoria).
   */
  detectGaps(input: {
    patientCase: PatientCase;
    sources: SourceDocument[];
    snapshot?: ClinicalSnapshot | null;
  }): Promise<GapsResult>;
}

let ai: ClinicalAI | null = null;

/**
 * Factory: escolhe entre LLM real e heurística baseado em AI_PROVIDER env var.
 * Default: heurística (Fase 1).
 */
export async function getAI(): Promise<ClinicalAI> {
  if (ai) return ai;

  const provider = (process.env.AI_PROVIDER ?? "heuristic").toLowerCase();

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      console.warn(
        "[ai] AI_PROVIDER=openai mas OPENAI_API_KEY ausente — caindo para heurística.",
      );
      const heuristic = createHeuristicAI();
      ai = heuristic;
      return heuristic;
    }
    try {
      const { createLLMAI } = await import("@/lib/ai/llm");
      const llmInstance = await createLLMAI({
        provider: "openai",
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL ?? "gpt-4.1",
      });
      ai = llmInstance;
      return llmInstance;
    } catch (err) {
      console.warn("[ai] falha ao inicializar LLM provider; caindo para heurística:", err);
      const heuristic = createHeuristicAI();
      ai = heuristic;
      return heuristic;
    }
  }

  const heuristic = createHeuristicAI();
  ai = heuristic;
  return heuristic;
}

/**
 * Reseta o singleton — útil em testes ou ao trocar provider em runtime.
 */
export function resetAI(): void {
  ai = null;
}
