import {
  DocumentBlock,
  EmptyHint,
  FieldGroup,
  MarkChip,
  MetaLine,
  MonoBlock,
  QuietButton,
  SectionDivider,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui";
import { SOURCE_TYPE_LABELS, SOURCE_TYPES, type SourceDocument } from "@/types/domain";
import { formatDateTimeBR } from "@/lib/utils/format";

type Props = {
  sources: SourceDocument[];
  addSourceAction: (formData: FormData) => Promise<void>;
  deleteSourceAction: (sourceId: string) => Promise<void>;
};

export function SourcesTab({ sources, addSourceAction, deleteSourceAction }: Props) {
  return (
    <DocumentBlock title="Fontes textuais" meta={`${sources.length} fonte(s) registrada(s)`}>
      <SectionDivider label="adicionar fonte" />

      <form action={addSourceAction} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <FieldGroup label="Tipo de fonte">
            <Select name="source_type" required defaultValue="handoff">
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SOURCE_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Data/hora da fonte" hint="Opcional. Quando esse texto foi originado.">
            <TextInput type="datetime-local" name="source_datetime" />
          </FieldGroup>
        </div>
        <FieldGroup label="Título" hint="Opcional. Ex.: 'Passagem 06h30'">
          <TextInput name="title" maxLength={120} placeholder="Passagem 06h30" />
        </FieldGroup>
        <FieldGroup label="Texto bruto" hint="Cole exatamente como recebeu. O original será preservado.">
          <TextArea name="raw_text" required rows={8} placeholder="Cole aqui o texto da passagem, evolução, exame, controle…" />
        </FieldGroup>
        <div className="flex justify-end">
          <QuietButton type="submit" variant="primary">
            Adicionar fonte
          </QuietButton>
        </div>
      </form>

      <SectionDivider label="histórico de fontes" />

      {sources.length === 0 ? (
        <EmptyHint>Nenhuma fonte registrada. Cole um texto acima para começar.</EmptyHint>
      ) : (
        <ul className="space-y-5">
          {sources.map((source) => {
            const handleDelete = deleteSourceAction.bind(null, source.id);
            return (
              <li key={source.id} className="border-l-2 border-paper-300 pl-4">
                <header className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <MarkChip>{SOURCE_TYPE_LABELS[source.source_type]}</MarkChip>
                    {source.title && (
                      <span className="font-serif text-doc-base text-ink-900">{source.title}</span>
                    )}
                  </div>
                  <form action={handleDelete}>
                    <QuietButton type="submit" className="text-doc-xs text-clinical-alert">
                      remover
                    </QuietButton>
                  </form>
                </header>
                <MetaLine className="mb-2">
                  {formatDateTimeBR(source.source_datetime ?? source.created_at)} · #{source.id}
                </MetaLine>
                <MonoBlock>{source.raw_text}</MonoBlock>
                {source.structured_summary && (
                  <p className="mt-2 whitespace-pre-wrap text-doc-sm text-ink-700">
                    <span className="doc-smallcaps mr-1 text-ink-500">resumo estruturado:</span>
                    {source.structured_summary}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DocumentBlock>
  );
}
