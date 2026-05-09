"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createShift } from "@/lib/repos";

export async function createShiftAction(formData: FormData): Promise<void> {
  const labelRaw = formData.get("label");
  const label = typeof labelRaw === "string" && labelRaw.trim().length > 0 ? labelRaw.trim() : undefined;

  const shift = await createShift(label ? { label } : {});
  revalidatePath("/");
  redirect(`/shifts/${shift.id}`);
}
