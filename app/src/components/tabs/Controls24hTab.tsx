import { DocumentBlock, EmptyHint, MonoBlock } from "@/components/ui";
import { getAI } from "@/lib/ai";
import type { SourceDocument } from "@/types/domain";

type Props = {
  sources: SourceDocument[];
};

export async function Controls24hTab({ sources }: Props) {
  const ctrls = sources.filter((s) => s.source_type === "controls_24h");
  const formatted = await getAI().formatControls24h({ sources });

  return (
    <DocumentBlock
      title="Controles 24h"
      meta={
        ctrls.length === 0
          ? "nenhum bloco de controles registrado"
          : `${ctrls.length} bloco(s) — temperatura, PAM, FR, FC, SatO2, HGT, diurese, balanço, UF`
      }
    >
      {ctrls.length === 0 ? (
        <EmptyHint>
          Cole os controles do beira-leito como uma fonte tipo &quot;Controles 24h&quot; na aba <strong>Fontes</strong>.
        </EmptyHint>
      ) : (
        <MonoBlock ariaLabel="Tabela de controles 24h">{formatted}</MonoBlock>
      )}
    </DocumentBlock>
  );
}
