import {
  DocumentBlock,
  EmptyHint,
  MarkChip,
  MetaLine,
  QuietButton,
  SectionDivider,
} from "@/components/ui";
import type {
  ClinicalSnapshot,
  ClinicalSnapshotHistoryEntry,
  Divergence,
  FreshnessEntry,
  Gap,
  GapSeverity,
  HandoffNote,
  PatientCase,
  PrescriptionReview,
} from "@/types/domain";
import {
  HandoffArtifactCard,
  FamilyArtifactCard,
  PrescriptionArtifactCard,
} from "@/components/tabs/ArtifactCard";
import { formatDateTimeBR } from "@/lib/utils/format";

// ─── Constants ─────────────────────────────────────────────────────────────────

type ClinicalDataKey = keyof Omit<
  ClinicalSnapshot,
  | "id"
  | "patient_case_id"
  | "cited_source_ids"
  | "divergences"
  | "provider"
  | "model"
  | "version"
  | "updated_at"
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

// ─── Helpers ────────────────────────────────────────────────────────────────────

function gapTone(severity: GapSeverity): "alert" | "warn" | "neutral" {
  if (severity === "critical") return "alert";
  if (severity === "warning") return "warn";
  return "neutral";
}

function gapLabel(severity: GapSeverity): string {
  if (severity === "critical") return "crítico";
  if (severity === "warning") return "atenção";
  return "info";
}

function freshnessTone(status: FreshnessEntry["status"]): "ok" | "warn" | "alert" {
  if (status === "fresh") return "ok";
  if (status === "aging") return "warn";
  return "alert";
}

function freshnessLabel(status: FreshnessEntry["status"]): string {
  if (status === "fresh") return "fresco";
  if (status === "aging") return "envelhecendo";
  if (status === "stale") return "desatualizado";
  return "ausente";
}

function formatAge(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes}min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
  return `${Math.round(minutes / 1440)}d`;
}

// ─── Props ──────────────────────────────────────────────────────────────────────

type FamilySummaryResult = {
  body: string;
  cited: string[];
  provider: string;
  model: string | null;
};

type Props = {
  patientCase: PatientCase;
  snapshot: ClinicalSnapshot | null;
  history: ClinicalSnapshotHistoryEntry[];
  divergences: Divergence[];
  gaps: Gap[];
  freshness: FreshnessEntry[];
  latestHandoff: HandoffNote | null;
  latestReview: PrescriptionReview | null;
  regenerateAction: () => Promise<void>;
  generateHandoffAction: () => Promise<void>;
  generateFamilySummaryAction: () => Promise<FamilySummaryResult>;
  generatePrescriptionReviewAction: () => Promise<void>;
};

// ─── Component ─────────────────────────────────────────────────────────────────

export function SummaryTab({
  patientCase,
  snapshot,
  history,
  divergences,
  gaps,
  freshness,
  latestHandoff,
  latestReview,
  regenerateAction,
  generateHandoffAction,
  generateFamilySummaryAction,
  generatePrescriptionReviewAction,
}: Props) {
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
          Adicione fontes ao leito (aba &quot;Adicionar&quot;) e clique em &quot;Gerar ficha viva&quot;.
        </EmptyHint>
      ) : (
        <>
          <MetaLine className="not-italic">
            {patientCase.bed_label} · {patientCase.patient_name_or_identifier}
            {patientCase.age != null ? `, ${patientCase.age}a` : null}
          </MetaLine>

          {/* ── Divergências ── */}
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

          {/* ── Lacunas ── */}
          {gaps.length > 0 && (
            <>
              <SectionDivider label="Lacunas deste leito" />
              <ul className="space-y-3">
                {gaps.map((gap, idx) => (
                  <li key={idx} className="border-l-2 border-paper-300 pl-4">
                    <div className="flex items-baseline gap-2">
                      <MarkChip tone={gapTone(gap.severity)}>{gapLabel(gap.severity)}</MarkChip>
                      <span className="font-serif text-doc-base text-ink-800">{gap.label}</span>
                    </div>
                    <p className="mt-1 text-doc-sm text-ink-600">{gap.why}</p>
                    {gap.suggested_action && (
                      <p className="mt-0.5 text-doc-xs italic text-ink-400">{gap.suggested_action}</p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* ── Frescor das fontes ── */}
          {freshness.length > 0 && (
            <>
              <SectionDivider label="Frescor das fontes" />
              <table className="w-full border-collapse text-doc-xs">
                <thead>
                  <tr className="border-b border-paper-300 text-left">
                    <th className="py-1.5 pr-3 doc-smallcaps font-sans text-ink-500">Categoria</th>
                    <th className="py-1.5 pr-3 doc-smallcaps font-sans text-ink-500">Última atualização</th>
                    <th className="py-1.5 pr-3 doc-smallcaps font-sans text-ink-500">Idade</th>
                    <th className="py-1.5 doc-smallcaps font-sans text-ink-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {freshness.map((entry) => (
                    <tr key={entry.category} className="border-b border-paper-100 align-middle">
                      <td className="py-1.5 pr-3 text-ink-700">{entry.label}</td>
                      <td className="py-1.5 pr-3 text-ink-500">
                        {formatDateTimeBR(entry.last_update_at) ?? "—"}
                      </td>
                      <td className="py-1.5 pr-3 text-ink-500">{formatAge(entry.age_minutes)}</td>
                      <td className="py-1.5">
                        <MarkChip tone={freshnessTone(entry.status)}>
                          {freshnessLabel(entry.status)}
                        </MarkChip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ── Campos da ficha ── */}
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

          {/* ── Artefatos inline ── */}
          <SectionDivider label="Artefatos" />
          <div className="space-y-3">
            <HandoffArtifactCard
              initial={latestHandoff}
              generateAction={generateHandoffAction}
            />
            <FamilyArtifactCard generateAction={generateFamilySummaryAction} />
            <PrescriptionArtifactCard
              initial={latestReview}
              generateAction={generatePrescriptionReviewAction}
            />
          </div>

          {/* ── Versões anteriores ── */}
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
