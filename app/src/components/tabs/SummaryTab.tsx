import { DocumentBlock, EmptyHint, MarkChip, MetaLine, QuietButton, SectionDivider } from "@/components/ui";
import type {
  ClinicalSnapshot,
  ClinicalSnapshotHistoryEntry,
  Divergence,
  PatientCase,
} from "@/types/domain";
import { formatDateTimeBR } from "@/lib/utils/format";

type ClinicalDataKey = keyof Omit<
  ClinicalSnapshot,
  "id" | "patient_case_id" | "cited_source_ids" | "divergences" | "provider" | "model" | "version" | "updated_at"
>;

const SECTIONS: Array<{ key: ClinicalDataKey; label: string }> = [
  { key: "main_diagnosis", label: "Diagnóstico principal" },
  { key: "active_problems", label: "Problemas ativos" },
  { key: "respiratory_status", label: "Respiratório" },
  { key: "hemodynamic_status", label: "Hemodinâmico" },
  { key: "renal_status", label: "Renal" },
  { key: "infectious_status", label: "Infeccioso" },
  { key: "nutrition_status", label: "Nutrição" },
  { key: "antibiotics", label: "Antibióticos" },
  { key: "vasoactive_drugs", label: "Drogas vasoativas" },
  { key: "sedation_analgesia", label: "Sedação / analgesia" },
  { key: "devices", label: "Dispositivos invasivos" },
  { key: "latest_labs", label: "Laboratórios recentes" },
  { key: "latest_controls", label: "Controles recentes" },
  { key: "pending_items", label: "Pendências" },
  { key: "plan", label: "Plano" },
];

type Props = {
  patientCase: PatientCase;
  snapshot: ClinicalSnapshot | null;
  history: ClinicalSnapshotHistoryEntry[];
  divergences: Divergence[];
  regenerateAction: () => Promise<void>;
};

export function SummaryTab({ patientCase, snapshot, history, divergences, regenerateAction }: Props) {
  const metaParts = snapshot
    ? [
        `atualizada em ${formatDateTimeBR(snapshot.updated_at)}`,
        snapshot.provider,
        snapshot.model ?? null,
        `v${snapshot.version}`,
      ].filter(Boolean)
    : [];

  const metaText = snapshot ? metaParts.join(" · ") : "ficha ainda não gerada";

  return (
    <DocumentBlock
      title="Ficha viva"
      meta={metaText}
      actions={
        <form action={regenerateAction}>
          <QuietButton type="submit" variant="primary" className="text-doc-xs">
            {snapshot ? "Atualizar ficha" : "Gerar ficha viva"}
          </QuietButton>
        </form>
      }
    >
      {!snapshot ? (
        <EmptyHint>
          Adicione fontes ao leito (passagem, evolução, exames) e clique em &quot;Gerar ficha viva&quot;.
        </EmptyHint>
      ) : (
        <>
          <MetaLine className="not-italic">
            {patientCase.bed_label} · {patientCase.patient_name_or_identifier}
            {patientCase.age != null ? `, ${patientCase.age}a` : null}
          </MetaLine>

          {divergences.length > 0 && (
            <>
              <SectionDivider label="Divergências detectadas" />
              <ul className="space-y-3">
                {divergences.map((div, idx) => (
                  <li key={idx} className="border-l-2 border-clinical-warn/40 pl-4">
                    <MarkChip tone="warn">{div.topic}</MarkChip>
                    <p className="mt-1 text-doc-sm text-ink-700">{div.description}</p>
                    {div.source_ids.length > 0 && (
                      <p className="mt-0.5 doc-mono text-doc-xs text-ink-400">
                        {div.source_ids.map((id) => `#${id}`).join("  ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          <SectionDivider />
          <dl className="grid grid-cols-1 gap-4">
            {SECTIONS.map((s) => {
              const value = snapshot[s.key];
              return (
                <div key={s.key} className="border-l-2 border-paper-300 pl-4">
                  <dt className="font-sans text-doc-xs uppercase tracking-[0.08em] text-ink-500">
                    {s.label}
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-doc-base text-ink-700">
                    {typeof value === "string" && value.length > 0 ? value : "—"}
                  </dd>
                </div>
              );
            })}
          </dl>

          {history.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer list-none select-none font-sans text-doc-xs uppercase tracking-[0.08em] text-ink-400 hover:text-ink-600 transition-colors">
                Versões anteriores ({history.length})
              </summary>
              <ul className="mt-3 space-y-5 border-l-2 border-paper-200 pl-4">
                {history.map((entry) => (
                  <li key={`v${entry.version}`}>
                    <p className="font-sans text-doc-xs text-ink-500">
                      v{entry.version}
                      {" — "}gerado {formatDateTimeBR(entry.generated_at)}
                      {` · ${entry.provider}`}
                      {entry.model ? ` · ${entry.model}` : ""}
                    </p>
                    <dl className="mt-2 grid grid-cols-1 gap-1.5">
                      {SECTIONS.map((s) => {
                        const entryRecord = entry as Record<string, unknown>;
                        const value = entryRecord[s.key];
                        if (typeof value !== "string" || !value) return null;
                        return (
                          <div key={s.key} className="flex gap-2 text-doc-xs">
                            <dt className="w-28 shrink-0 font-sans uppercase tracking-[0.08em] text-ink-400">
                              {s.label}
                            </dt>
                            <dd className="line-clamp-2 whitespace-pre-wrap text-ink-600">
                              {value}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </DocumentBlock>
  );
}
