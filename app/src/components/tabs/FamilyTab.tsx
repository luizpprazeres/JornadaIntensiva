"use client";

import { useState, useTransition } from "react";

import { DocumentBlock, EmptyHint, MetaLine, QuietButton } from "@/components/ui";

type GenerateResult = { body: string; cited: string[]; provider: string; model: string | null };

type Props = {
  generateAction: () => Promise<GenerateResult>;
};

export function FamilyTab({ generateAction }: Props) {
  const [text, setText] = useState<string>("");
  const [cited, setCited] = useState<string[]>([]);
  const [providerLabel, setProviderLabel] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateAction();
        setText(result.body);
        setCited(result.cited);
        setProviderLabel(result.model ? `${result.provider} · ${result.model}` : result.provider);
        setGeneratedAt(new Date());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao gerar resumo familiar");
      }
    });
  };

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <DocumentBlock
      title="Resumo para família"
      meta={
        generatedAt
          ? `gerado às ${generatedAt.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}${providerLabel ? ` · ${providerLabel}` : ""}`
          : "ainda não gerado nesta sessão"
      }
      actions={
        <div className="flex gap-2">
          <QuietButton onClick={handleGenerate} disabled={isPending} variant="primary" className="text-doc-xs">
            {isPending ? "gerando…" : text ? "Regenerar" : "Gerar resumo"}
          </QuietButton>
          {text && (
            <QuietButton onClick={handleCopy} className="text-doc-xs">
              Copiar
            </QuietButton>
          )}
        </div>
      }
    >
      <MetaLine className="not-italic mb-2">
        Linguagem leiga, honesta, sem termos técnicos não traduzidos. Edite antes de usar.
      </MetaLine>
      {error && <p className="mb-3 text-doc-sm text-clinical-alert">Erro: {error}</p>}
      {!text ? (
        <EmptyHint>Clique em &quot;Gerar resumo&quot;.</EmptyHint>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[260px] rounded-chip border border-paper-300 bg-paper-50 p-4 font-serif text-doc-base leading-relaxed text-ink-800 focus:border-sepia-500"
          />
          {cited.length > 0 && (
            <p className="mt-2 text-doc-xs italic text-ink-400">
              Fontes citadas:{" "}
              {cited.map((id) => (
                <code key={id} className="ml-1 doc-mono text-doc-xs">#{id}</code>
              ))}
            </p>
          )}
        </>
      )}
    </DocumentBlock>
  );
}
