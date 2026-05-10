"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import type { HandoffNote, PrescriptionReview } from "@/types/domain";
import { MetaLine, QuietButton } from "@/components/ui";
import { formatDateTimeBR } from "@/lib/utils/format";

// ─── Shared card shell ─────────────────────────────────────────────────────────

function CardShell({
  title,
  meta,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  meta: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-chip border border-paper-300">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-chip px-4 py-3 text-left transition-colors hover:bg-paper-50"
      >
        <span className="font-serif text-doc-base text-ink-800">{title}</span>
        <span className="font-sans text-doc-xs text-ink-400">{isOpen ? "↑ fechar" : "↓ expandir"}</span>
      </button>

      {isOpen && (
        <div className="border-t border-paper-200 px-4 py-3">
          <MetaLine className="mb-3 not-italic">{meta}</MetaLine>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Passagem de plantão ────────────────────────────────────────────────────────

type HandoffArtifactCardProps = {
  initial: HandoffNote | null;
  generateAction: () => Promise<void>;
};

export function HandoffArtifactCard({ initial, generateAction }: HandoffArtifactCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editable, setEditable] = useState(initial?.body ?? "");
  const lastIdRef = useRef<string | null>(initial?.id ?? null);

  useEffect(() => {
    const id = initial?.id ?? null;
    if (id && id !== lastIdRef.current) {
      setEditable(initial?.body ?? "");
      lastIdRef.current = id;
    }
  }, [initial?.id, initial?.body]);

  const handleGenerate = () => {
    startTransition(async () => {
      await generateAction();
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

  const meta = initial
    ? `gerada em ${formatDateTimeBR(initial.generated_at)} · ${initial.provider}${initial.model ? " · " + initial.model : ""}`
    : "passagem ainda não gerada";

  return (
    <CardShell title="Passagem de plantão" meta={meta} isOpen={isOpen} onToggle={() => setIsOpen((v) => !v)}>
      <div className="mb-3 flex items-center justify-end gap-2">
        <QuietButton
          onClick={handleGenerate}
          disabled={isPending}
          variant="primary"
          className="text-doc-xs"
        >
          {isPending ? "gerando…" : initial ? "Regenerar" : "Gerar passagem"}
        </QuietButton>
        {editable && (
          <QuietButton onClick={handleCopy} className="text-doc-xs">
            Copiar
          </QuietButton>
        )}
      </div>
      {editable ? (
        <textarea
          value={editable}
          onChange={(e) => setEditable(e.target.value)}
          className="doc-mono w-full min-h-[240px] rounded-chip border border-paper-300 bg-paper-50 p-4 text-doc-sm leading-relaxed text-ink-800 focus:border-sepia-500 focus:outline-none"
        />
      ) : (
        <p className="text-doc-sm italic text-ink-500">
          Clique em &quot;Gerar passagem&quot; para criar a partir das fontes do leito.
        </p>
      )}
    </CardShell>
  );
}

// ─── Resumo para família ────────────────────────────────────────────────────────

type FamilySummaryResult = {
  body: string;
  cited: string[];
  provider: string;
  model: string | null;
};

type FamilyArtifactCardProps = {
  generateAction: () => Promise<FamilySummaryResult>;
};

export function FamilyArtifactCard({ generateAction }: FamilyArtifactCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editable, setEditable] = useState("");
  const [provider, setProvider] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateAction();
      setEditable(result.body);
      setProvider(result.provider);
      setModel(result.model);
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

  const meta = provider
    ? `gerado agora · ${provider}${model ? " · " + model : ""}`
    : "resumo ainda não gerado";

  return (
    <CardShell title="Resumo para família" meta={meta} isOpen={isOpen} onToggle={() => setIsOpen((v) => !v)}>
      <div className="mb-3 flex items-center justify-end gap-2">
        <QuietButton
          onClick={handleGenerate}
          disabled={isPending}
          variant="primary"
          className="text-doc-xs"
        >
          {isPending ? "gerando…" : editable ? "Regenerar" : "Gerar resumo"}
        </QuietButton>
        {editable && (
          <QuietButton onClick={handleCopy} className="text-doc-xs">
            Copiar
          </QuietButton>
        )}
      </div>
      {editable ? (
        <textarea
          value={editable}
          onChange={(e) => setEditable(e.target.value)}
          className="doc-mono w-full min-h-[240px] rounded-chip border border-paper-300 bg-paper-50 p-4 text-doc-sm leading-relaxed text-ink-800 focus:border-sepia-500 focus:outline-none"
        />
      ) : (
        <p className="text-doc-sm italic text-ink-500">
          Clique em &quot;Gerar resumo&quot; para criar texto em linguagem leiga para a família.
        </p>
      )}
    </CardShell>
  );
}

// ─── Checklist de revisão de prescrição ────────────────────────────────────────

type PrescriptionArtifactCardProps = {
  initial: PrescriptionReview | null;
  generateAction: () => Promise<void>;
};

export function PrescriptionArtifactCard({ initial, generateAction }: PrescriptionArtifactCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const lastIdRef = useRef<string | null>(initial?.id ?? null);

  useEffect(() => {
    const id = initial?.id ?? null;
    if (id && id !== lastIdRef.current) {
      lastIdRef.current = id;
    }
  }, [initial?.id]);

  const handleGenerate = () => {
    startTransition(async () => {
      await generateAction();
    });
  };

  const meta = initial
    ? `gerado em ${formatDateTimeBR(initial.generated_at)} · ${initial.provider}${initial.model ? " · " + initial.model : ""} · apoio à revisão, não prescritivo`
    : "checklist ainda não gerado";

  return (
    <CardShell
      title="Checklist de revisão de prescrição"
      meta={meta}
      isOpen={isOpen}
      onToggle={() => setIsOpen((v) => !v)}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-doc-xs text-clinical-warn">
          Apoio à revisão. NÃO emite prescrição. Valide no prontuário oficial.
        </p>
        <QuietButton
          onClick={handleGenerate}
          disabled={isPending}
          variant="primary"
          className="shrink-0 text-doc-xs"
        >
          {isPending ? "gerando…" : initial ? "Atualizar" : "Gerar checklist"}
        </QuietButton>
      </div>

      {!initial || initial.items.length === 0 ? (
        <p className="text-doc-sm italic text-ink-500">
          Adicione fontes (prescrição, evolução, ATB) e clique em &quot;Gerar checklist&quot;.
        </p>
      ) : (
        <table className="w-full border-collapse text-doc-sm">
          <thead>
            <tr className="border-b border-paper-300 text-left">
              <th className="py-2 pr-3 doc-smallcaps font-sans text-doc-xs text-ink-500">Categoria</th>
              <th className="py-2 pr-3 doc-smallcaps font-sans text-doc-xs text-ink-500">Status nas fontes</th>
              <th className="py-2 doc-smallcaps font-sans text-doc-xs text-ink-500">Lacuna / confirmar</th>
            </tr>
          </thead>
          <tbody>
            {initial.items.map((item, idx) => (
              <tr key={`${item.category}-${idx}`} className="border-b border-paper-200 align-top">
                <td className="py-2 pr-3 font-serif text-ink-900">{item.category}</td>
                <td className="py-2 pr-3 text-ink-700">{item.known_status || "—"}</td>
                <td className="py-2 text-ink-600">{item.gap || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CardShell>
  );
}
