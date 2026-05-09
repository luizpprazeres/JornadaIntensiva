"use client";

import { useState, useTransition } from "react";

import {
  DocumentBlock,
  FieldGroup,
  MetaLine,
  MonoBlock,
  QuietButton,
  SectionDivider,
  TextArea,
} from "@/components/ui";

type Result = { question: string; answer: string; cited: string[] };

type Props = {
  askAction: (question: string) => Promise<{ answer: string; cited: string[] }>;
};

export function AskCaseTab({ askAction }: Props) {
  const [question, setQuestion] = useState("");
  const [isPending, startTransition] = useTransition();
  const [history, setHistory] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setError(null);
    const q = question.trim();
    startTransition(async () => {
      try {
        const res = await askAction(q);
        setHistory((prev) => [{ question: q, answer: res.answer, cited: res.cited }, ...prev].slice(0, 10));
        setQuestion("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao consultar o caso");
      }
    });
  };

  return (
    <DocumentBlock
      title="Perguntar ao caso"
      meta="restrito às fontes do leito atual; sem cruzar pacientes"
    >
      <form onSubmit={handleSubmit} className="grid gap-3">
        <FieldGroup label="Pergunta" hint="Ex.: 'Qual foi a última hemoglobina?'">
          <TextArea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="Qual foi a última hemoglobina?"
            disabled={isPending}
          />
        </FieldGroup>
        <div className="flex justify-end">
          <QuietButton type="submit" variant="primary" disabled={isPending || !question.trim()}>
            {isPending ? "buscando…" : "Perguntar"}
          </QuietButton>
        </div>
      </form>

      {error && <p className="mt-3 text-doc-sm text-clinical-alert">Erro: {error}</p>}

      {history.length > 0 && <SectionDivider label="histórico desta sessão" />}

      <ul className="space-y-6">
        {history.map((item, idx) => (
          <li key={idx} className="border-l-2 border-paper-300 pl-4">
            <p className="doc-smallcaps text-doc-xs text-ink-500">PERGUNTA</p>
            <p className="font-serif text-doc-base text-ink-900">{item.question}</p>
            <p className="mt-3 doc-smallcaps text-doc-xs text-ink-500">RESPOSTA</p>
            <MonoBlock className="text-doc-sm">{item.answer}</MonoBlock>
            {item.cited.length > 0 && (
              <MetaLine className="mt-2">
                Fontes citadas:{" "}
                {item.cited.map((id) => (
                  <code key={id} className="ml-1 doc-mono text-doc-xs">
                    #{id}
                  </code>
                ))}
              </MetaLine>
            )}
          </li>
        ))}
      </ul>
    </DocumentBlock>
  );
}
