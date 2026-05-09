import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db/client";
import {
  clinicalSnapshots,
  handoffNotes,
  patientCases,
  pendingItems,
  prescriptionReviews,
  shifts,
  sourceDocuments,
} from "@/lib/db/schema";
import {
  SOURCE_TYPES,
  type ClinicalSnapshot,
  type HandoffNote,
  type PatientCase,
  type PendingItem,
  type PrescriptionReview,
  type PrescriptionReviewItem,
  type Shift,
  type SourceDocument,
  type SourceType,
} from "@/types/domain";

const optionalNullableString = z.string().trim().min(1).nullable().optional();
const dateLike = z.date();
const now = () => new Date();

export const shiftCreateSchema = z.object({
  label: z.string().trim().min(1).optional(),
  started_at: dateLike.optional(),
});

export const shiftUpdateSchema = z.object({
  label: z.string().trim().min(1).nullable().optional(),
  started_at: dateLike.optional(),
  ended_at: dateLike.nullable().optional(),
  notes: z.string().trim().min(1).nullable().optional(),
});

export const patientCaseCreateSchema = z.object({
  shift_id: z.string().min(1),
  bed_label: z.string().trim().min(1),
  patient_name_or_identifier: z.string().trim().min(1),
  age: z.number().int().nonnegative().nullable().optional(),
  admission_date: dateLike.nullable().optional(),
  main_diagnosis: optionalNullableString,
  current_status: optionalNullableString,
  is_active: z.boolean().optional(),
});

export const patientCaseUpdateSchema = patientCaseCreateSchema
  .omit({ shift_id: true })
  .partial()
  .extend({
    shift_id: z.string().min(1).optional(),
  });

export const sourceDocumentCreateSchema = z.object({
  patient_case_id: z.string().min(1),
  source_type: z.enum(SOURCE_TYPES),
  title: z.string().trim().min(1).optional(),
  raw_text: z.string().min(1),
  structured_summary: z.string().nullable().optional(),
  source_datetime: dateLike.nullable().optional(),
});

export const sourceDocumentUpdateSchema = sourceDocumentCreateSchema
  .omit({ patient_case_id: true })
  .partial();

export const clinicalSnapshotSchema = z.object({
  main_diagnosis: z.string(),
  active_problems: z.string(),
  respiratory_status: z.string(),
  hemodynamic_status: z.string(),
  renal_status: z.string(),
  infectious_status: z.string(),
  nutrition_status: z.string(),
  antibiotics: z.string(),
  vasoactive_drugs: z.string(),
  sedation_analgesia: z.string(),
  devices: z.string(),
  latest_labs: z.string(),
  latest_controls: z.string(),
  pending_items: z.string(),
  plan: z.string(),
});

export const prescriptionReviewItemSchema = z.object({
  category: z.string(),
  known_status: z.string(),
  gap: z.string(),
});

export const prescriptionReviewCreateSchema = z.object({
  items: z.array(prescriptionReviewItemSchema),
});

export const handoffNoteCreateSchema = z.object({
  body: z.string().min(1),
});

export const pendingItemCreateSchema = z.object({
  description: z.string().trim().min(1),
});

const first = <T>(rows: T[]) => rows[0] ?? null;

const toShift = (row: typeof shifts.$inferSelect): Shift => {
  const { label, notes, ...rest } = row;

  return {
    ...rest,
    ...(label === null ? {} : { label }),
    ...(notes === null ? {} : { notes }),
  };
};

const toSourceDocument = (row: typeof sourceDocuments.$inferSelect): SourceDocument => {
  const { title, ...rest } = row;

  return {
    ...rest,
    ...(title === null ? {} : { title }),
  };
};

export async function listShifts(): Promise<Shift[]> {
  const rows = await db.select().from(shifts).orderBy(desc(shifts.started_at));
  return rows.map(toShift);
}

export async function getShift(id: string): Promise<Shift | null> {
  const row = first(await db.select().from(shifts).where(eq(shifts.id, id)).limit(1));
  return row ? toShift(row) : null;
}

export async function createShift(input: z.input<typeof shiftCreateSchema>): Promise<Shift> {
  const data = shiftCreateSchema.parse(input);
  const timestamp = now();

  const row = first(
    await db
      .insert(shifts)
      .values({
        label: data.label,
        started_at: data.started_at ?? timestamp,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .returning(),
  )!;

  return toShift(row);
}

export async function updateShift(
  id: string,
  patch: z.input<typeof shiftUpdateSchema>,
): Promise<Shift | null> {
  const data = shiftUpdateSchema.parse(patch);

  const row = first(
    await db
      .update(shifts)
      .set({ ...data, updated_at: now() })
      .where(eq(shifts.id, id))
      .returning(),
  );

  return row ? toShift(row) : null;
}

export async function endShift(id: string): Promise<Shift | null> {
  const timestamp = now();

  const row = first(
    await db
      .update(shifts)
      .set({ ended_at: timestamp, updated_at: timestamp })
      .where(eq(shifts.id, id))
      .returning(),
  );

  return row ? toShift(row) : null;
}

export async function listPatientCases(shiftId: string): Promise<PatientCase[]> {
  return db
    .select()
    .from(patientCases)
    .where(eq(patientCases.shift_id, shiftId))
    .orderBy(patientCases.bed_label);
}

export async function getPatientCase(id: string): Promise<PatientCase | null> {
  return first(await db.select().from(patientCases).where(eq(patientCases.id, id)).limit(1));
}

export async function createPatientCase(
  input: z.input<typeof patientCaseCreateSchema>,
): Promise<PatientCase> {
  const data = patientCaseCreateSchema.parse(input);
  const timestamp = now();

  return first(
    await db
      .insert(patientCases)
      .values({
        ...data,
        age: data.age ?? null,
        admission_date: data.admission_date ?? null,
        main_diagnosis: data.main_diagnosis ?? null,
        current_status: data.current_status ?? null,
        is_active: data.is_active ?? true,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .returning(),
  )!;
}

export async function updatePatientCase(
  id: string,
  patch: z.input<typeof patientCaseUpdateSchema>,
): Promise<PatientCase | null> {
  const data = patientCaseUpdateSchema.parse(patch);

  return first(
    await db
      .update(patientCases)
      .set({ ...data, updated_at: now() })
      .where(eq(patientCases.id, id))
      .returning(),
  );
}

export async function deactivatePatientCase(id: string): Promise<PatientCase | null> {
  return first(
    await db
      .update(patientCases)
      .set({ is_active: false, updated_at: now() })
      .where(eq(patientCases.id, id))
      .returning(),
  );
}

export async function listSources(patientCaseId: string): Promise<SourceDocument[]> {
  const rows = await db
    .select()
    .from(sourceDocuments)
    .where(eq(sourceDocuments.patient_case_id, patientCaseId))
    .orderBy(desc(sourceDocuments.source_datetime), desc(sourceDocuments.created_at));

  return rows.map(toSourceDocument);
}

export async function getSource(patientCaseId: string, id: string): Promise<SourceDocument | null> {
  const row = first(
    await db
      .select()
      .from(sourceDocuments)
      .where(and(eq(sourceDocuments.patient_case_id, patientCaseId), eq(sourceDocuments.id, id)))
      .limit(1),
  );

  return row ? toSourceDocument(row) : null;
}

export async function createSource(
  input: z.input<typeof sourceDocumentCreateSchema>,
): Promise<SourceDocument> {
  const data = sourceDocumentCreateSchema.parse(input);
  const timestamp = now();

  const row = first(
    await db
      .insert(sourceDocuments)
      .values({
        ...data,
        title: data.title,
        structured_summary: data.structured_summary ?? null,
        source_datetime: data.source_datetime ?? null,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .returning(),
  )!;

  return toSourceDocument(row);
}

export async function updateSource(
  patientCaseId: string,
  id: string,
  patch: z.input<typeof sourceDocumentUpdateSchema>,
): Promise<SourceDocument | null> {
  const data = sourceDocumentUpdateSchema.parse(patch);

  const row = first(
    await db
      .update(sourceDocuments)
      .set({ ...data, updated_at: now() })
      .where(and(eq(sourceDocuments.patient_case_id, patientCaseId), eq(sourceDocuments.id, id)))
      .returning(),
  );

  return row ? toSourceDocument(row) : null;
}

export async function deleteSource(patientCaseId: string, id: string): Promise<SourceDocument | null> {
  const row = first(
    await db
      .delete(sourceDocuments)
      .where(and(eq(sourceDocuments.patient_case_id, patientCaseId), eq(sourceDocuments.id, id)))
      .returning(),
  );
  return row ? toSourceDocument(row) : null;
}

export async function getSnapshot(patientCaseId: string): Promise<ClinicalSnapshot | null> {
  return first(
    await db
      .select()
      .from(clinicalSnapshots)
      .where(eq(clinicalSnapshots.patient_case_id, patientCaseId))
      .limit(1),
  );
}

export async function upsertSnapshot(
  patientCaseId: string,
  data: z.input<typeof clinicalSnapshotSchema>,
): Promise<ClinicalSnapshot> {
  const parsed = clinicalSnapshotSchema.parse(data);
  const timestamp = now();

  return first(
    await db
      .insert(clinicalSnapshots)
      .values({
        patient_case_id: patientCaseId,
        ...parsed,
        updated_at: timestamp,
      })
      .onConflictDoUpdate({
        target: clinicalSnapshots.patient_case_id,
        set: {
          ...parsed,
          updated_at: timestamp,
        },
      })
      .returning(),
  )!;
}

export async function getLatestHandoff(patientCaseId: string): Promise<HandoffNote | null> {
  return first(
    await db
      .select()
      .from(handoffNotes)
      .where(eq(handoffNotes.patient_case_id, patientCaseId))
      .orderBy(desc(handoffNotes.generated_at))
      .limit(1),
  );
}

export async function createHandoff(patientCaseId: string, body: string): Promise<HandoffNote> {
  const data = handoffNoteCreateSchema.parse({ body });

  return first(
    await db
      .insert(handoffNotes)
      .values({
        patient_case_id: patientCaseId,
        body: data.body,
        generated_at: now(),
      })
      .returning(),
  )!;
}

export async function getLatestReview(patientCaseId: string): Promise<PrescriptionReview | null> {
  return first(
    await db
      .select()
      .from(prescriptionReviews)
      .where(eq(prescriptionReviews.patient_case_id, patientCaseId))
      .orderBy(desc(prescriptionReviews.generated_at))
      .limit(1),
  );
}

export async function createReview(
  patientCaseId: string,
  items: PrescriptionReviewItem[],
): Promise<PrescriptionReview> {
  const data = prescriptionReviewCreateSchema.parse({ items });

  return first(
    await db
      .insert(prescriptionReviews)
      .values({
        patient_case_id: patientCaseId,
        items: data.items,
        generated_at: now(),
      })
      .returning(),
  )!;
}

export async function listPending(patientCaseId: string): Promise<PendingItem[]> {
  return db
    .select()
    .from(pendingItems)
    .where(eq(pendingItems.patient_case_id, patientCaseId))
    .orderBy(pendingItems.resolved, desc(pendingItems.created_at));
}

export async function createPending(
  patientCaseId: string,
  description: string,
): Promise<PendingItem> {
  const data = pendingItemCreateSchema.parse({ description });

  return first(
    await db
      .insert(pendingItems)
      .values({
        patient_case_id: patientCaseId,
        description: data.description,
        resolved: false,
        created_at: now(),
      })
      .returning(),
  )!;
}

export async function togglePending(patientCaseId: string, id: string): Promise<PendingItem | null> {
  const item = first(
    await db
      .select()
      .from(pendingItems)
      .where(and(eq(pendingItems.patient_case_id, patientCaseId), eq(pendingItems.id, id)))
      .limit(1),
  );

  if (!item) {
    return null;
  }

  return first(
    await db
      .update(pendingItems)
      .set({ resolved: !item.resolved })
      .where(and(eq(pendingItems.patient_case_id, patientCaseId), eq(pendingItems.id, id)))
      .returning(),
  );
}

export type { SourceType };
