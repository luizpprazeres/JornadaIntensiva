"use client";

import { useState, useTransition } from "react";

import type { CaseQuestion } from "@/types/domain";
import {
  DocumentBlock,
  FieldGroup,
  MetaLine,
  MonoBlock,
  QuietButton,
  SectionDivider,
  TextArea,
} from "@/components/ui";

type Props = {
  initialHistory: CaseQuestion[];
  askAction: (
    question: string,
  ) => Promise<{
    answer: string;
    cited: string[];
    provider: string;
    model: string | null;
    questionId: string;
  }>;
  deleteAction: (questionId: string) => Promise<void>;
};

export function AskCaseTab({ initialHistory, askAction, deleteAction }: Props) {
  const [question, setQuestion] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [history, setHistory] = useState<CaseQuestion[]>(initialHistory);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setError(null);
    const q = question.trim();
    startTransition(async () => {
      try {
        const result = await askAction(q);
        const newItem: CaseQuestion = {
          id: result.questionId,
          patient_case_id: "",
          question: q,
          answer: result.answer,
          cited_source_ids: result.cited,
          provider: result.provider,
          model: result.model,
          asked_at: new Date(),
        };
        setHistory((prev) => [newItem, ...prev]);
        setQuestion("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao consultar o caso");
      }
    });
  };

  const handleDelete = (questionId: string) => {
    startDeleteTransition(async () => {
      await deleteAction(questionId);
      setHistory((prev) => prev.filter((item) => item.id !== questionId));
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

      {history.length > 0 && <SectionDivider label="histórico" />}

      <ul className="space-y-6">
        {history.map((item) => (
          <li key={item.id} className="border-l-2 border-paper-300 pl-4">
            <div className="flex items-start justify-between gap-2">
              <p className="doc-smallcaps text-doc-xs text-ink-500">PERGUNTA</p>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={isDeleting}
                className="shrink-0 text-doc-xs text-ink-400 hover:text-clinical-alert transition-colors disabled:opacity-40"
              >
                remover
              </button>
            </div>
            <p className="font-serif text-doc-base text-ink-900">{item.question}</p>

            <p className="mt-3 doc-smallcaps text-doc-xs text-ink-500">RESPOSTA</p>
            <MonoBlock className="text-doc-sm">{item.answer}</MonoBlock>

            {item.cited_source_ids.length > 0 && (
              <MetaLine className="mt-2">
                Fontes citadas:{" "}
                {item.cited_source_ids.map((id) => (
                  <code key={id} className="ml-1 doc-mono text-doc-xs">
                    #{id}
                  </code>
                ))}
              </MetaLine>
            )}

            <p className="mt-1 text-doc-xs italic text-ink-400">
              {item.provider}
              {item.model ? ` · ${item.model}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </DocumentBlock>
  );
}
