import {
  DocumentBlock,
  EmptyHint,
  MarkChip,
  MetaLine,
  MonoBlock,
} from "@/components/ui";
import { SOURCE_TYPE_LABELS, type SourceDocument } from "@/types/domain";
import { formatDateTimeBR } from "@/lib/utils/format";

const EVOLUTION_TYPES: SourceDocument["source_type"][] = [
  "medical_evolution",
  "diarist_evolution",
  "physician_note",
];

type Props = {
  sources: SourceDocument[];
};

export function EvolutionTab({ sources }: Props) {
  const evolutions = sources
    .filter((s) => EVOLUTION_TYPES.includes(s.source_type))
    .sort((a, b) => {
      const aT = (a.source_datetime ?? a.created_at).getTime();
      const bT = (b.source_datetime ?? b.created_at).getTime();
      return bT - aT;
    });

  return (
    <DocumentBlock
      title="Evolução"
      meta={
        evolutions.length === 0
          ? "nenhuma evolução registrada"
          : `${evolutions.length} entrada(s), da mais recente para a mais antiga`
      }
    >
      {evolutions.length === 0 ? (
        <EmptyHint>
          Adicione evoluções (intensivista, diarista, observação do plantonista) na aba{" "}
          <strong>Fontes</strong>.
        </EmptyHint>
      ) : (
        <ul className="space-y-5">
          {evolutions.map((s) => (
            <li key={s.id} className="border-l-2 border-paper-300 pl-4">
              <header className="mb-1 flex flex-wrap items-baseline gap-2">
                <MarkChip>{SOURCE_TYPE_LABELS[s.source_type]}</MarkChip>
                {s.title && (
                  <span className="font-serif text-doc-base text-ink-900">{s.title}</span>
                )}
              </header>
              <MetaLine className="mb-2">
                {formatDateTimeBR(s.source_datetime ?? s.created_at)} · #{s.id}
              </MetaLine>
              <MonoBlock>{s.raw_text}</MonoBlock>
            </li>
          ))}
        </ul>
      )}
    </DocumentBlock>
  );
}
