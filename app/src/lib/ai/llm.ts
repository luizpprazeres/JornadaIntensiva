import OpenAI from "openai";
import { z } from "zod";

import type {
  AskCaseResult,
  ClinicalAI,
  ClinicalSnapshotInput,
  DivergenceResult,
  GeneratedArtifact,
  GeneratedChecklist,
  GapsResult,
  IngestResult,
} from "@/lib/ai";
import { createHeuristicAI, pt } from "@/lib/ai/heuristic";
import { loadPrompt, type PromptName } from "@/lib/prompts/loader";
import { SOURCE_TYPES, type Divergence, type FreshnessEntry, type PatientCase, type SourceDocument } from "@/types/domain";

export type LLMConfig = {
  provider: "openai";
  apiKey: string;
  model: string;
};

type ResponseFormat = { type: "text" } | { type: "json_object" };

const missing = "não informado nas fontes";
const provider = "openai";

const snapshotResponseSchema = z.object({
  main_diagnosis: z.string().default(missing),
  active_problems: z.string().default(missing),
  respiratory_status: z.string().default(missing),
  hemodynamic_status: z.string().default(missing),
  renal_status: z.string().default(missing),
  infectious_status: z.string().default(missing),
  nutrition_status: z.string().default(missing),
  antibiotics: z.string().default(missing),
  vasoactive_drugs: z.string().default(missing),
  sedation_analgesia: z.string().default(missing),
  devices: z.string().default(missing),
  latest_labs: z.string().default(missing),
  latest_controls: z.string().default(missing),
  pending_items: z.string().default(missing),
  plan: z.string().default(missing),
  cited_source_ids: z.array(z.string()).default([]),
});

const checklistResponseSchema = z.object({
  items: z.array(
    z.object({
      category: z.string(),
      known_status: z.string(),
      gap: z.string(),
      cited: z.array(z.string()).optional(),
    }),
  ),
  cited_source_ids: z.array(z.string()).default([]),
});

const askCaseResponseSchema = z.object({
  answer: z.string(),
  cited: z.array(z.string()).default([]),
});

const divergenceResponseSchema = z.object({
  divergences: z.array(
    z.object({
      topic: z.string(),
      description: z.string(),
      source_ids: z.array(z.string()),
    }),
  ),
});

const ingestResponseSchema = z.object({
  summary: z.string(),
  fragments: z.array(
    z.object({
      source_type: z.enum(SOURCE_TYPES),
      raw_text: z.string(),
      source_datetime: z.string().nullable(),
      title: z.string().nullable(),
      confidence: z.number().min(0).max(1),
      rationale: z.string().nullable(),
    }),
  ),
});

const gapsResponseSchema = z.object({
  gaps: z.array(
    z.object({
      category: z.string(),
      label: z.string(),
      severity: z.enum(["critical", "warning", "info"]),
      why: z.string(),
      suggested_action: z.string().nullable(),
    }),
  ),
  freshness: z.array(
    z.object({
      category: z.enum(SOURCE_TYPES),
      label: z.string(),
      last_update_at: z.string().nullable(),
      age_minutes: z.number().nullable(),
      status: z.enum(["fresh", "aging", "stale", "missing"]),
    }),
  ),
});

const gapCategoryValues = [...SOURCE_TYPES, "summary", "plan", "other"] as const;

const prescriptionCategories = [
  "ATB",
  "profilaxia TEV",
  "profilaxia LAMG",
  "dieta/nutrição",
  "hidratação",
  "eletrólitos",
  "insulina/HGT",
  "sedação/analgesia",
  "drogas vasoativas",
  "ventilação mecânica",
  "dispositivos invasivos",
  "exames pendentes",
  "condutas pendentes",
] as const;

function assertSinglePatientCase(patientCase: PatientCase, sources: SourceDocument[]): void {
  const foreign = sources.find((source) => source.patient_case_id !== patientCase.id);

  if (foreign) {
    throw new Error("Fontes de outro leito foram recusadas pela camada de IA.");
  }
}

function assertSingleSourceSet(sources: SourceDocument[]): void {
  const firstPatientCaseId = sources[0]?.patient_case_id;

  if (!firstPatientCaseId) {
    return;
  }

  const foreign = sources.find((source) => source.patient_case_id !== firstPatientCaseId);

  if (foreign) {
    throw new Error("Fontes de mais de um leito foram recusadas pela camada de IA.");
  }
}

function formatPatientCase(patientCase: PatientCase): string {
  return [
    `id: ${patientCase.id}`,
    `leito: ${patientCase.bed_label}`,
    `identificador: ${patientCase.patient_name_or_identifier}`,
    `idade: ${patientCase.age ?? "não informado"}`,
    `admissão: ${pt(patientCase.admission_date)}`,
    `diagnóstico principal cadastrado: ${patientCase.main_diagnosis ?? "não informado"}`,
    `status atual cadastrado: ${patientCase.current_status ?? "não informado"}`,
  ].join("\n");
}

function formatSource(source: SourceDocument): string {
  const title = source.title ? `\ntitle: ${source.title}` : "";
  const summary = source.structured_summary
    ? `\nstructured_summary:\n${source.structured_summary}`
    : "";

  return `— [${source.source_type} | ${pt(source.source_datetime)} | ${source.id}] —${title}${summary}\n\n${source.raw_text}`;
}

function formatSources(sources: SourceDocument[]): string {
  if (sources.length === 0) {
    return "Nenhuma fonte inserida neste leito.";
  }

  return sources.map(formatSource).join("\n\n");
}

function buildUserMessage(input: {
  patientCase?: PatientCase;
  sources: SourceDocument[];
  instruction: string;
  question?: string;
  snapshot?: unknown;
}): string {
  const patientCaseBlock = input.patientCase
    ? formatPatientCase(input.patientCase)
    : "Identificação do leito: não disponível neste verbo; fontes recebidas já devem estar filtradas por patient_case_id.";
  const questionBlock = input.question ? `\n\nPERGUNTA\n${input.question}` : "";
  const snapshotBlock = input.snapshot
    ? `\n\nSNAPSHOT DISPONÍVEL\n${JSON.stringify(input.snapshot, null, 2)}`
    : "";

  return [
    input.instruction,
    "Responda exclusivamente com base nas fontes abaixo. Não invente dados. Se faltar informação, declare explicitamente.",
    "\nIDENTIFICAÇÃO DO LEITO",
    patientCaseBlock,
    snapshotBlock,
    questionBlock,
    "\nFONTES DO LEITO",
    formatSources(input.sources),
  ].join("\n");
}

function extractContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  return "";
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const jsonText = fenced?.[1] ?? trimmed;

  try {
    return JSON.parse(jsonText) as unknown;
  } catch {
    throw new Error("A resposta do OpenAI não veio em JSON válido.");
  }
}

function cleanText(text: string): string {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("A resposta do OpenAI veio vazia.");
  }

  return trimmed;
}

function normalizeSnapshotField(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : missing;
}

function collectCitations(body: string, sources: SourceDocument[]): string[] {
  return sources
    .filter((source) => body.includes(source.id))
    .map((source) => source.id);
}

function normalizeCitations(cited: string[], sources: SourceDocument[]): string[] {
  const valid = new Set(sources.map((source) => source.id));
  return Array.from(new Set(cited.filter((id) => valid.has(id))));
}

function parseNullableDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatExistingSourcesSummary(sources: SourceDocument[]): string {
  if (sources.length === 0) {
    return "Nenhuma fonte existente.";
  }

  return sources
    .map((source) => {
      const excerpt = source.raw_text.replace(/\s+/g, " ").slice(0, 100);
      return `- ${source.source_type} | ${pt(source.source_datetime)} | ${source.id} | ${excerpt}`;
    })
    .join("\n");
}

function buildIngestUserMessage(input: {
  patientCase: PatientCase;
  existingSources: SourceDocument[];
  rawText: string;
}): string {
  return [
    "Identifique e fragmente o texto bruto em SourceDocuments candidatos para este leito.",
    "Responda em JSON conforme schema.",
    "\nIDENTIFICAÇÃO DO LEITO",
    formatPatientCase(input.patientCase),
    "\nFONTES EXISTENTES RESUMIDAS",
    formatExistingSourcesSummary(input.existingSources),
    "\nTEXTO BRUTO PARA INGESTÃO:",
    input.rawText,
  ].join("\n");
}

function buildGapsUserMessage(input: {
  patientCase: PatientCase;
  sources: SourceDocument[];
  snapshot?: unknown;
  currentTime: Date;
}): string {
  const sourceRows =
    input.sources.length === 0
      ? "Nenhuma fonte inserida neste leito."
      : input.sources
          .map(
            (source) =>
              `- ${source.source_type} | ${source.source_datetime?.toISOString() ?? source.created_at.toISOString()} | ${source.id}`,
          )
          .join("\n");

  return [
    "Detecte lacunas e frescor das fontes deste leito.",
    "Responda em JSON conforme schema.",
    "\nIDENTIFICAÇÃO DO LEITO",
    formatPatientCase(input.patientCase),
    `\nHora atual: ${input.currentTime.toISOString()}`,
    input.snapshot ? `\nSNAPSHOT\n${JSON.stringify(input.snapshot, null, 2)}` : "\nSNAPSHOT\nNão disponível.",
    "\nFONTES",
    sourceRows,
  ].join("\n");
}

function normalizeGapCategory(category: string): (typeof gapCategoryValues)[number] {
  const match = gapCategoryValues.find((value) => value === category);
  return match ?? "other";
}

function openAIErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `Falha ao chamar OpenAI: ${error.message}`;
  }

  return "Falha ao chamar OpenAI: erro desconhecido.";
}

export async function createLLMAI(config: LLMConfig): Promise<ClinicalAI> {
  if (config.provider !== "openai") {
    throw new Error("Provider LLM não suportado. Use provider='openai'.");
  }

  const client = new OpenAI({ apiKey: config.apiKey });
  const heuristic = createHeuristicAI();

  async function complete(input: {
    promptName?: PromptName;
    systemOverride?: string;
    user: string;
    responseFormat: ResponseFormat;
  }): Promise<string> {
    const system = input.systemOverride ?? (await loadPrompt(input.promptName ?? "case-question-answering"));

    try {
      const completion = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: input.user },
        ],
        response_format: input.responseFormat,
      });

      const content = extractContent(completion.choices[0]?.message.content);
      return cleanText(content);
    } catch (error: unknown) {
      throw new Error(openAIErrorMessage(error));
    }
  }

  return {
    providerName: provider,
    modelName: config.model,

    async generateClinicalSnapshot({ patientCase, sources }): Promise<ClinicalSnapshotInput> {
      assertSinglePatientCase(patientCase, sources);

      const response = await complete({
        promptName: "evolution-update",
        responseFormat: { type: "json_object" },
        user: buildUserMessage({
          patientCase,
          sources,
          instruction: [
            "Gere um JSON de ficha viva consolidada.",
            "Formato obrigatório:",
            JSON.stringify(
              {
                main_diagnosis: "string",
                active_problems: "string",
                respiratory_status: "string",
                hemodynamic_status: "string",
                renal_status: "string",
                infectious_status: "string",
                nutrition_status: "string",
                antibiotics: "string",
                vasoactive_drugs: "string",
                sedation_analgesia: "string",
                devices: "string",
                latest_labs: "string",
                latest_controls: "string",
                pending_items: "string",
                plan: "string",
                cited_source_ids: ["source_id"],
              },
              null,
              2,
            ),
            `Campos vazios devem ser "${missing}".`,
          ].join("\n"),
        }),
      });

      const parsed = snapshotResponseSchema.parse(parseJsonObject(response));

      return {
        main_diagnosis: normalizeSnapshotField(parsed.main_diagnosis),
        active_problems: normalizeSnapshotField(parsed.active_problems),
        respiratory_status: normalizeSnapshotField(parsed.respiratory_status),
        hemodynamic_status: normalizeSnapshotField(parsed.hemodynamic_status),
        renal_status: normalizeSnapshotField(parsed.renal_status),
        infectious_status: normalizeSnapshotField(parsed.infectious_status),
        nutrition_status: normalizeSnapshotField(parsed.nutrition_status),
        antibiotics: normalizeSnapshotField(parsed.antibiotics),
        vasoactive_drugs: normalizeSnapshotField(parsed.vasoactive_drugs),
        sedation_analgesia: normalizeSnapshotField(parsed.sedation_analgesia),
        devices: normalizeSnapshotField(parsed.devices),
        latest_labs: normalizeSnapshotField(parsed.latest_labs),
        latest_controls: normalizeSnapshotField(parsed.latest_controls),
        pending_items: normalizeSnapshotField(parsed.pending_items),
        plan: normalizeSnapshotField(parsed.plan),
        cited_source_ids: normalizeCitations(parsed.cited_source_ids, sources),
        divergences: [],
        provider,
        model: config.model,
      };
    },

    async generateHandoff({ patientCase, sources, snapshot }): Promise<GeneratedArtifact> {
      assertSinglePatientCase(patientCase, sources);

      const body = await complete({
        promptName: "handoff-summary",
        responseFormat: { type: "text" },
        user: buildUserMessage({
          patientCase,
          sources,
          snapshot,
          instruction:
            "Gere a passagem de plantão no padrão do prompt. Inclua os ids das fontes usadas no texto quando citar dados específicos.",
        }),
      });

      return {
        body,
        cited: collectCitations(body, sources),
        provider,
        model: config.model,
      };
    },

    async generateFamilySummary({ patientCase, sources }): Promise<GeneratedArtifact> {
      assertSinglePatientCase(patientCase, sources);

      const body = await complete({
        promptName: "family-summary",
        responseFormat: { type: "text" },
        user: buildUserMessage({
          patientCase,
          sources,
          instruction:
            "Gere o resumo para família conforme o prompt. Inclua os ids das fontes usadas no texto quando citar dados específicos.",
        }),
      });

      return {
        body,
        cited: collectCitations(body, sources),
        provider,
        model: config.model,
      };
    },

    async generatePrescriptionChecklist({ patientCase, sources }): Promise<GeneratedChecklist> {
      assertSinglePatientCase(patientCase, sources);

      const response = await complete({
        promptName: "prescription-review",
        responseFormat: { type: "json_object" },
        user: buildUserMessage({
          patientCase,
          sources,
          instruction: [
            "Gere JSON de checklist de revisão de prescrição.",
            `Categorias obrigatórias, nesta ordem: ${prescriptionCategories.join(", ")}.`,
            "Formato obrigatório: { \"items\": [{ \"category\": string, \"known_status\": string, \"gap\": string, \"cited\": string[] }], \"cited_source_ids\": string[] }.",
            "Não sugira doses, medicamentos ou condutas novas.",
          ].join("\n"),
        }),
      });

      const parsed = checklistResponseSchema.parse(parseJsonObject(response));

      return {
        items: parsed.items.map((item) => ({
          ...item,
          cited: item.cited ? normalizeCitations(item.cited, sources) : undefined,
        })),
        cited: normalizeCitations(parsed.cited_source_ids, sources),
        provider,
        model: config.model,
      };
    },

    async formatLaboratory({ sources }): Promise<string> {
      assertSingleSourceSet(sources);
      return heuristic.formatLaboratory({ sources });
    },

    async formatImaging({ sources }): Promise<string> {
      assertSingleSourceSet(sources);
      const imagingSources = sources.filter((source) => source.source_type === "imaging");

      if (imagingSources.length === 0) {
        return "Não encontrado nas fontes deste leito.";
      }

      return complete({
        promptName: "imaging-format",
        responseFormat: { type: "text" },
        user: buildUserMessage({
          sources: imagingSources,
          instruction:
            "Formate os exames de imagem conforme o prompt: uma linha por exame, extraindo apenas a impressão principal.",
        }),
      });
    },

    async formatControls24h({ sources }): Promise<string> {
      assertSingleSourceSet(sources);
      return heuristic.formatControls24h({ sources });
    },

    async askCase({ patientCase, sources, question }): Promise<AskCaseResult> {
      assertSinglePatientCase(patientCase, sources);

      const response = await complete({
        promptName: "case-question-answering",
        responseFormat: { type: "json_object" },
        user: buildUserMessage({
          patientCase,
          sources,
          question,
          instruction:
            "Responda em JSON obrigatório: { \"answer\": string, \"cited\": string[] }. Se não houver informação, answer deve ser exatamente \"Não encontrado nas fontes deste leito.\" e cited deve ser [].",
        }),
      });

      const parsed = askCaseResponseSchema.parse(parseJsonObject(response));

      return {
        answer: parsed.answer,
        cited: normalizeCitations(parsed.cited, sources),
        provider,
        model: config.model,
      };
    },

    async detectDivergences({ patientCase, sources }): Promise<DivergenceResult> {
      assertSinglePatientCase(patientCase, sources);

      const response = await complete({
        systemOverride: [
          "Você identifica divergências clínicas relevantes entre fontes de um único leito.",
          "Não invente divergências. Cite apenas conflitos sustentados por source_ids.",
          "Retorne apenas JSON válido.",
        ].join("\n"),
        responseFormat: { type: "json_object" },
        user: buildUserMessage({
          patientCase,
          sources,
          instruction:
            "Identifique divergências clínicas relevantes entre as fontes deste leito (ex.: prescrição diz droga suspensa mas evolução diz em uso). Para cada divergência, cite source_ids envolvidos. Se não houver divergência clinicamente relevante, retorne array vazio. Formato: { \"divergences\": [{ \"topic\": string, \"description\": string, \"source_ids\": string[] }] }.",
        }),
      });

      const parsed = divergenceResponseSchema.parse(parseJsonObject(response));
      const divergences: Divergence[] = parsed.divergences.map((divergence) => ({
        topic: divergence.topic,
        description: divergence.description,
        source_ids: normalizeCitations(divergence.source_ids, sources),
      }));

      return {
        divergences,
        provider,
        model: config.model,
      };
    },

    async ingestRawText({ patientCase, existingSources, rawText }): Promise<IngestResult> {
      assertSinglePatientCase(patientCase, existingSources);

      const response = await complete({
        promptName: "ingest",
        responseFormat: { type: "json_object" },
        user: buildIngestUserMessage({ patientCase, existingSources, rawText }),
      });

      const parsed = ingestResponseSchema.parse(parseJsonObject(response));

      return {
        summary: parsed.summary,
        fragments: parsed.fragments.map((fragment) => ({
          source_type: fragment.source_type,
          raw_text: fragment.raw_text,
          source_datetime: parseNullableDate(fragment.source_datetime),
          title: fragment.title,
          confidence: fragment.confidence,
          rationale: fragment.rationale,
        })),
        provider,
        model: config.model,
      };
    },

    async detectGaps({ patientCase, sources, snapshot }): Promise<GapsResult> {
      assertSinglePatientCase(patientCase, sources);
      const currentTime = new Date();

      const response = await complete({
        promptName: "gap-detection",
        responseFormat: { type: "json_object" },
        user: buildGapsUserMessage({ patientCase, sources, snapshot, currentTime }),
      });

      const parsed = gapsResponseSchema.parse(parseJsonObject(response));
      const freshness: FreshnessEntry[] = parsed.freshness.map((entry) => ({
        category: entry.category,
        label: entry.label,
        last_update_at: parseNullableDate(entry.last_update_at),
        age_minutes: entry.age_minutes,
        status: entry.status,
      }));

      return {
        gaps: parsed.gaps.map((gap) => ({
          category: normalizeGapCategory(gap.category),
          label: gap.label,
          severity: gap.severity,
          why: gap.why,
          suggested_action: gap.suggested_action,
        })),
        freshness,
        provider,
        model: config.model,
      };
    },
  };
}
