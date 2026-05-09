import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

import { SOURCE_TYPES, type SourceType } from "@/types/domain";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => nanoid());

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

const updatedAt = () =>
  integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date());

export const shifts = sqliteTable("shifts", {
  id: id(),
  label: text("label"),
  started_at: integer("started_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  ended_at: integer("ended_at", { mode: "timestamp" }),
  notes: text("notes"),
  created_at: createdAt(),
  updated_at: updatedAt(),
});

export const patientCases = sqliteTable("patient_cases", {
  id: id(),
  shift_id: text("shift_id")
    .notNull()
    .references(() => shifts.id, { onDelete: "cascade" }),
  bed_label: text("bed_label").notNull(),
  patient_name_or_identifier: text("patient_name_or_identifier").notNull(),
  age: integer("age"),
  admission_date: integer("admission_date", { mode: "timestamp" }),
  main_diagnosis: text("main_diagnosis"),
  current_status: text("current_status"),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_at: createdAt(),
  updated_at: updatedAt(),
});

export const sourceDocuments = sqliteTable("source_documents", {
  id: id(),
  patient_case_id: text("patient_case_id")
    .notNull()
    .references(() => patientCases.id, { onDelete: "cascade" }),
  source_type: text("source_type", { enum: SOURCE_TYPES }).$type<SourceType>().notNull(),
  title: text("title"),
  raw_text: text("raw_text").notNull(),
  structured_summary: text("structured_summary"),
  source_datetime: integer("source_datetime", { mode: "timestamp" }),
  created_at: createdAt(),
  updated_at: updatedAt(),
});

export const clinicalSnapshots = sqliteTable("clinical_snapshots", {
  id: id(),
  patient_case_id: text("patient_case_id")
    .notNull()
    .unique()
    .references(() => patientCases.id, { onDelete: "cascade" }),
  main_diagnosis: text("main_diagnosis").notNull(),
  active_problems: text("active_problems").notNull(),
  respiratory_status: text("respiratory_status").notNull(),
  hemodynamic_status: text("hemodynamic_status").notNull(),
  renal_status: text("renal_status").notNull(),
  infectious_status: text("infectious_status").notNull(),
  nutrition_status: text("nutrition_status").notNull(),
  antibiotics: text("antibiotics").notNull(),
  vasoactive_drugs: text("vasoactive_drugs").notNull(),
  sedation_analgesia: text("sedation_analgesia").notNull(),
  devices: text("devices").notNull(),
  latest_labs: text("latest_labs").notNull(),
  latest_controls: text("latest_controls").notNull(),
  pending_items: text("pending_items").notNull(),
  plan: text("plan").notNull(),
  updated_at: updatedAt(),
});

export const prescriptionReviews = sqliteTable("prescription_reviews", {
  id: id(),
  patient_case_id: text("patient_case_id")
    .notNull()
    .references(() => patientCases.id, { onDelete: "cascade" }),
  items: text("items", { mode: "json" })
    .$type<Array<{ category: string; known_status: string; gap: string }>>()
    .notNull(),
  generated_at: integer("generated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const handoffNotes = sqliteTable("handoff_notes", {
  id: id(),
  patient_case_id: text("patient_case_id")
    .notNull()
    .references(() => patientCases.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  generated_at: integer("generated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const pendingItems = sqliteTable("pending_items", {
  id: id(),
  patient_case_id: text("patient_case_id")
    .notNull()
    .references(() => patientCases.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  resolved: integer("resolved", { mode: "boolean" }).notNull().default(false),
  created_at: createdAt(),
});

export const shiftsRelations = relations(shifts, ({ many }) => ({
  patientCases: many(patientCases),
}));

export const patientCasesRelations = relations(patientCases, ({ one, many }) => ({
  shift: one(shifts, {
    fields: [patientCases.shift_id],
    references: [shifts.id],
  }),
  sourceDocuments: many(sourceDocuments),
  clinicalSnapshot: one(clinicalSnapshots),
  prescriptionReviews: many(prescriptionReviews),
  handoffNotes: many(handoffNotes),
  pendingItems: many(pendingItems),
}));

export const sourceDocumentsRelations = relations(sourceDocuments, ({ one }) => ({
  patientCase: one(patientCases, {
    fields: [sourceDocuments.patient_case_id],
    references: [patientCases.id],
  }),
}));

export const clinicalSnapshotsRelations = relations(clinicalSnapshots, ({ one }) => ({
  patientCase: one(patientCases, {
    fields: [clinicalSnapshots.patient_case_id],
    references: [patientCases.id],
  }),
}));

export const prescriptionReviewsRelations = relations(prescriptionReviews, ({ one }) => ({
  patientCase: one(patientCases, {
    fields: [prescriptionReviews.patient_case_id],
    references: [patientCases.id],
  }),
}));

export const handoffNotesRelations = relations(handoffNotes, ({ one }) => ({
  patientCase: one(patientCases, {
    fields: [handoffNotes.patient_case_id],
    references: [patientCases.id],
  }),
}));

export const pendingItemsRelations = relations(pendingItems, ({ one }) => ({
  patientCase: one(patientCases, {
    fields: [pendingItems.patient_case_id],
    references: [patientCases.id],
  }),
}));
