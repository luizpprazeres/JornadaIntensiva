"use client";

import { useState, useTransition } from "react";

import type { IngestedFragment, SourceDocument, SourceType } from "@/types/domain";
import { SOURCE_TYPES, SOURCE_TYPE_LABELS } from "@/types/domain";
import {
  DocumentBlock,
  MarkChip,
  MetaLine,
  MonoBlock,
  QuietButton,
  SectionDivider,
  Select,
} from "@/components/ui";
import { formatDateTimeBR } from "@/lib/utils/format";

// ─── Types ─────────────────────────────────────────────────────────────────────

type IngestActionResult = {
  fragments: IngestedFragment[];
  summary: string;
  provider: string;
  model: string | null;
};

type Props = {
  existingSources: SourceDocument[];
  ingestAction: (rawText: string) => Promise<IngestActionResult>;
  confirmAction: (fragments: IngestedFragment[]) => Promise<{ ok: true; count: number }>;
  deleteSourceAction: (sourceId: string) => Promise<void>;
};

// ─── Editable fragment state ────────────────────────────────────────────────────

type EditableFragment = {
  source_type: SourceType;
  raw_text: string;
  title: string | null;
  confidence: number;
  rationale: string | null;
  datetimeStr: string;
  noDate: boolean;
};

function toEditableFragment(f: IngestedFragment): EditableFragment {
  return {
    source_type: f.source_type,
    raw_text: f.raw_text,
    title: f.title,
    confidence: f.confidence,
    rationale: f.rationale,
    datetimeStr: toDatetimeLocal(f.source_datetime),
    noDate: f.source_datetime === null,
  };
}

function toIngestedFragment(f: EditableFragment): IngestedFragment {
  return {
    source_type: f.source_type,
    raw_text: f.raw_text,
    title: f.title,
    confidence: f.confidence,
    rationale: f.rationale,
    source_datetime: f.noDate ? null : fromDatetimeLocal(f.datetimeStr),
  };
}

function toDatetimeLocal(date: Date | null): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function previewLines(text: string, max = 4): string {
  return text.split("\n").slice(0, max).join("\n");
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function IngestTab({
  existingSources,
  ingestAction,
  confirmAction,
  deleteSourceAction,
}: Props) {
  const [rawText, setRawText] = useState("");
  const [isProcessing, startProcessing] = useTransition();
  const [isConfirming, startConfirming] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const [preview, setPreview] = useState<Omit<IngestActionResult, "fragments"> | null>(null);
  const [editedFragments, setEditedFragments] = useState<EditableFragment[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Process ──

  const handleProcess = () => {
    if (!rawText.trim()) return;
    setError(null);
    setFeedback(null);
    setPreview(null);
    setEditedFragments([]);

    startProcessing(async () => {
      try {
        const result = await ingestAction(rawText.trim());
        setPreview({ summary: result.summary, provider: result.provider, model: result.model });
        setEditedFragments(result.fragments.map(toEditableFragment));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao processar o texto");
      }
    });
  };

  // ── Confirm ──

  const handleConfirm = () => {
    startConfirming(async () => {
      try {
        const fragments = editedFragments.map(toIngestedFragment);
        const result = await confirmAction(fragments);
        setFeedback(`${result.count} ${result.count === 1 ? "fonte adicionada" : "fontes adicionadas"}. Ficha atualizada.`);
        setRawText("");
        setPreview(null);
        setEditedFragments([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar as fontes");
      }
    });
  };

  const handleCancel = () => {
    setPreview(null);
    setEditedFragments([]);
    setError(null);
  };

  // ── Fragment editing helpers ──

  const updateFragment = (idx: number, patch: Partial<EditableFragment>) => {
    setEditedFragments((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const removeFragment = (idx: number) => {
    setEditedFragments((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Source delete ──

  const handleDeleteSource = (sourceId: string) => {
    startDeleting(async () => {
      await deleteSourceAction(sourceId);
    });
  };

  const hasPreview = preview !== null && editedFragments.length > 0;

  return (
    <DocumentBlock
      title="Adicionar ao leito"
      meta="cole qualquer texto — passagem, evolução, exame, observação ou tudo misturado"
    >
      {/* ── Paste area ── */}
      <div className="space-y-3">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={isProcessing || hasPreview}
          rows={10}
          placeholder="Cole aqui qualquer informação deste leito — passagem, evolução, exame, observação solta, ou tudo misturado. A IA classifica e organiza."
          className="w-full min-h-[200px] resize-y rounded-chip border border-paper-300 bg-paper-50 px-3 py-2 font-sans text-doc-base text-ink-800 placeholder:text-paper-400 hover:border-paper-400 focus:border-sepia-500 focus:bg-paper-100 focus:outline-none leading-relaxed disabled:opacity-60"
        />

        {!hasPreview && (
          <div className="flex justify-end">
            <QuietButton
              type="button"
              variant="primary"
              onClick={handleProcess}
              disabled={isProcessing || !rawText.trim()}
            >
              {isProcessing ? "IA processando…" : "Processar"}
            </QuietButton>
          </div>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="mt-3 text-doc-sm text-clinical-alert">Erro: {error}</p>
      )}

      {/* ── Feedback after confirm ── */}
      {feedback && (
        <p className="mt-3 text-doc-sm text-clinical-ok">{feedback}</p>
      )}

      {/* ── Preview block ── */}
      {hasPreview && (
        <div className="mt-4 space-y-4">
          <div className="rounded-chip border border-paper-200 bg-paper-50/60 px-4 py-3">
            <p className="text-doc-xs italic text-ink-500">
              {preview!.summary}
              <span className="ml-2 not-italic text-ink-400">
                · {preview!.provider}
                {preview!.model ? ` · ${preview!.model}` : ""}
              </span>
            </p>
          </div>

          <ul className="space-y-4">
            {editedFragments.map((frag, idx) => (
              <li
                key={idx}
                className="rounded-chip border border-paper-200 px-4 py-3 space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <Select
                    value={frag.source_type}
                    onChange={(e) =>
                      updateFragment(idx, { source_type: e.target.value as SourceType })
                    }
                    className="text-doc-xs min-h-[36px] w-auto"
                  >
                    {SOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {SOURCE_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </Select>

                  {frag.confidence < 0.6 && (
                    <MarkChip tone="warn">revisar</MarkChip>
                  )}

                  <button
                    type="button"
                    onClick={() => removeFragment(idx)}
                    className="shrink-0 text-doc-xs text-ink-400 hover:text-clinical-alert transition-colors"
                  >
                    remover esta peça
                  </button>
                </div>

                {/* Date row */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 font-sans text-doc-xs text-ink-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={frag.noDate}
                      onChange={(e) => updateFragment(idx, { noDate: e.target.checked })}
                      className="accent-sepia-600"
                    />
                    sem data
                  </label>
                  {!frag.noDate && (
                    <input
                      type="datetime-local"
                      value={frag.datetimeStr}
                      onChange={(e) => updateFragment(idx, { datetimeStr: e.target.value })}
                      className="rounded-chip border border-paper-300 bg-paper-50 px-2 py-1 font-sans text-doc-xs text-ink-800 hover:border-paper-400 focus:border-sepia-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Text preview */}
                <div className="overflow-hidden rounded-chip">
                  <MonoBlock className="text-doc-xs leading-snug">
                    {previewLines(frag.raw_text)}
                    {frag.raw_text.split("\n").length > 4 && (
                      <span className="text-ink-400"> …</span>
                    )}
                  </MonoBlock>
                </div>

                {/* Rationale */}
                {frag.rationale && (
                  <p className="text-doc-xs text-ink-400 italic">{frag.rationale}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <QuietButton
              type="button"
              variant="primary"
              onClick={handleConfirm}
              disabled={isConfirming || editedFragments.length === 0}
            >
              {isConfirming
                ? "salvando…"
                : `Confirmar e salvar (${editedFragments.length} ${editedFragments.length === 1 ? "peça" : "peças"})`}
            </QuietButton>
            <QuietButton type="button" onClick={handleCancel} disabled={isConfirming}>
              Cancelar
            </QuietButton>
          </div>
        </div>
      )}

      {/* ── Existing sources list ── */}
      <SectionDivider label={`Fontes registradas (${existingSources.length})`} />

      {existingSources.length === 0 ? (
        <p className="text-doc-sm italic text-ink-500">Nenhuma fonte registrada neste leito.</p>
      ) : (
        <ul className="space-y-4">
          {existingSources.map((src) => {
            const hasMore = src.raw_text.split("\n").length > 5;
            return (
              <li key={src.id} className="border-l-2 border-paper-300 pl-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <MarkChip>{SOURCE_TYPE_LABELS[src.source_type]}</MarkChip>
                    <MetaLine className="not-italic">
                      {formatDateTimeBR(src.source_datetime ?? src.created_at)}
                    </MetaLine>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSource(src.id)}
                    disabled={isDeleting}
                    className="shrink-0 text-doc-xs text-ink-400 hover:text-clinical-alert transition-colors disabled:opacity-40"
                  >
                    remover
                  </button>
                </div>

                {src.title && (
                  <p className="mt-1 font-serif text-doc-base text-ink-800">{src.title}</p>
                )}

                <details className="mt-2">
                  <summary className="cursor-pointer font-sans text-doc-xs text-ink-400 hover:text-ink-600 transition-colors list-none">
                    {hasMore ? `ver texto (${src.raw_text.split("\n").length} linhas)` : "ver texto"}
                  </summary>
                  <MonoBlock className="mt-2 text-doc-xs">{src.raw_text}</MonoBlock>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </DocumentBlock>
  );
}
