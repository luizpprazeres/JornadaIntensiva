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
  updated_at: Date;
};

export type PrescriptionReviewItem = {
  category: string;
  known_status: string;
  gap: string;
};

export type PrescriptionReview = {
  id: string;
  patient_case_id: string;
  items: PrescriptionReviewItem[];
  generated_at: Date;
};

export type HandoffNote = {
  id: string;
  patient_case_id: string;
  body: string;
  generated_at: Date;
};

export type PendingItem = {
  id: string;
  patient_case_id: string;
  description: string;
  resolved: boolean;
  created_at: Date;
};
