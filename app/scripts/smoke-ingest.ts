/**
 * Smoke test do verbo ingestRawText (Fase 2.5).
 * Cola texto bruto misto e valida que a IA fragmenta + classifica + data corretamente.
 *
 * Uso: npm run smoke:ingest
 */
import { getAI } from "@/lib/ai";
import { getPatientCase, listSources } from "@/lib/repos";

const RAW_TEXT_MIXED = `Passagem de plantão 09/05 06h30
Leito 7 — J.M., 61a, AVC isquêmico ACM esquerda, hemicraniectomia D3.
Em VM, sedação leve. Hemodinamicamente estável. ATB: ceftriaxona D5.

LAB 09/05 06h12
Hb 9,8 / Ht 30,2 / Leuco 11.200 / Plq 142 / Na 138 / K 3,9 / Ureia 58 / Cr 1,1 / PCR 6,2

Controles 24h (08/05 22h - 09/05 06h)
PAM 78 / FC 86 / FR 18 / SatO2 96% / HGT 132 / Diurese 1240ml / Balanço +320

paciente referindo dor de cabeça leve às 11h, monitor sem alterações
`;

async function main() {
  const ai = await getAI();
  console.log(`[smoke-ingest] provider: ${ai.providerName} ${ai.modelName ?? ""}\n`);

  const patientCase = await getPatientCase("mock-bed-7");
  if (!patientCase) {
    console.error("Leito mock-bed-7 não encontrado. Rode `npm run seed`.");
    process.exit(1);
  }
  const existingSources = await listSources("mock-bed-7");

  const t0 = Date.now();
  const result = await ai.ingestRawText({
    patientCase,
    existingSources,
    rawText: RAW_TEXT_MIXED,
  });
  const ms = Date.now() - t0;

  console.log(`[smoke-ingest] resposta em ${ms}ms`);
  console.log(`[smoke-ingest] resumo: ${result.summary}\n`);
  console.log(`[smoke-ingest] ${result.fragments.length} fragmentos detectados:`);
  for (const [i, f] of result.fragments.entries()) {
    console.log(`\n  ── Fragmento ${i + 1} (confidence ${f.confidence.toFixed(2)}) ──`);
    console.log(`  source_type:     ${f.source_type}`);
    console.log(`  source_datetime: ${f.source_datetime?.toISOString() ?? "null"}`);
    console.log(`  title:           ${f.title ?? "null"}`);
    console.log(`  rationale:       ${f.rationale ?? "null"}`);
    console.log(`  raw_text (1ª linha): ${f.raw_text.split("\n")[0].slice(0, 80)}`);
  }

  console.log("\n[smoke-ingest] testando detectGaps…");
  const t1 = Date.now();
  const gapsResult = await ai.detectGaps({
    patientCase,
    sources: existingSources,
  });
  const ms2 = Date.now() - t1;
  console.log(`[smoke-ingest] resposta em ${ms2}ms`);
  console.log(`[smoke-ingest] ${gapsResult.gaps.length} lacuna(s):`);
  for (const g of gapsResult.gaps) {
    console.log(`  · [${g.severity}] ${g.label} — ${g.why}`);
  }
  console.log(`\n[smoke-ingest] frescor (${gapsResult.freshness.length}):`);
  for (const f of gapsResult.freshness) {
    const age = f.age_minutes != null ? `${f.age_minutes}min` : "—";
    console.log(`  · ${f.label.padEnd(20)} ${f.status.padEnd(8)} ${age}`);
  }

  console.log("\n[smoke-ingest] OK");
  process.exit(0);
}

main().catch((err) => {
  console.error("[smoke-ingest] FALHOU:", err);
  process.exit(1);
});
