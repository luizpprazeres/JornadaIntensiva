import { readFile } from "fs/promises";
import path from "path";

export const PROMPT_NAMES = [
  "handoff-summary",
  "laboratory-format",
  "imaging-format",
  "controls-24h",
  "evolution-update",
  "prescription-review",
  "family-summary",
  "case-question-answering",
  "ingest",
  "gap-detection",
] as const;

export type PromptName = (typeof PROMPT_NAMES)[number];

const promptCache = new Map<PromptName, string>();

export async function loadPrompt(name: PromptName): Promise<string> {
  const cached = promptCache.get(name);

  if (cached !== undefined) {
    return cached;
  }

  const promptPath = path.join(process.cwd(), "..", "prompts", `${name}.md`);
  const prompt = await readFile(promptPath, "utf8");
  promptCache.set(name, prompt);

  return prompt;
}
