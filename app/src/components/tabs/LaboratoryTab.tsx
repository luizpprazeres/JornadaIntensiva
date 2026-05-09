import { DocumentBlock, EmptyHint, MonoBlock } from "@/components/ui";
import { getAI } from "@/lib/ai";
import type { SourceDocument } from "@/types/domain";

type Props = {
  sources: SourceDocument[];
};

export async function LaboratoryTab({ sources }: Props) {
  const labs = sources.filter((s) => s.source_type === "laboratory");
  const formatted = await getAI().formatLaboratory({ sources });

  return (
    <DocumentBlock
      title="Laboratório"
      meta={
        labs.length === 0
          ? "nenhum exame laboratorial registrado neste leito"
          : `${labs.length} exame(s) registrado(s) — padrão LAB linha única`
      }
    >
      {labs.length === 0 ? (
        <EmptyHint>
          Cole exames laboratoriais como uma fonte tipo &quot;Laboratório&quot; na aba <strong>Fontes</strong>.
        </EmptyHint>
      ) : (
        <MonoBlock ariaLabel="Linhas LAB no padrão fixo, ordenadas da mais recente para a mais antiga">
          {formatted}
        </MonoBlock>
      )}
    </DocumentBlock>
  );
}
