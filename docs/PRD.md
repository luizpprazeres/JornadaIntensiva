# PRD — Jornada Intensiva

> Plataforma documental discreta para organizar informações fragmentadas dos pacientes da UTI por leito, com geração assistida de ficha viva, passagem, resumo familiar e checklist de prescrição.

**Versão:** 0.1 (MVP — Fase 1)
**Owner:** Médico intensivista (uso pessoal)
**Status:** Aprovado para implementação
**Última atualização:** 2026-05-09

---

## 1. Visão

Centralizar, por leito, todas as fontes textuais que um intensivista recebe ao longo do plantão (passagem, evolução, prescrição, exames, controles, observações) e transformá-las em **uma ficha viva por paciente**, sem substituir o prontuário oficial e sem aparência de chatbot de IA.

A plataforma deve parecer um **editor documental clínico silencioso**, utilizável no celular durante o plantão, e gerar de forma rápida os artefatos textuais que o médico já produz manualmente hoje: resumo clínico, passagem, evolução, resumo familiar, checklist de prescrição e respostas a perguntas pontuais sobre o caso.

## 2. Problema

O intensivista trabalha com informação dispersa em múltiplos canais e sistemas:

- Passagem verbal/escrita do plantão anterior.
- Evolução do intensivista, evolução do diarista.
- Prescrição médica em sistema separado.
- Exames laboratoriais em portal hospitalar.
- Controles 24h em prancheta beira-leito.
- Observações próprias durante o plantão.
- Conversas com família.

Sintetizar tudo isso 3-6 vezes por plantão (admissão, virada, family meeting, passagem) é cognitivamente caro, propenso a omissão e feito sob estresse. O médico hoje recorre a ChatGPT genérico, copiando textos avulsos, sem isolamento por paciente, sem persistência por leito, sem padrão clínico próprio e em interface visualmente conspícua.

## 3. Personas

### P1 — Médico intensivista plantonista (PRIMÁRIA)
- Trabalha plantões de 12h/24h.
- Cobre 4-12 leitos simultâneos.
- Usa celular como instrumento principal beira-leito; notebook na sala de prescrição.
- Alterna 50+ vezes/dia entre leitos.
- Precisa de respostas em <10 segundos.
- Tem aversão a interfaces que "anunciem" uso de IA dentro da UTI.

### P2 — Médico diarista (SECUNDÁRIA, Fase 2+)
- Acompanha mesmos pacientes longitudinalmente.
- Foco em evolução temporal, plano semanal.
- Pode importar histórico do plantonista.

### P3 — Não-personas (excluídas explicitamente)
- Equipe de enfermagem, fisioterapia, residentes em treinamento, gestão hospitalar. O produto é pessoal e clínico-cognitivo, não institucional.

## 4. Jobs-to-be-done

| ID  | Job (quando..., quero..., para...)                                                 | Frequência |
|-----|------------------------------------------------------------------------------------|------------|
| J1  | Ao receber plantão, organizar a passagem verbal/escrita por leito                  | 1×/plantão |
| J2  | Ao revisar exame novo, atualizar minha ficha viva do paciente                      | 5-15×/dia  |
| J3  | Antes do round, gerar um resumo clínico atualizado por leito                       | 1-2×/dia   |
| J4  | Antes da family meeting, gerar resumo em linguagem leiga                           | 1-3×/dia   |
| J5  | Antes da prescrição, ter um checklist organizado de revisão                        | 1-2×/dia   |
| J6  | Ao final do plantão, gerar texto pronto de passagem para o próximo médico         | 1×/plantão |
| J7  | Ao surgir dúvida sobre o caso, perguntar e obter resposta restrita àquele leito    | sob demanda|
| J8  | Padronizar resumo laboratorial (ordem fixa de Hb, Ht, leuco, plq, Na, K, ureia...) | 5-15×/dia  |

## 5. Princípios de produto (não negociáveis)

1. **Unidade central = leito/paciente**, nunca o documento avulso.
2. **Nunca cruzar pacientes.** Toda query, geração e contexto operam dentro de um único `PatientCase`.
3. **Texto bruto é sagrado.** Toda fonte preserva `raw_text` original imutável; estrutura é camada derivada.
4. **Declarar ausência.** Se uma informação não foi encontrada na fontes, dizer "não encontrado", não inventar.
5. **Apontar divergências.** Quando duas fontes conflitam (ex.: prescrição diz noradrenalina suspensa, evolução diz em uso), sinalizar.
6. **Não prescrever.** O sistema organiza, sugere revisão, mas nunca emite prescrição autônoma.
7. **Apoio, não substituto.** Não substitui prontuário oficial.
8. **Discrição visual.** Aparência de editor documental institucional. Zero estética de chatbot.
9. **Mobile-first real.** Operável com uma mão, no celular, com interrupções.
10. **Privacidade.** Nenhum dado real de paciente em desenvolvimento; mocks anônimos.

## 6. Escopo da Fase 1 (MVP)

### Inclui
- Entrada **manual** por colar texto (sem OCR, sem upload de imagem).
- Classificação **manual** da fonte (médico escolhe o tipo).
- Persistência local (SQLite via Drizzle) numa máquina pessoal.
- Geração simulada (sem LLM real) de ficha, passagem, resumo familiar, checklist e Q&A — usando heurísticas sobre `SourceDocument[]` filtrados pelo leito.
- Interface mobile-first com layout documental retrô-sóbrio.
- Estrutura preparada para evoluir: abstração de IA, abstração de storage, modelo de auth latente.

### Não inclui (Fase 2+)
Ver `ROADMAP.md`.

## 7. Modelo conceitual

```
Shift (plantão)
  └── PatientCase (leito/paciente)        ← UNIDADE CENTRAL
        ├── SourceDocument[]               ← fontes textuais brutas
        │     └── source_type ∈ { handoff, medical_evolution, diarist_evolution,
        │                          prescription, laboratory, imaging,
        │                          controls_24h, physician_note,
        │                          family_conversation, other }
        ├── ClinicalSnapshot               ← ficha viva derivada (regenerável)
        ├── PrescriptionReview             ← checklist derivado
        ├── HandoffNote                    ← passagem gerada
        └── PendingItem[]                  ← pendências rastreadas
```

Regra cardinal: nenhuma operação atravessa `PatientCase` distintos.

## 8. Funcionalidades — Fase 1

### F1 — Plantões
- Criar novo plantão (`Shift`) com data/hora de início.
- Listar plantões existentes.
- Abrir plantão → vai para central de leitos.

### F2 — Leitos / pacientes
- Criar `PatientCase` dentro de um `Shift`.
- Campos mínimos no formulário: `bed_label`, `patient_name_or_identifier` (livre, pode ser "Leito 5" ou iniciais), `age`, `admission_date`, `main_diagnosis`.
- Listar leitos do plantão como cards documentais.
- Marcar leito como inativo (alta/óbito/transferência) sem deletar.

### F3 — Fontes textuais
- Adicionar `SourceDocument` a um leito, colando texto.
- Escolher manualmente o `source_type`.
- Campo opcional `source_datetime` (data/hora de origem da fonte).
- Listar todas as fontes do leito ordenadas por `source_datetime` desc.
- Visualizar `raw_text` integral da fonte (sempre acessível).
- Editar `structured_summary` manualmente quando desejado.

### F4 — Ficha viva (Resumo do leito)
- Botão "Gerar ficha viva" produz `ClinicalSnapshot` consolidando `SourceDocument[]` do leito.
- Campos do snapshot conforme schema (diagnóstico, problemas ativos, status por sistema, ATB, DVAs, sedação, dispositivos, últimos exames, controles, plano, pendências).
- Snapshot é regenerável (sobrescreve anterior), mas as fontes originais são preservadas.
- Indicar campos não encontrados como "não informado" explicitamente.

### F5 — Passagem de plantão
- Botão "Gerar passagem" produz `HandoffNote` no padrão definido:
  > Leito – Nome, idade, data de admissão. Motivo de admissão | diagnóstico principal. Comorbidades | profilaxia LAMG e TEV. ATB vigente. Controles relevantes. Plano. Pendências.
- Texto editável antes de copiar.
- Copiar para clipboard com 1 clique.

### F6 — Resumo para família
- Botão "Gerar resumo familiar" produz texto em linguagem leiga, sem termos técnicos não traduzidos.
- Tom: claro, honesto, não alarmista, não otimista falso.
- Editável antes de usar.

### F7 — Checklist de revisão de prescrição
- Botão "Gerar checklist" produz `PrescriptionReview` com itens organizados por categoria (ATB, profilaxia TEV, profilaxia LAMG, dieta, hidratação, eletrólitos, insulina, sedação, DVA, VM, dispositivos, exames pendentes, condutas pendentes).
- Cada item indica status conhecido + lacuna de informação ("ATB não mencionado nas fontes").
- **Não emite prescrição.**

### F8 — Perguntar ao caso
- Tela de Q&A restrita ao leito selecionado.
- Médico digita pergunta → resposta gerada apenas a partir das `SourceDocument[]` daquele leito.
- Quando resposta não está nas fontes, declarar "não encontrado nas fontes deste leito".
- Histórico das últimas 10 perguntas/respostas dentro do leito.

### F9 — Padrão de laboratório
Padrão definitivo, em **uma única linha por data**, caixa-alta, ordem fixa.

```
LAB (DD/MM/AA): HB X | HT X | VCM X | LEUCO X (ANTERIOR Y) | SEG X% (ANTERIOR Y%) | BAST X% | LINF X% | MON X% | EOS X% | BAS X% | PLAQ X | NA X | K X | UREIA X | CR X | CA ION X | MG X | PCR X
```

Regras:
- Sem valores absolutos do leucograma.
- Sem HCM, CHCM, RDW, MPV, Mentzer, RDWI.
- Comparação com anterior **somente** em `LEUCO` e `SEG` — formato `LEUCO X (ANTERIOR Y)` e `SEG X% (ANTERIOR Y%)`.
- Adicionais relevantes ao final da MESMA linha (na ordem): `CK | CKMB | TROP | D-DÍMERO | GLIC` — só aparecem se mencionados.
- Várias datas → várias linhas, da mais recente para a mais antiga.
- Campos ausentes na fonte: `—`.
- Sem comentários interpretativos.

Especificação completa em `prompts/laboratory-format.md`.

### F10 — Padrão de controles 24h
- Quando uma fonte tipo `controls_24h` é processada, organizar: temperatura, PAM, FR, FC, SatO2, HGT, diurese, balanço hídrico, fezes, UF de diálise (quando disponível).

### F10b — Padrão de imagem
Resumo de exames de imagem em **uma linha por exame**, caixa-alta, sem transcrever laudo inteiro.

```
NOME DO EXAME (DD/MM): IMPRESSÃO PRINCIPAL
```

Regras:
- Resumir só o que muda conduta ou ajuda no raciocínio clínico.
- Não copiar técnica/posicionamento/comparativo do laudo.
- Vários achados relevantes: separar por `;` ou `|`.
- Pendência: terminar com `AGUARDA LAUDO` ou `PENDENTE`.
- Linguagem seca, objetiva, clínica.

Exemplos:
```
TC DE CRÂNIO (08/05): MICROANGIOPATIA ISQUÊMICA CRÔNICA, SEM SANGRAMENTO AGUDO
ECOCARDIOGRAMA (29/04): FE 50%; AUMENTO ATRIAL; DERRAME PERICÁRDICO DISCRETO
```

Especificação completa em `prompts/imaging-format.md`.

> **Fase 1:** entrada por colar texto do laudo. **Fase 2:** upload de print/PDF do laudo + OCR + extração estruturada — ver `ROADMAP.md` Fase 3.

### F11 — Telas
- **Tela 1:** Lista de plantões.
- **Tela 2:** Central do plantão (cards discretos de leitos).
- **Tela 3:** Página do leito, com abas: `Resumo`, `Fontes`, `Laboratório`, `Controles`, `Prescrição`, `Evolução`, `Família`, `Passagem`, `Perguntar ao caso`.

## 9. Regras clínicas e de segurança

- **R1:** Nenhum dado real de paciente em ambiente de desenvolvimento. Apenas mocks anônimos.
- **R2:** Nenhuma sugestão prescritiva ativa (dose, troca de droga, suspensão). O sistema organiza dados e marca lacunas.
- **R3:** Toda geração textual deve declarar limitação ("baseado apenas nas fontes inseridas neste leito").
- **R4:** Divergências entre fontes devem ser apontadas, não silenciadas.
- **R5:** A camada de IA não pode receber `SourceDocument` de mais de um `PatientCase` na mesma chamada.
- **R6:** O usuário deve sempre poder ver o `raw_text` original que originou qualquer afirmação estruturada.

## 10. Fora de escopo (Fase 1)

- Upload de imagens, OCR, PDFs.
- Integração com prontuário eletrônico.
- Multi-usuário, autenticação, permissões.
- Sincronização entre dispositivos / cloud.
- LLM real, embeddings, vector store.
- Ditado por voz, exportação para PDF.
- Histórico longitudinal cross-shift do mesmo paciente (retomar caso de plantão anterior).
- Modo offline robusto.
- Suporte a múltiplos idiomas (PT-BR apenas).

## 11. Métricas de sucesso (uso pessoal)

Como o produto é pessoal, as métricas são qualitativas e auto-reportadas:

- **M1:** Médico consegue gerar passagem de plantão completa em <60s a partir da ficha viva.
- **M2:** Médico abre o app na UTI sem desconforto visual ("não parece chatbot").
- **M3:** Em 1 plantão piloto, ≥80% das fontes esperadas são adicionadas ao app.
- **M4:** Zero ocorrências de mistura entre pacientes.
- **M5:** Tempo médio para adicionar uma fonte (colar + classificar) <15s no celular.

## 12. Riscos e mitigações

| Risco                                                              | Severidade | Mitigação                                                                 |
|--------------------------------------------------------------------|------------|---------------------------------------------------------------------------|
| Confusão de pacientes (mistura entre leitos)                       | Crítico    | Filtro `patient_case_id` em todas as camadas; testes que validam isolamento |
| Médico confiar demais e tratar como prontuário                     | Alto       | Disclaimer permanente; checklist nunca emite, só revisa                    |
| Aparência de "AI app" → desconforto visual na UTI                  | Alto       | Design system documental; proibições explícitas no `DESIGN_DIRECTION.md`  |
| Dados reais inseridos em ambiente de dev                           | Crítico    | Banner permanente "DEV — NÃO USAR DADOS REAIS"; mocks claros              |
| Geração simulada (Fase 1) inventar conteúdo                        | Alto       | Heurísticas conservadoras; "não encontrado" explícito; preservar bruto    |
| Mobile-first comprometido por componentes desktop-only             | Médio      | Lighthouse mobile + smoke tests em viewport pequeno antes de fechar tarefas |

## 13. Glossário clínico mínimo

- **Ficha viva:** resumo clínico atualizado de um paciente no leito, regenerado conforme novas fontes chegam.
- **Passagem (de plantão):** texto-padrão que o plantonista entrega ao próximo médico.
- **Diarista:** médico assistente com acompanhamento contínuo do paciente em horário comercial.
- **Plantonista/intensivista:** médico responsável pelo plantão (12h/24h).
- **PAM:** pressão arterial média. **FR:** frequência respiratória. **HGT:** glicemia capilar. **UF:** ultrafiltração (diálise).
- **DVA:** droga vasoativa (noradrenalina, dobutamina etc.).
- **TEV:** tromboembolismo venoso. **LAMG:** lesão aguda da mucosa gástrica.

## 14. Referência técnica

- Repositório AnythingLLM clonado em `references/anything-llm/` apenas para consulta arquitetural (workspace isolado, threads, abstração de provider). **Não modificar.**
- Decisões técnicas: ver `ARCHITECTURE.md`.
- Direção visual: ver `DESIGN_DIRECTION.md`.
- Plano de evolução: ver `ROADMAP.md`.
