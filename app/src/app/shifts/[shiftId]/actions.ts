"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createPatientCase, deactivatePatientCase, endShift } from "@/lib/repos";

export async function createPatientCaseAction(shiftId: string, formData: FormData): Promise<void> {
  const bedLabel = String(formData.get("bed_label") ?? "").trim();
  const identifier = String(formData.get("patient_name_or_identifier") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const admissionRaw = String(formData.get("admission_date") ?? "").trim();
  const mainDiagnosis = String(formData.get("main_diagnosis") ?? "").trim();

  if (!bedLabel || !identifier) {
    throw new Error("bed_label e patient_name_or_identifier são obrigatórios");
  }

  const age = ageRaw ? Number.parseInt(ageRaw, 10) : null;
  const admission_date = admissionRaw ? new Date(admissionRaw) : null;

  const patientCase = await createPatientCase({
    shift_id: shiftId,
    bed_label: bedLabel,
    patient_name_or_identifier: identifier,
    age: Number.isFinite(age) ? (age as number) : null,
    admission_date: admission_date && !Number.isNaN(admission_date.getTime()) ? admission_date : null,
    main_diagnosis: mainDiagnosis || null,
  });

  revalidatePath(`/shifts/${shiftId}`);
  redirect(`/shifts/${shiftId}/beds/${patientCase.id}`);
}

export async function deactivatePatientCaseAction(shiftId: string, patientCaseId: string): Promise<void> {
  await deactivatePatientCase(patientCaseId);
  revalidatePath(`/shifts/${shiftId}`);
}

export async function endShiftAction(shiftId: string): Promise<void> {
  await endShift(shiftId);
  revalidatePath("/");
  revalidatePath(`/shifts/${shiftId}`);
}
