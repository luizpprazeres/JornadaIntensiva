import { DocumentBlock, EmptyHint, MonoBlock } from "@/components/ui";
import { getAI } from "@/lib/ai";
import type { SourceDocument } from "@/types/domain";

type Props = {
  sources: SourceDocument[];
};

export async function ImagingTab({ sources }: Props) {
  const images = sources.filter((s) => s.source_type === "imaging");
  const formatted = await getAI().formatImaging({ sources });

  return (
    <DocumentBlock
      title="Imagem"
      meta={
        images.length === 0
          ? "nenhum exame de imagem registrado neste leito"
          : `${images.length} laudo(s) — uma linha por exame, da mais recente para a mais antiga`
      }
    >
      {images.length === 0 ? (
        <EmptyHint>
          Cole laudos de imagem (ou texto extraído de prints) como uma fonte tipo &quot;Imagem&quot; na aba <strong>Fontes</strong>.
        </EmptyHint>
      ) : (
        <MonoBlock ariaLabel="Linhas de imagem no padrão NOME (DATA): IMPRESSÃO PRINCIPAL">
          {formatted}
        </MonoBlock>
      )}
    </DocumentBlock>
  );
}
