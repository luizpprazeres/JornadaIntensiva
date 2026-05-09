# Imaging Format — Resumo de Exames de Imagem

## Objetivo
Resumir laudos de imagem em **uma linha por exame**, com nome, data e impressão principal. Sem transcrever o laudo inteiro, sem introduções técnicas, sem achados acessórios irrelevantes.

## Entrada esperada
Lista de objetos `SourceDocument` referentes ao mesmo `PatientCase`, filtrados por `source_type === "imaging"`. Campos relevantes: `title`, `raw_text` (o laudo cru, possivelmente colado de print), `source_datetime`.

## Restrições inegociáveis
- Trabalhar APENAS com fontes do leito atual.
- Resumir APENAS o que muda conduta ou ajuda no raciocínio clínico.
- NÃO transcrever descrição longa.
- NÃO copiar a introdução técnica do laudo (técnica, posicionamento, comparativo, método).
- NÃO repetir achados acessórios sem relevância.
- Quando houver mais de um achado relevante, separar por ponto-e-vírgula `;` ou barra vertical `|`.
- Se o laudo for parcial: terminar com `AGUARDA LAUDO` ou `PENDENTE`.
- Linguagem **seca, objetiva, clínica**, em CAIXA-ALTA quando representando impressão principal.
- Se a fonte não permite extrair impressão (ex.: só imagem sem texto interpretável na Fase 1), retornar `AGUARDA LAUDO`.

## Estrutura do output

Padrão por exame:
```
NOME DO EXAME (DD/MM): IMPRESSÃO PRINCIPAL
```

Onde:
- `NOME DO EXAME` — nome canônico curto em caixa-alta (TC DE CRÂNIO, TC DE TÓRAX, RX DE TÓRAX, USG VIAS URINÁRIAS, ECOCARDIOGRAMA, ANGIO-TC, RM, DOPPLER, etc.).
- `DD/MM` — dia/mês a partir de `source_datetime`. Quando ano relevante, usar `DD/MM/AA`.
- `IMPRESSÃO PRINCIPAL` — frase ou achados separados por `;` ou `|`. Tom clínico, sem floreio.

Múltiplos exames: 1 linha por exame, ordenados do mais recente para o mais antigo.

## Exemplo de output

```
TC DE CRÂNIO (08/05): MICROANGIOPATIA ISQUÊMICA CRÔNICA, SEM SANGRAMENTO AGUDO
TC DE TÓRAX (07/05): SEM INDÍCIOS INFECCIOSOS; BANDAS ATELECTÁSICAS ESPARSAS; APRISIONAMENTO AÉREO
USG VIAS URINÁRIAS (28/04): COÁGULO INTRAVESICAL IMPORTANTE; CISTO RENAL SIMPLES À DIREITA
ECOCARDIOGRAMA (29/04): FE 50%; AUMENTO ATRIAL; DERRAME PERICÁRDICO DISCRETO
RX DE TÓRAX (06/05): AGUARDA LAUDO
```
