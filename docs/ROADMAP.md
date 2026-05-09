# Roadmap — Jornada Intensiva

> Plano de evolução do MVP até versão clinicamente útil em produção pessoal.

**Versão:** 0.1
**Última atualização:** 2026-05-09

---

## Filosofia

O produto evolui seguindo **3 portões**:
1. **Fluxo confiável** — médico consegue operar a UTI no app sem fricção.
2. **Inteligência real** — substituir heurísticas por LLM + RAG por leito.
3. **Captura sem digitação** — OCR, voz, automações.

Cada fase só inicia quando a fase anterior atingiu **uso real** (não apenas implementação completa). Métrica de promoção é qualitativa: o médico consegue plantar 3 plantões reais (anonimizados em tempo real, sem dados identificáveis no banco) usando exclusivamente a fase atual.

---

## Fase 1 — MVP documental (escopo atual)

**Status:** em construção
**Objetivo:** o médico cola textos por leito e gera passagem/ficha/checklist com aparência discreta de prontuário.

### Entregáveis
- [ ] PRD, ARCHITECTURE, ROADMAP, DESIGN_DIRECTION (este doc set)
- [ ] App Next.js + TS + Tailwind funcionando local
- [ ] Modelo de dados (Drizzle + SQLite) com 7 tabelas
- [ ] Repositórios + Server Actions
- [ ] Camada `lib/ai/heuristic.ts` (geração simulada, sem LLM)
- [ ] 7 prompts MD (consumidos só na Fase 2, mas escritos agora)
- [ ] 3 telas principais (Plantões, Central, Leito 9 abas)
- [ ] Mocks anônimos: 1 plantão, 4 leitos com fontes plausíveis
- [ ] README com instruções de execução local
- [ ] Banner permanente "DEV — não usar dados reais"

### Critério de promoção para Fase 2
1. App roda local em mobile (Safari iOS / Chrome Android) sem layout quebrado.
2. Adicionar uma fonte → ver na ficha viva em <5 segundos.
3. Gerar passagem produz texto editável no padrão definido.
4. Médico operou 1 plantão simulado completo (mock-only) sem travar.

---

## Fase 2 — Inteligência real

**Status:** planejado
**Objetivo:** swap das heurísticas por LLM real, com retrieval restrito ao leito.

### Funcionalidades

- **F2.1** — `lib/ai/llm.ts` implementando a mesma `ClinicalAI` interface, consumindo prompts MD.
- **F2.2** — Provider plugável via env (`AI_PROVIDER=anything-llm | openai | anthropic | ollama-local`).
- **F2.3** — Embeddings por `SourceDocument` ao inserir/atualizar.
- **F2.4** — Retrieval com filtro estrutural `patient_case_id` (top-k chunks do mesmo leito).
- **F2.5** — Respostas com **citação por id de fonte** (`SourceDocument.id` + `source_type` + `source_datetime`).
- **F2.6** — Streaming de geração para `Resumo`, `Passagem`, `Família` e `Perguntar ao caso`.
- **F2.7** — Histórico de Q&A por leito (`case_questions`).
- **F2.8** — Histórico de versões de `ClinicalSnapshot` (auditoria).
- **F2.9** — Detecção automática de divergências entre fontes ("noradrenalina ainda em uso?" — duas fontes contraditórias sinalizadas).

### Stack adicional
- pgvector (se Postgres) ou Lance/Chroma local (se ainda em SQLite).
- Provider client (OpenAI/Anthropic/AnythingLLM HTTP API).
- Cache de prompts (lru-cache).

### Critério de promoção para Fase 3
1. LLM gera ficha viva com qualidade ≥ heurística manual em 80% dos casos.
2. Citação de fonte aparece em 100% das respostas.
3. Latência <3s para snapshot, <8s para passagem.

---

## Fase 3 — Captura sem digitação

**Status:** planejado
**Objetivo:** reduzir o atrito de inserir fontes — OCR, voz, paste de prints.

### Funcionalidades

- **F3.1** — Upload de imagem/print (foto da prescrição, screenshot do laboratório).
- **F3.2** — OCR (Tesseract local, AWS Textract ou API hospitalar) para extrair texto.
- **F3.3** — Classificação automática da fonte (LLM classifica `source_type` a partir do texto extraído).
- **F3.4** — Ditado por voz → `SourceDocument` tipo `physician_note`.
- **F3.5** — Atalho mobile "Adicionar rapidamente" via Web Share Target API (compartilhar print do whatsapp do plantão direto pro app).
- **F3.6** — Camera nativa via PWA: tirar foto de prancheta → OCR → fonte.

### Critério de promoção para Fase 4
1. ≥70% das fontes em um plantão são adicionadas sem digitação.
2. Acurácia de OCR clínico ≥90% nos campos críticos (Hb, Plq, Cr, Na, K).
3. Classificação automática de `source_type` ≥85% acerto.

---

## Fase 4 — Multiusuário, autenticação e segurança real

**Status:** planejado
**Objetivo:** preparar para uso institucional (mesmo que pessoal continue sendo o caso de uso primário).

### Funcionalidades

- **F4.1** — Migração SQLite → Postgres/Supabase.
- **F4.2** — Auth (magic link, OAuth Google).
- **F4.3** — Multi-usuário com permissões por plantão.
- **F4.4** — Modo seguro: encryption-at-rest, mascaramento configurável de identificadores.
- **F4.5** — Audit log (quem viu/gerou/editou o quê).
- **F4.6** — Backup automático do banco.
- **F4.7** — Self-hosting docker-compose pronto.

---

## Fase 5 — Longitudinal e analytics pessoal

**Status:** ideia
**Objetivo:** fechar o ciclo de aprendizado clínico do médico.

### Funcionalidades

- **F5.1** — Histórico longitudinal por paciente cross-shift.
- **F5.2** — Resumo de evolução semanal automático.
- **F5.3** — Indicadores pessoais (quantos pacientes/plantão, principais diagnósticos).
- **F5.4** — Exportação de passagem (PDF, copy-formatado).
- **F5.5** — Modo "rever caso" para estudo posterior.

---

## Fora do escopo permanente

Itens que não pretendem ser do produto:

- Substituir prontuário oficial.
- Integração com prontuário eletrônico do hospital (escopo institucional, fora de uso pessoal).
- Prescrição autônoma.
- Comunicação direta com paciente/família via app.
- Decisão clínica automatizada.
- Treinamento de modelo proprietário.
- Marketplace, multi-tenant SaaS.

---

## Métricas de cada fase

| Fase | Métrica primária                                                      | Métrica de risco                                  |
|------|-----------------------------------------------------------------------|---------------------------------------------------|
| 1    | Tempo de adicionar fonte <15s no mobile                                | 0 ocorrências de mistura entre pacientes           |
| 2    | Latência de passagem <8s; citação 100%                                  | 0 fabricações detectadas em sample mensal          |
| 3    | ≥70% de fontes sem digitação                                            | OCR não confunde unidades (mg vs g, mEq/L)         |
| 4    | Auth + RLS validados em pen-test pessoal                                | 0 vazamentos de leito entre usuários                |
| 5    | Tempo médio para "rever caso" antigo <30s                               | Histórico não vaza entre pacientes                 |
