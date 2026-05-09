# Design Direction — Jornada Intensiva

> Bíblia visual. Lê-se antes de qualquer pixel ser desenhado. Tudo que estiver em conflito com este documento é rejeitado, mesmo que "fique bonito".

**Versão:** 0.1
**Última atualização:** 2026-05-09

---

## 1. Tese visual

A interface deve parecer um **editor documental clínico institucional**, não um app de IA.

Quando o médico abrir a tela na UTI — ao lado de um residente, de um colega, da supervisora ou do familiar do paciente — a leitura visual instantânea precisa ser **"está olhando um prontuário/sistema do hospital"**, não **"está conversando com ChatGPT"**.

Inspirações diretas:
- iA Writer
- Notion sóbrio (com tema neutro, sem cores)
- Editores de texto monoespaçados clássicos
- GitHub gists em modo claro
- Prontuários hospitalares antigos em papel almaço
- Folha A4 sobre mesa de madeira
- Manuais técnicos da década de 80–90 reimpressos

**O que rejeitamos:** estética AI/futurista/SaaS-genérica. Sem gradientes coloridos, sem glow, sem sparkle, sem avatares de bot, sem bolhas de chat coloridas, sem ícones grandes, sem cards com sombras vivas, sem hero sections, sem "Powered by AI ✨".

## 2. Princípios

1. **Documento, não app.** Cada tela é uma folha. Cards são folhas, não pílulas.
2. **Discrição sobre destaque.** Onde houver dúvida, escolher o tom mais discreto.
3. **Tinta antes de cor.** Cor é exceção (sinalização clínica). O resto é tinta sobre papel.
4. **Tipografia faz o trabalho.** Hierarquia vem de tipografia e espaço, não de cor ou fundo.
5. **Mobile real.** Layout começa em 360px e cresce. Desktop é caso bônus.
6. **Densidade alta.** Médico vê muita informação por tela. Sem espaços decorativos.
7. **Resposta de IA = bloco documental.** Aparece como um trecho de texto editável em uma folha, nunca como bolha.
8. **Sem ornamento.** Zero ícones decorativos, zero ilustrações, zero animações de transição.

## 3. Paleta — papel + tinta + sépia

Tudo definido em `app/tailwind.config.ts` como tokens. Nunca usar cores Tailwind padrão (`gray-500`, `blue-600`, etc.) — usar sempre as semânticas.

### Papel (fundos)
- `paper-50` `#fbf9f4` — fundo do app (creme suavíssimo, retrô)
- `paper-100` `#f6f2ea` — folhas/cards
- `paper-200` `#ebe5d8` — bordas claras
- `paper-300` `#d9d2c2` — bordas médias
- `paper-400` `#b9b0a0` — placeholders sobre paper

### Tinta (texto)
- `ink-900` `#1c1a17` — títulos h1
- `ink-800` `#2a2723` — títulos h2/h3
- `ink-700` `#3a3631` — texto forte
- `ink-600` `#4d4842` — corpo enfatizado
- `ink-500` `#6a635a` — corpo padrão
- `ink-400` `#8a8278` — texto secundário
- `ink-300` `#a9a195` — meta-informação, datas

### Sépia (interativo discreto)
- `sepia-600` `#7a5a2c` — links, ações primárias
- `sepia-500` `#8b6a3a` — hover de links
- `sepia-400` `#a5854f` — secundário/desabilitado

### Sinalização clínica (uso PARCIMONIOSO)
Estas cores **NUNCA** aparecem em decoração. Apenas para:
- `clinical-alert` `#9a3b2c` — divergência de fontes, alerta clínico crítico
- `clinical-warn`  `#a06b1f` — pendência aberta, "verificar"
- `clinical-ok`    `#3e6a3e` — confirmado, estável (pequenos chips)

Regra prática: **se você está usando uma cor clinical para deixar a tela mais "viva", você está errado**. Cor clinical é informação, não decoração.

## 4. Tipografia

| Função                  | Família                                            | Peso/Estilo       | Tamanho |
|-------------------------|----------------------------------------------------|-------------------|---------|
| Título h1               | `Source Serif 4` (fallback Iowan Old Style/Georgia) | 600               | 1.625rem |
| Título h2               | Source Serif 4                                      | 600               | 1.25rem  |
| Título h3 / nome do leito | Inter                                            | 600 small-caps    | 0.9375rem |
| Corpo                   | Inter                                              | 400               | 0.9375rem |
| Texto secundário/meta   | Inter                                              | 400 letter-spacing wide | 0.8125rem |
| Laboratório / dados     | JetBrains Mono                                     | 400               | 0.8125rem |
| Botões/inputs           | Inter                                              | 500               | 0.875rem |

**Regras tipográficas:**
- Títulos serif, corpo sans, dados mono. Três famílias, sem desvios.
- Letterspacing leve (`tracking-doc`) em corpo para sensação documental.
- Itálico permitido para meta-informação (datas, citações de fonte).
- Caixa-alta apenas em chips clínicos pequenos (`MARK`, `ATB`, `DVA`), nunca em títulos de tela.

## 5. Espaço e ritmo

- Margem documental: `2.25rem` em desktop, `1.25rem` em mobile.
- Folha (Sheet) tem padding interno generoso: `1.5rem` mobile, `2.25rem` desktop.
- Linhas separadoras finas (1px `paper-300`) substituem cards com sombra.
- Stack vertical: `gap-4` (16px) entre blocos relacionados, `gap-8` (32px) entre seções.
- Sem grid decorativo. Layouts são colunas verticais; mesmo em desktop, o conteúdo principal é uma coluna central de até 760px.

## 6. Componentes (do design system documental)

Nomes dos primitivos em `components/ui/` — escolhidos para reforçar metáfora documental:

| Nome                    | Papel                                                                       |
|-------------------------|-----------------------------------------------------------------------------|
| `Sheet`                 | Equivalente a folha de papel — fundo `paper-100`, sombra mínima             |
| `DocumentBlock`         | Bloco de conteúdo com título + corpo, padrão para fontes e snapshots        |
| `FieldGroup`            | Linha-formulário rótulo/valor (label + input em estilo formulário oficial)   |
| `MetaLine`              | Linha pequena de metadados (data, tipo de fonte, autor)                     |
| `MarkChip`              | Chip retangular pequeno tipo etiqueta — para `source_type`, status         |
| `QuietButton`           | Botão discreto: borda fina, fundo paper, hover sutil                        |
| `PrimaryActionButton`   | Variante quando ação é clara e importante (gerar passagem) — sépia      |
| `MonoBlock`             | Bloco mono (laboratórios, controles)                                        |
| `SectionDivider`        | Linha horizontal fina com possível rótulo central tipo capítulo             |
| `TabBar`                | Barra de abas tipo separador documental, NÃO abas tipo iOS                  |
| `BedRail`               | Lista lateral/topo de leitos (nome em mono pequeno + bed_label em serif)     |
| `EmptyHint`             | Estado vazio sóbrio: 1 linha em ink-400 itálico, sem ilustração             |

**Componentes proibidos** (mesmo que existam em design systems comuns):
- `Card` (substituir por `Sheet` ou `DocumentBlock`)
- `ChatBubble`, `MessageBubble`
- `Avatar` (não há identidade pessoal exibida na Fase 1)
- `Hero`
- `Banner` colorido (exceto o disclaimer DEV em sépia escuro discreto)
- `Toast` (usar inline mensagens dentro do documento)
- `Modal` flutuante grande (preferir folhas em rota dedicada)
- Qualquer ícone decorativo grande (ícones só em botões pequenos, monocromáticos)

## 7. Iconografia

- **Conjunto:** Lucide-style stroke 1.25px monocromático em `ink-500`.
- **Tamanho padrão:** 14px–16px. Nunca >20px.
- **Quantidade por tela:** ≤6 ícones visíveis.
- **Cor:** apenas tons de tinta. Nunca colorido.
- **Decorativo:** zero. Todo ícone tem função (botão de copiar, botão de adicionar, ordenação).

## 8. Estados

| Estado            | Tratamento                                                                       |
|-------------------|----------------------------------------------------------------------------------|
| Loading           | Texto inline em itálico ink-400 ("processando…"). **Sem spinners coloridos.**     |
| Vazio             | `EmptyHint`: 1 linha sóbria. Ex.: *"Nenhuma fonte registrada. Cole um texto para começar."* |
| Erro              | Linha em `clinical-alert` precedida de "Erro:", sem ícones, sem caixa colorida    |
| Sucesso           | Texto inline `clinical-ok`, breve. Sem confetti, sem checkmark animado            |
| Hover             | Sublinhado fino em links sépia; mudança de borda em botões                       |
| Foco (a11y)       | Outline 2px sépia-500 com offset 2px                                             |

## 9. Movimento

- Transições ≤120ms.
- Fade discreto em entrada de aba.
- **Proibido:** parallax, slide-in dramáticos, animações de carregamento, micro-interações decorativas.

## 10. Mobile-first checklist

- Touch targets ≥44×44px.
- Viewport mínima testada: 360px (iPhone SE).
- Inputs com `font-size: 16px` para evitar zoom no iOS.
- Lista de leitos: vertical em mobile, lateral em ≥768px.
- Abas em mobile: scroll horizontal de fines tabs documentais (não overflow oculto).
- Sticky sutil de cabeçalho do leito ao rolar.

## 11. Anti-AI checklist (rejeitar antes de mergear)

Se a tela tem **qualquer** uma das características abaixo, refazer:

- [ ] Bolha de mensagem ao estilo chat
- [ ] Avatar do "Assistente IA"
- [ ] Texto "Gerando com IA…" com spinner colorido
- [ ] Gradientes (de qualquer cor)
- [ ] Hero / banner de boas-vindas
- [ ] CTA grande no centro da tela
- [ ] "✨" ou qualquer emoji em UI
- [ ] Cards com sombras dramáticas (`shadow-lg`+)
- [ ] Cores saturadas (azul SaaS, verde "success" Tailwind padrão)
- [ ] Ilustração vetorial de robô / cérebro / circuito
- [ ] Tipografia muito grande para "impacto"
- [ ] Modal de onboarding com 3+ passos
- [ ] Borda arredondada `rounded-xl`/`rounded-2xl`
- [ ] Animação de typewriter na resposta da IA
- [ ] Botão "Copiar" com confirmação animada brilhante
- [ ] Glassmorphism/neumorphism

## 12. Pro-documental checklist (objetivos positivos)

A tela está pronta quando:

- [ ] Parece uma folha de papel sobre mesa
- [ ] Hierarquia legível pelo tamanho/peso da fonte, não por cor
- [ ] Cor só aparece em sinalização clínica, e não dói
- [ ] Densidade adequada — médico vê 80%+ do que precisa sem rolar
- [ ] Mobile (375px) e desktop (1440px) usam o mesmo cálculo de coluna central
- [ ] Texto da IA é editável, indistinguível de texto manual
- [ ] Banner DEV não-real está visível mas não atrapalha leitura
- [ ] Loading aparece como texto inline, não como elemento gráfico

## 13. Tom de voz e microcopy

- **PT-BR neutro clínico.** Sem "Vamos lá", sem "Pronto!", sem "Aqui está sua ficha viva 🎉".
- Botões: imperativo curto. *"Gerar passagem"*, *"Adicionar fonte"*, *"Copiar"*.
- Títulos: substantivos clínicos. *"Ficha viva"*, *"Fontes"*, *"Passagem"*, *"Perguntar ao caso"*.
- Mensagens de ausência: *"Não informado nas fontes"* (não *"Sem dados disponíveis"*, não *"Hmm, não encontrei isso 🤔"*).
- Disclaimer permanente no rodapé: *"Apoio à organização clínica. Não substitui prontuário oficial. Não use dados reais em desenvolvimento."*

## 14. Exemplos concretos

### 14.1 Card de leito (Tela 2)

```
─────────────────────────────────────────
Leito 7 · J.M., 68a                       ←  serif h3 + meta sans-mono
PAC grave + DPOC                          ←  ink-700, 1 linha
adm. 06/05 · 4 fontes                     ←  ink-400, mono pequeno, itálico
─────────────────────────────────────────
```

Nada de avatar, nada de cor, nada de status colorido. Apenas linha + linha + linha.

### 14.2 Resposta de "Perguntar ao caso"

```
PERGUNTA
Qual foi a última hemoglobina?

RESPOSTA
A última hemoglobina registrada foi 8,7 g/dL, em laboratório de 08/05/2026 às
06h12. Antes disso, 9,3 g/dL em 06/05/2026.

Fontes citadas:
  · #lab-2026-05-08-06h12 (Laboratório, 08/05/2026)
  · #lab-2026-05-06-22h00 (Laboratório, 06/05/2026)
```

Sem bolha. Sem avatar. Texto chumbado em folha. Nomes/IDs em mono. Citação como rodapé documental.

### 14.3 Banner DEV (rodapé)

```
DEV — não usar dados reais. Apoio à organização clínica. Não substitui prontuário.
```

Sépia escuro (`sepia-600`) sobre `paper-100`, fonte mono pequena (`text-doc-xs`), borda superior fina. Fixo no rodapé.

## 15. Quando recorrer a `/impeccable` ou `/critique`

- `/impeccable` é chamado **uma vez** para gerar o design system base + uma tela exemplar (página do leito), seguindo este documento como contexto de entrada.
- `/critique` é chamado **antes do merge da Fase 1** para validar contra Anti-AI checklist.
- `/distill` é chamado se qualquer tela acumular complexidade visual.

Estes skills seguem este DESIGN_DIRECTION.md como **fonte da verdade**, não substituem.
