/**
 * Smoke test do LLM real (OpenAI).
 * Valida que a chave funciona e que askCase retorna resposta válida com cited.
 *
 * Uso: npm run smoke:llm  (carrega .env.local via tsx --env-file)
 */
import { getAI } from "@/lib/ai";
import { getPatientCase, listSources } from "@/lib/repos";

async function main() {
  console.log("[smoke-llm] AI_PROVIDER =", process.env.AI_PROVIDER);
  console.log("[smoke-llm] OPENAI_MODEL =", process.env.OPENAI_MODEL ?? "(default)");

  const patientCaseId = "mock-bed-7";
  const patientCase = await getPatientCase(patientCaseId);
  if (!patientCase) {
    console.error("Leito mock-bed-7 não encontrado. Rode `npm run seed` primeiro.");
    process.exit(1);
  }
  const sources = await listSources(patientCaseId);
  console.log(`[smoke-llm] leito carregado: ${patientCase.bed_label} (${sources.length} fontes)`);

  const ai = await getAI();
  console.log(`[smoke-llm] provider ativo: ${ai.providerName} ${ai.modelName ?? ""}`);

  console.log("\n[smoke-llm] testando askCase…");
  const t0 = Date.now();
  const result = await ai.askCase({
    patientCase,
    sources,
    question: "Qual é o motivo da admissão deste paciente?",
  });
  const ms = Date.now() - t0;

  console.log(`\n--- RESPOSTA (${ms}ms) ---`);
  console.log(result.answer);
  console.log(`\nCitadas: ${result.cited.length} fonte(s)`);
  if (result.cited.length > 0) console.log("  - " + result.cited.join("\n  - "));
  console.log(`\nProvider: ${result.provider} ${result.model ?? ""}`);

  if (ai.providerName === "openai" && result.cited.length === 0) {
    console.warn("\n[smoke-llm] AVISO: LLM não retornou citações. Resultado pode estar incompleto.");
  }

  console.log("\n[smoke-llm] OK");
  process.exit(0);
}

main().catch((err) => {
  console.error("[smoke-llm] FALHOU:", err);
  process.exit(1);
});
