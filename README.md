# Jornada Intensiva

> Organizador documental clínico por leito para intensivistas — discreto, local e sem aparência de chatbot.

## Sobre

Plataforma pessoal onde o médico intensivista cola textos por leito (passagem, evolução, prescrição, laboratório, controles, observações) e gera automaticamente os artefatos que já produz manualmente: ficha viva do paciente, passagem de plantão, resumo familiar em linguagem leiga, checklist de revisão de prescrição e respostas a perguntas restritas àquele leito.

A unidade central é o **leito/paciente** — nenhuma operação cruza pacientes distintos. A interface tem estética de editor documental institucional, não de IA generativa. O banco de dados reside localmente; nenhum dado sai da máquina do médico.

## Arquitetura

- [PRD](docs/PRD.md) — requisitos de produto, personas, princípios e funcionalidades F1–F11
- [ARCHITECTURE](docs/ARCHITECTURE.md) — modelo de dados, camadas, decisões técnicas
- [ROADMAP](docs/ROADMAP.md) — fases de evolução (MVP → LLM real → captura → multiusuário)
- [DESIGN_DIRECTION](docs/DESIGN_DIRECTION.md) — diretrizes visuais e de tom

```
jornada-intensiva/
├── docs/                        ← PRD, arquitetura, roadmap, design
├── prompts/                     ← 8 prompts internos (consumidos pela camada de IA na Fase 2)
├── references/anything-llm/     ← (NÃO versionado) referência de integração — clone manual se quiser
└── app/                         ← Next.js 15 + TS + Tailwind + SQLite
```

### Sobre `references/anything-llm/`

Esse diretório é uma **referência arquitetural** do projeto [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) (~27 MB) e **não está no repositório** (`.gitignore`). Caso queira inspecioná-lo localmente:

```bash
git clone --depth 1 https://github.com/Mintplex-Labs/anything-llm.git references/anything-llm
```

## Como rodar localmente

```bash
cd app
npm install              # dependências (já instaladas se clonado)
npm run db:push          # cria tabelas SQLite via Drizzle
npm run seed             # popula com 1 plantão e 4 leitos mockados
npm run dev              # http://localhost:3000
```

O banco SQLite é criado em `app/jornada-intensiva.db` na primeira execução de `db:push`.

## Acesso pelo celular

O caso de uso real é ter o app rodando na sua máquina e abri-lo no celular durante o plantão. Há dois caminhos.

### Opção A — Tailscale (recomendado)

[Tailscale](https://tailscale.com) cria uma rede privada VPN-mesh entre seus dispositivos, cifrada, com IPs fixos do tipo `100.x.y.z`. Funciona em **qualquer rede** (hotspot do iPhone, Wi-Fi do hospital, café, casa) — incluindo redes que normalmente bloqueiam acesso entre clientes.

Setup (uma vez):

1. **Mac:** App Store → "Tailscale" → instalar → login com Apple ID/Google.
2. **iPhone/Android:** App Store/Play Store → "Tailscale" → mesmo login → ativar.
3. Pegar o IP da sua máquina na tailnet via menubar do Tailscale no Mac, ou no terminal:

```bash
tailscale ip -4
# saída exemplo:  100.76.86.1
```

Para usar:

```bash
cd app && npm run dev:lan      # ou npm run start:lan em produção
```

No celular: `http://SEU_IP_TAILSCALE:3000` (ex.: `http://100.76.86.1:3000`). **IP fixo, nunca muda.**

### Opção B — Mesma Wi-Fi local (alternativa simples)

Pré-requisito: Mac e celular na **mesma Wi-Fi normal** (não hotspot do iPhone — esse bloqueia clientes entre si).

```bash
cd app && npm run dev:lan
npm run ip                     # mostra o IP da máquina na rede atual
# saída exemplo:  en0: http://192.168.0.42:3000
```

No celular: `http://IP_DA_REDE:3000`. **IP muda** quando você troca de rede.

### Adicionar à tela inicial (PWA)

Quando o app carregar no celular:

- **iOS Safari:** Compartilhar ↑ → "Adicionar à Tela de Início" → nome `Jornada`.
- **Android Chrome:** menu (⋮) → "Adicionar à tela inicial".

Vira PWA standalone (sem barra do navegador), ícone `J` sépia.

### Produção pessoal (mais estável que `dev`)

```bash
npm run build && npm run start:lan
```

`start` é otimizado, sem hot-reload — abre mais rápido, gasta menos bateria.

### Notas operacionais

- Os dados ficam **na sua máquina** (`app/jornada-intensiva.db`) — nunca saem dela.
- Quando o Mac dorme ou desconecta da rede, o celular perde acesso. Para uso 24/7 independente da máquina, ver `ROADMAP.md` Fase 4 (self-host).
- Em rede pública sem Tailscale, qualquer pessoa na mesma rede pode acessar `SEU_IP:3000`. Como a Fase 1 é mock-only, isso é aceitável; antes de dados reais, **use Tailscale**.
- Backup: copiar `app/jornada-intensiva.db` periodicamente (`cp jornada-intensiva.db jornada-intensiva.db.bak`).

## Stack

- **Next.js 15** (App Router, Server Actions)
- **TypeScript 5.7**
- **Tailwind CSS 3**
- **SQLite** via **better-sqlite3**
- **Drizzle ORM 0.38** (schema + migrations)
- **Zod** (validação de entrada)
- **tsx** (execução de scripts TS)

## Status — Fase 1 (MVP)

| #    | Funcionalidade | Status |
|------|---------------|--------|
| F1   | Plantões — criar, listar, abrir | implementado |
| F2   | Leitos/pacientes — criar, listar, marcar inativo | implementado |
| F3   | Fontes textuais — colar, classificar, visualizar, remover | implementado |
| F4   | Ficha viva (`ClinicalSnapshot`) — geração por heurística | implementado |
| F5   | Passagem de plantão — padrão obrigatório de blocos | implementado |
| F6   | Resumo para família — linguagem leiga, tom honesto | implementado |
| F7   | Checklist de revisão de prescrição — sem prescrever | implementado |
| F8   | Perguntar ao caso — Q&A restrita ao leito (heurística) | implementado |
| F9   | Padrão LAB linha única — `LAB (DD/MM/AA): HB \| HT \| ... \| PCR` + extras | implementado |
| F10  | Padrão de controles 24h — vitais, balanço, diálise | implementado |
| F10b | Padrão de imagem — `NOME (DD/MM): IMPRESSÃO PRINCIPAL` | implementado |
| F11  | 3 telas — Plantões / Central / Leito (10 abas) | implementado |

### Não precisa de chave de API / LLM

A Fase 1 **não usa nenhum provedor externo**. Toda a "IA" é heurística determinística (regex + keywords) sobre os textos colados. Sem custo, sem latência, sem chave. Os 8 prompts em `prompts/*.md` ficam prontos para a Fase 2, quando o LLM real entrar pela mesma interface (`ClinicalAI`).

## O que ficou para Fase 2

- **F2.1** — `lib/ai/llm.ts` com LLM real (mesma interface da heurística atual)
- **F2.2** — Provider plugável via env (`AI_PROVIDER=anthropic | openai | ollama-local | anything-llm`)
- **F2.3** — Embeddings por `SourceDocument` na inserção/atualização
- **F2.4** — Retrieval semântico com filtro estrutural `patient_case_id` (top-k chunks do mesmo leito)
- **F2.5** — Respostas com citação obrigatória por `SourceDocument.id` + `source_type` + `source_datetime`
- **F2.6** — Streaming de geração para Resumo, Passagem, Família e Q&A
- **F2.7** — Histórico de Q&A por leito (`case_questions`)
- **F2.8** — Histórico de versões de `ClinicalSnapshot` (auditoria)
- **F2.9** — Detecção automática de divergências entre fontes do mesmo leito

## Avisos

- **DEV — não usar dados reais de pacientes.** O app não tem autenticação, criptografia nem controle de acesso. Apenas mocks anônimos em desenvolvimento.
- Não substitui o prontuário oficial em nenhuma circunstância.
- A camada de IA na Fase 1 é simulada (heurísticas sem LLM). Os outputs requerem revisão e validação pelo médico antes de qualquer uso clínico.

## Licença

Privado / uso pessoal.
