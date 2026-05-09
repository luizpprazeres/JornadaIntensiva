import { DocumentBlock, EmptyHint, MetaLine, QuietButton, SectionDivider } from "@/components/ui";
import type { ClinicalSnapshot, PatientCase } from "@/types/domain";
import { formatDateTimeBR } from "@/lib/utils/format";

const SECTIONS: Array<{ key: keyof ClinicalSnapshot; label: string }> = [
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
  regenerateAction: () => Promise<void>;
};

export function SummaryTab({ patientCase, snapshot, regenerateAction }: Props) {
  return (
    <DocumentBlock
      title="Ficha viva"
      meta={
        snapshot
          ? `atualizada em ${formatDateTimeBR(snapshot.updated_at)}`
          : "ficha ainda não gerada"
      }
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
        </>
      )}
    </DocumentBlock>
  );
}
