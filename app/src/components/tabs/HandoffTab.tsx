"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  DocumentBlock,
  EmptyHint,
  MetaLine,
  MonoBlock,
  QuietButton,
} from "@/components/ui";
import type { HandoffNote } from "@/types/domain";

type Props = {
  initial: HandoffNote | null;
  generateAction: () => Promise<void>;
};

export function HandoffTab({ initial, generateAction }: Props) {
  const [editable, setEditable] = useState<string>(initial?.body ?? "");
  const [isPending, startTransition] = useTransition();
  const lastSyncedIdRef = useRef<string | null>(initial?.id ?? null);

  // Sincroniza o textarea quando uma NOVA HandoffNote chega (id mudou).
  // Edições manuais do médico são preservadas até a próxima regeneração.
  useEffect(() => {
    const incomingId = initial?.id ?? null;
    if (incomingId && incomingId !== lastSyncedIdRef.current) {
      setEditable(initial?.body ?? "");
      lastSyncedIdRef.current = incomingId;
    }
  }, [initial?.id, initial?.body]);

  const handleGenerate = () => {
    startTransition(async () => {
      await generateAction();
      // revalidatePath na server action retorna nova `initial` via re-render do RSC pai;
      // o useEffect acima detecta o id novo e sincroniza o textarea automaticamente.
    });
  };

  const handleCopy = async () => {
    if (!editable) return;
    try {
      await navigator.clipboard.writeText(editable);
    } catch {
      // ignore
    }
  };

  return (
    <DocumentBlock
      title="Passagem de plantão"
      meta={
        initial
          ? `gerada em ${initial.generated_at.toLocaleString("pt-BR")}`
          : "passagem ainda não gerada"
      }
      actions={
        <div className="flex gap-2">
          <QuietButton onClick={handleGenerate} disabled={isPending} variant="primary" className="text-doc-xs">
            {isPending ? "gerando…" : initial ? "Regenerar" : "Gerar passagem"}
          </QuietButton>
          {editable && (
            <QuietButton onClick={handleCopy} className="text-doc-xs">
              Copiar
            </QuietButton>
          )}
        </div>
      }
    >
      <MetaLine className="not-italic mb-2">
        Padrão fixo do plantão. Edite o texto antes de copiar.
      </MetaLine>
      {!editable ? (
        <EmptyHint>Clique em &quot;Gerar passagem&quot; — ela usará a ficha viva e as fontes do leito.</EmptyHint>
      ) : (
        <textarea
          value={editable}
          onChange={(e) => setEditable(e.target.value)}
          className="doc-mono w-full min-h-[280px] rounded-chip border border-paper-300 bg-paper-50 p-4 text-doc-sm leading-relaxed text-ink-800 focus:border-sepia-500"
        />
      )}
      {initial && (
        <details className="mt-4">
          <summary className="cursor-pointer doc-smallcaps text-doc-xs text-ink-500">
            ver versão original gerada
          </summary>
          <MonoBlock className="mt-2 text-doc-xs">{initial.body}</MonoBlock>
        </details>
      )}
    </DocumentBlock>
  );
}
