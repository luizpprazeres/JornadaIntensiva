# Architecture — Jornada Intensiva

> Arquitetura da Fase 1 (MVP). Otimizada para **simplicidade**, **isolamento por leito** e **migração futura** para Postgres/Supabase + RAG real, sem retrabalho.

**Versão:** 0.1
**Última atualização:** 2026-05-09

---

## 1. Stack

| Camada              | Escolha                          | Razão                                                                  |
|---------------------|----------------------------------|------------------------------------------------------------------------|
| Frontend / SSR      | **Next.js 15 (App Router) + React 19** | Mobile-first, Server Actions, edge-friendly, ecosistema TS sólido    |
| Linguagem           | **TypeScript 5.7 strict**        | Tipagem forte é defesa contra bug clínico                              |
| Estilo              | **Tailwind 3.4** com tokens custom | Sistema documental controlado por design tokens; sem componentes prontos vistosos |
| Persistência local  | **SQLite via better-sqlite3**    | Embedded, zero infra, WAL para concorrência leve, performance excelente |
| ORM                 | **Drizzle ORM**                  | Schema TS-first, migrações simples, mesma API para SQLite/Postgres     |
| Validação           | **Zod**                          | Schemas reusáveis em forms, server actions e camada de IA              |
| IDs                 | **nanoid (21 chars)**            | URL-safe, colisão improvável, sem dependência de UUID v4               |
| Datas               | **date-fns**                     | Tree-shakeable, locale pt-BR                                           |
| Empacotamento       | **next** standard build          | Zero customização desnecessária na Fase 1                              |

**Não-escolhas conscientes:**
- Sem React Query (Server Actions + revalidatePath cobrem o MVP).
- Sem Redux/Zustand (nada justifica estado client-only complexo).
- Sem auth provider (estrutura preparada, mas vazia na Fase 1).
- Sem framework de UI (shadcn/Radix etc.) — design system documental é proprietário e enxuto.

## 2. Princípios arquiteturais

1. **Isolamento por `patient_case_id`** é regra estrutural, não convenção. Toda função de IA, todo repo, toda query usa o id como filtro obrigatório.
2. **Server-first.** Páginas são Server Components por padrão; Client Components só quando há interação local (forms, copy-to-clipboard, abas).
3. **Server Actions** são a única via de mutação. Sem REST/GraphQL na Fase 1.
4. **Repositórios funcionais** (sem classes) → testáveis, fáceis de mockar.
5. **Abstração de IA é bordada na camada `lib/ai/*`.** A Fase 1 implementa heurísticas; trocar por LLM real = trocar arquivo.
6. **Schema = fonte de verdade.** Types do domínio são derivados (mentalmente) do `schema.ts`; mas `types/domain.ts` é mantido espelhado para uso fora do servidor.
7. **Tudo em PT-BR** (UI, prompts, mensagens), com nomes técnicos em inglês (campos, types, ids) para legibilidade de código.

## 3. Estrutura de pastas

```
jornada-intensiva/
├── docs/                       # PRD, ARCHITECTURE, ROADMAP, DESIGN_DIRECTION
├── prompts/                    # 7 prompts MD (consumidos por lib/prompts)
├── references/
│   └── anything-llm/           # Clone read-only para consulta arquitetural
└── app/                        # Next.js
    ├── public/
    ├── src/
    │   ├── app/                # App Router
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                          # Tela 1 — lista de plantões
    │   │   ├── shifts/
    │   │   │   └── [shiftId]/
    │   │   │       ├── page.tsx                  # Tela 2 — central
    │   │   │       └── beds/
    │   │   │           └── [bedId]/
    │   │   │               ├── page.tsx          # Tela 3 — leito (abas)
    │   │   │               └── (tabs)/...
    │   │   └── (actions)/
    │   │       ├── shift-actions.ts
    │   │       ├── bed-actions.ts
    │   │       ├── source-actions.ts
    │   │       └── ai-actions.ts
    │   ├── components/
    │   │   ├── ui/             # primitivos documentais (Sheet, Document, FieldGroup)
    │   │   ├── shell/          # layout-shell discreto (header, footer)
    │   │   └── tabs/           # 9 componentes de aba (1 por aba)
    │   ├── lib/
    │   │   ├── db/             # client.ts + schema.ts + seed.ts
    │   │   ├── repos/          # 1 arquivo por entidade ou index.ts agregador
    │   │   ├── ai/             # interface + impl simulada
    │   │   ├── prompts/        # loader que lê /prompts/*.md
    │   │   └── utils/          # cn, dates, formatters clínicos (LAB)
    │   ├── types/
    │   │   └── domain.ts
    │   └── mocks/
    │       └── seed-data.ts    # 1 plantão + 4 leitos com fontes anônimas
    ├── drizzle/                # migrations geradas
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── drizzle.config.ts
    └── tsconfig.json
```

## 4. Modelo de dados (resumo)

Detalhamento completo dos campos: ver `PRD.md §7` e `src/types/domain.ts`.

### Tabelas e relações

```
shifts (1) ──────< patient_cases (N) ──────< source_documents (N)
                          │ (1)
                          ├─ (1) clinical_snapshots
                          ├─ (1..N) handoff_notes
                          ├─ (1..N) prescription_reviews
                          └─ (N) pending_items
```

### Convenções de schema

| Tipo de campo  | Mapeamento Drizzle SQLite                    |
|----------------|----------------------------------------------|
| Datas          | `integer({ mode: 'timestamp' })`             |
| Booleanos      | `integer({ mode: 'boolean' })`               |
| IDs            | `text('id').primaryKey().$defaultFn(nanoid)` |
| Foreign keys   | `text(...).references(...)` com `onDelete: 'cascade'` quando faz sentido (deletar leito apaga fontes) |
| Texto longo    | `text(...)` (SQLite armazena sem limite)     |
| JSON estruturado| `text({ mode: 'json' }).$type<...>()`       |

### `patient_case_id` como filtro estrutural

Toda função em `lib/repos/*` que toca `source_documents`, `clinical_snapshots`, `handoff_notes`, `prescription_reviews` ou `pending_items` recebe `patientCaseId` como **parâmetro obrigatório**, nunca opcional. Isso impede acidentes do tipo `listSources()` retornar todas as fontes do banco.

## 5. Camadas

### 5.1 Repositórios (`src/lib/repos/`)

- Funções puras async: `listShifts`, `createPatientCase`, `listSources(patientCaseId)`, etc.
- Validação de input via Zod no topo de cada `create*`/`update*`.
- Retornam tipos do domínio (`PatientCase`, `SourceDocument`, etc.), não rows do Drizzle.
- Sem efeitos colaterais além da escrita no SQLite.

### 5.2 Server Actions (`src/app/(actions)/`)

- Wrappers `'use server'` em volta dos repos.
- Adicionam `revalidatePath` apropriado.
- Disparam regenerações da camada de IA quando relevante (ex.: criar `SourceDocument` invalida o `ClinicalSnapshot` derivado).
- Tratam erros e retornam `{ ok, data | error }` para forms client-side.

### 5.3 Camada de IA (`src/lib/ai/`)

Interface estável:

```ts
export interface ClinicalAI {
  generateClinicalSnapshot(input: { patientCase: PatientCase; sources: SourceDocument[] }): Promise<ClinicalSnapshotInput>;
  generateHandoff(input: { patientCase: PatientCase; sources: SourceDocument[]; snapshot?: ClinicalSnapshot }): Promise<string>;
  generateFamilySummary(input: { patientCase: PatientCase; sources: SourceDocument[] }): Promise<string>;
  generatePrescriptionChecklist(input: { patientCase: PatientCase; sources: SourceDocument[] }): Promise<PrescriptionItem[]>;
  formatLaboratory(input: { sources: SourceDocument[] }): Promise<string>;     // formato LAB padrão
  formatControls24h(input: { sources: SourceDocument[] }): Promise<string>;
  askCase(input: { patientCase: PatientCase; sources: SourceDocument[]; question: string }): Promise<{ answer: string; cited: string[] }>;
}
```

**Implementação Fase 1 (`lib/ai/heuristic.ts`):**
- Recebe `SourceDocument[]` já filtrado pelo leito.
- Para cada verbo, concatena/anota os `raw_text` relevantes e aplica regras determinísticas:
  - **Snapshot:** extrai por regex/keywords os campos por sistema; o que não casa fica `"não informado"`.
  - **Handoff:** preenche o template fixo (Leito – Nome, idade ... Plano. Pendências.) usando o snapshot.
  - **Lab format:** parser simples por linha "Hb: 9.2", "Plq: 130", etc., produzindo a linha LAB.
  - **Controls 24h:** parser similar, com tabela.
  - **Family summary:** template em linguagem leiga consumindo o snapshot.
  - **Prescription checklist:** itera categorias fixas, indica se há menção nas fontes.
  - **Ask case:** busca substring/keywords na união de `raw_text` e retorna trecho + ids citados; quando vazio, retorna mensagem padrão "não encontrado nas fontes deste leito".

**Por que heurístico na Fase 1:**
- Não há custo de LLM, não há latência, não há key.
- O médico pode rodar 100% offline localmente.
- Comportamento previsível ajuda a validar o **fluxo** antes de validar a IA.
- A interface estável significa que swap por LLM real (Fase 2) é zero-mudança no consumidor.

**Implementação Fase 2 (`lib/ai/llm.ts` futura):**
- Mesma interface.
- Lê os prompts MD em `prompts/` e faz template fill.
- Provider plugável: AnythingLLM, OpenAI, Anthropic, RAGFlow, pgvector + embeddings.

### 5.4 Loader de prompts (`src/lib/prompts/`)

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROMPTS_DIR = join(process.cwd(), '..', 'prompts');

export function loadPrompt(name: 'handoff-summary' | 'laboratory-format' | ...): string {
  return readFileSync(join(PROMPTS_DIR, `${name}.md`), 'utf-8');
}
```

Os prompts ficam em `jornada-intensiva/prompts/` (fora do `app/`), centralizados, sem build-step.

### 5.5 UI (`src/components/`)

- **`ui/`** — primitivos documentais nomeados deliberadamente: `Sheet`, `DocumentBlock`, `FieldGroup`, `MetaLine`, `MarkChip`, `QuietButton`, `MonoBlock`, `SectionDivider`. **Nada se chama `Card`, `ChatBubble`, `Hero`.**
- **`shell/`** — `AppHeader` (linha simples com nome do app em serif + plantão atual), `BedRail` (lista discreta de leitos lateral em desktop / topo em mobile), `Footer` ínfimo.
- **`tabs/`** — 9 componentes, 1 por aba. Cada um recebe `patientCaseId` e `sources: SourceDocument[]` (ou snapshot, conforme aba).

### 5.6 Telas

- **`/`** — Lista de plantões (`shifts`), botão criar, link para abrir.
- **`/shifts/[shiftId]`** — Central do plantão. Lista de leitos (`patient_cases` ativos), botão criar leito, click abre leito.
- **`/shifts/[shiftId]/beds/[bedId]`** — Página do leito com 9 abas (rota subindo de `?tab=` por simplicidade no MVP).

## 6. Fluxo de dados — Exemplo: adicionar fonte e regenerar ficha

```
[UI form: SourceForm.tsx (client)]
        │ FormData: patient_case_id, source_type, raw_text, source_datetime?
        ▼
[Server Action: createSource]
        │ valida com Zod
        ▼
[Repo: sourceDocuments.createSource]
        │ INSERT em source_documents
        ▼
[Server Action: triggerSnapshotRegen (opcional, sync)]
        │ chama lib/ai/heuristic.generateClinicalSnapshot
        ▼
[Repo: snapshots.upsertSnapshot]
        │ INSERT/UPDATE clinical_snapshots
        ▼
revalidatePath('/shifts/[shiftId]/beds/[bedId]')
        │
        ▼
[Server Component: BedPage] re-renderiza ficha viva atualizada
```

A regeneração do snapshot é **síncrona e barata** (heurística pura) na Fase 1. Quando virar LLM real, vira fila / streaming.

## 7. Segurança e privacidade

| Tópico                        | Decisão Fase 1                                                                       |
|-------------------------------|-------------------------------------------------------------------------------------|
| Auth                          | Nenhuma. Uso pessoal local. Estrutura latente: `userId` opcional em `shifts`.       |
| Banco                         | Arquivo SQLite em `app/jornada-intensiva.db`, não versionado (.gitignore).         |
| Dados reais                   | **PROIBIDOS** em desenvolvimento. Banner permanente "DEV — NÃO INSERIR DADOS REAIS". |
| Logs                          | Sem persistência de payloads de IA além do snapshot estruturado.                    |
| Telemetria                    | Zero. Nenhuma chamada externa na Fase 1.                                            |
| Conexões externas             | Zero. Tudo local.                                                                   |
| LGPD                          | Fase 1 não é destinada a dados sensíveis reais; uso pessoal-experimental.            |

Quando dados reais forem inseridos (uso pós-Fase 1), o `ROADMAP` define encryption-at-rest, isolamento físico de banco, modo seguro, etc.

## 8. Testes

- **Unit (Vitest, opcional Fase 1):** funções de `lib/ai/heuristic.ts` (formatador LAB, parser controles, isolamento patient_case).
- **Integration:** server actions com banco SQLite in-memory.
- **Anti-regressão crítica:** teste que valida que `listSources(A)` jamais retorna documento de leito B.

## 9. Performance e mobile

- Páginas Server Components → JS mínimo no cliente.
- Tailwind purge agressivo via tokens próprios.
- Sem imagens decorativas.
- Sem fontes web pesadas — empilhar fonts do sistema + Inter local quando possível.
- Lighthouse mobile alvo: Performance ≥90, Acessibilidade ≥95.

## 10. Migração futura para Supabase / RAG real

| Componente atual            | Substituição planejada                                  | Complexidade     |
|-----------------------------|---------------------------------------------------------|------------------|
| `better-sqlite3`            | `@supabase/supabase-js` + Postgres                      | Baixa — mesma API Drizzle, dialect: `postgres` |
| `lib/ai/heuristic.ts`       | `lib/ai/llm.ts` consumindo prompts MD + provider        | Média — interface não muda  |
| Sem auth                    | Supabase Auth (magic link / OAuth)                      | Média            |
| `lib/repos/`                | Mesmo arquivo, talvez RLS no Postgres                   | Baixa            |
| Sem RAG                     | Embeddings em pgvector + retriever por `patient_case_id` | Média-alta       |

A escolha de Drizzle + interface estável de IA garante que Fase 1 → Fase 2 é incremento, não rewrite.

## 11. Inspirações arquiteturais (do AnythingLLM, sem copiar código)

| Conceito do AnythingLLM | Adaptação na Jornada Intensiva                              |
|--------------------------|-------------------------------------------------------------|
| `Workspace` isolado      | `PatientCase` (leito) é o workspace                         |
| `Threads` por workspace  | `SourceDocument[]` + Q&A history por leito                  |
| Provider abstraction     | `ClinicalAI` interface com impl swappable                   |
| Document collector       | (Fase 2) ingestor de imagens/PDFs/OCR                       |
| Vector DB por workspace  | (Fase 2) embeddings com filtro `patient_case_id`            |

## 12. Decisões pendentes (não bloqueantes)

- **D1:** Snapshot regenera automaticamente ao adicionar fonte? Proposta: **sim, sync** na Fase 1 (heurístico é instantâneo). Reavaliar com LLM real.
- **D2:** Histórico de versões do snapshot? Proposta: **não** na Fase 1. Adicionar em Fase 2 com `clinical_snapshots_history`.
- **D3:** Aba "Perguntar ao caso" persiste histórico? Proposta: **sim**, tabela leve `case_questions(id, patient_case_id, question, answer, cited_ids, asked_at)`. Adicionar se sobrar tempo no MVP, senão Fase 2.
- **D4:** Multi-plantão do mesmo paciente? Proposta: **fora do MVP**. Cada `Shift` é independente; reuso vem na Fase 2.
