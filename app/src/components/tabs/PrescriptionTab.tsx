import { DocumentBlock, EmptyHint, MetaLine, QuietButton } from "@/components/ui";
import type { PrescriptionReview } from "@/types/domain";
import { formatDateTimeBR } from "@/lib/utils/format";

type Props = {
  review: PrescriptionReview | null;
  generateAction: () => Promise<void>;
};

export function PrescriptionTab({ review, generateAction }: Props) {
  return (
    <DocumentBlock
      title="Checklist de prescrição"
      meta={
        review
          ? `gerado em ${formatDateTimeBR(review.generated_at)} — apoio à revisão (não prescritivo)`
          : "checklist ainda não gerado"
      }
      actions={
        <form action={generateAction}>
          <QuietButton type="submit" variant="primary" className="text-doc-xs">
            {review ? "Atualizar checklist" : "Gerar checklist"}
          </QuietButton>
        </form>
      }
    >
      <MetaLine className="not-italic mb-2 text-clinical-warn">
        Apoio à revisão. Este checklist NÃO emite prescrição. Consulte sempre o prontuário oficial.
      </MetaLine>
      {!review || review.items.length === 0 ? (
        <EmptyHint>
          Adicione fontes (prescrição, evolução, ATB) e clique em &quot;Gerar checklist&quot;.
        </EmptyHint>
      ) : (
        <table className="w-full border-collapse text-doc-sm">
          <thead>
            <tr className="border-b border-paper-300 text-left">
              <th className="py-2 pr-3 doc-smallcaps font-sans text-doc-xs text-ink-500">
                Categoria
              </th>
              <th className="py-2 pr-3 doc-smallcaps font-sans text-doc-xs text-ink-500">
                Status conhecido nas fontes
              </th>
              <th className="py-2 doc-smallcaps font-sans text-doc-xs text-ink-500">
                Lacuna / a confirmar
              </th>
            </tr>
          </thead>
          <tbody>
            {review.items.map((item, idx) => (
              <tr key={`${item.category}-${idx}`} className="border-b border-paper-200 align-top">
                <td className="py-2 pr-3 font-serif text-ink-900">{item.category}</td>
                <td className="py-2 pr-3 text-ink-700">{item.known_status || "—"}</td>
                <td className="py-2 text-ink-600">{item.gap || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DocumentBlock>
  );
}
