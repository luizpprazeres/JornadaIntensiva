export const SOURCE_TYPES = [
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
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  handoff: "Passagem de plantão",
  medical_evolution: "Evolução médica",
  diarist_evolution: "Evolução do diarista",
  prescription: "Prescrição",
  laboratory: "Laboratório",
  imaging: "Imagem",
  controls_24h: "Controles 24h",
  physician_note: "Observação do plantonista",
  family_conversation: "Conversa com família",
  other: "Outros",
};

export type Shift = {
  id: string;
  label?: string;
  started_at: Date;
  ended_at: Date | null;
  notes?: string;
  created_at: Date;
  updated_at: Date;
};

export type PatientCase = {
  id: string;
  shift_id: string;
  bed_label: string;
  patient_name_or_identifier: string;
  age: number | null;
  admission_date: Date | null;
  main_diagnosis: string | null;
  current_status: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

export type SourceDocument = {
  id: string;
  patient_case_id: string;
  source_type: SourceType;
  title?: string;
  raw_text: string;
  structured_summary: string | null;
  source_datetime: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type Divergence = {
  topic: string;
  description: string;
  source_ids: string[];
};

export type ClinicalSnapshot = {
  id: string;
  patient_case_id: string;
  main_diagnosis: string;
  active_problems: string;
  respiratory_status: string;
  hemodynamic_status: string;
  renal_status: string;
  infectious_status: string;
  nutrition_status: string;
  antibiotics: string;
  vasoactive_drugs: string;
  sedation_analgesia: string;
  devices: string;
  latest_labs: string;
  latest_controls: string;
  pending_items: string;
  plan: string;
  cited_source_ids: string[];
  divergences: Divergence[];
  provider: string;
  model: string | null;
  version: number;
  updated_at: Date;
};

export type ClinicalSnapshotHistoryEntry = Omit<ClinicalSnapshot, "updated_at"> & {
  generated_at: Date;
};

export type PrescriptionReviewItem = {
  category: string;
  known_status: string;
  gap: string;
  cited?: string[];
};

export type PrescriptionReview = {
  id: string;
  patient_case_id: string;
  items: PrescriptionReviewItem[];
  cited_source_ids: string[];
  provider: string;
  model: string | null;
  generated_at: Date;
};

export type HandoffNote = {
  id: string;
  patient_case_id: string;
  body: string;
  cited_source_ids: string[];
  provider: string;
  model: string | null;
  generated_at: Date;
};

export type CaseQuestion = {
  id: string;
  patient_case_id: string;
  question: string;
  answer: string;
  cited_source_ids: string[];
  provider: string;
  model: string | null;
  asked_at: Date;
};

/**
 * Peça detectada pela IA ao processar uma colagem livre de texto.
 * Output do verbo `ingestRawText`. Pode virar um SourceDocument após confirmação.
 */
export type IngestedFragment = {
  source_type: SourceType;
  raw_text: string;
  source_datetime: Date | null;
  title: string | null;
  /** Confiança da classificação automática (0-1). LLM pode usar para sinalizar incerteza. */
  confidence: number;
  /** Frase curta explicando por que o LLM classificou assim (visível na preview). */
  rationale: string | null;
};

/**
 * Severidade da lacuna detectada na ficha do leito.
 * - critical: bloqueia raciocínio clínico (ex.: sem prescrição registrada)
 * - warning : envelhecendo / não atualizado (ex.: controles 24h há 8h sem update)
 * - info    : ainda aceitável mas vale registrar (ex.: sem evolução do diarista hoje)
 */
export type GapSeverity = "critical" | "warning" | "info";

/**
 * Lacuna ou item ausente da ficha clínica deste leito.
 * Output do verbo `detectGaps`.
 */
export type Gap = {
  category: SourceType | "summary" | "plan" | "other";
  label: string;
  severity: GapSeverity;
  why: string;
  suggested_action: string | null;
};

/**
 * Frescor de cada categoria de fonte no leito.
 * Mostra qual a última atualização e se está envelhecendo.
 */
export type FreshnessEntry = {
  category: SourceType;
  label: string;
  last_update_at: Date | null;
  age_minutes: number | null;
  status: "fresh" | "aging" | "stale" | "missing";
};

export type PendingItem = {
  id: string;
  patient_case_id: string;
  description: string;
  resolved: boolean;
  created_at: Date;
};
