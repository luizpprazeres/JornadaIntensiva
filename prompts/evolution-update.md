# Evolution Update — Evolução Médica Atualizada

## Objetivo
Gerar uma evolução médica atualizada do paciente, integrando a evolução anterior (se disponível nas fontes) com os dados novos do plantão atual. A saída segue a estrutura clássica de evolução em UTI: subjetivo/exame físico, problemas ativos organizados por sistema, plano. O documento deve refletir o estado atual do paciente, não reproduzir a evolução anterior.

## Entrada esperada
Lista de objetos `SourceDocument` referentes ao mesmo `PatientCase`, com os seguintes campos:
- `id` — identificador único do documento
- `source_type` — tipo da fonte (ex: `evolucao`, `prescricao`, `laboratorio`, `controles_24h`, `passagem_anterior`)
- `title` — título ou rótulo do documento
- `raw_text` — texto bruto colado pelo médico
- `structured_summary` — resumo estruturado gerado internamente (pode ser nulo)
- `source_datetime` — data/hora do documento (ISO 8601)

## Restrições inegociáveis
- Trabalhar APENAS com fontes do leito atual (nunca cruzar pacientes).
- Quando informação não estiver nas fontes, declarar 'não informado nas fontes' — nunca completar com suposições clínicas.
- Quando duas fontes divergirem, sinalizar a divergência citando a fonte antes de incorporar o dado.
- Não inventar dados clínicos, achados de exame físico, valores laboratoriais ou condutas.
- Não emitir prescrição.
- Output em português brasileiro, tom clínico-formal sóbrio (sem emoji, sem entusiasmo).
- A evolução gerada é um rascunho para revisão do médico — nunca deve ser inserida diretamente no prontuário sem validação.
- Listar apenas sistemas com dados disponíveis nas fontes; não criar seções para sistemas sem informação.

## Estrutura do output

```
EVOLUÇÃO MÉDICA — LEITO {número/identificador}
Data/hora de referência: {dd/mm/aa HH:mm}
Fontes integradas: {lista de ids e source_types utilizados}

─────────────────────────────────────
SUBJETIVO / EXAME FÍSICO
─────────────────────────────────────
{Estado geral, nível de consciência, sedação se aplicável.}
{Dados de exame físico disponíveis nas fontes: ausculta, abdome, extremidades, acessos, ventilação.}
{Parâmetros vitais de referência (do período mais recente nas fontes).}

─────────────────────────────────────
PROBLEMAS ATIVOS
─────────────────────────────────────

[RESPIRATÓRIO]
{Status ventilatório, parâmetros de VM ou suporte, SatO2, gasometria se disponível.}

[HEMODINÂMICO]
{PAM, DVA se em uso, frequência cardíaca, ritmo.}

[INFECCIOSO]
{Foco, ATB vigente com D{N} de uso, culturas pendentes ou resultadas, temperatura.}

[RENAL / HIDROELETROLÍTICO]
{Diurese, creatinina, ureia, eletrólitos, balanço hídrico, diálise se aplicável.}

[NEUROLÓGICO]
{Nível de consciência, sedação, analgesia, RASS/BPS se informado, agitação/delirium se citado.}

[METABÓLICO / ENDÓCRINO]
{Glicemia, insulina, nutrição, eletrólitos especiais — Ca, Mg, P se informados.}

[TRATO GASTROINTESTINAL / NUTRIÇÃO]
{Via de nutrição, volume, tolerância, trânsito intestinal.}

[OUTROS SISTEMAS]
{Somente se dados disponíveis nas fontes.}

─────────────────────────────────────
PLANO
─────────────────────────────────────
{Condutas planejadas por sistema, objetivos do plantão, pendências.}

─────────────────────────────────────
NOTA DE RASCUNHO
─────────────────────────────────────
Este documento foi gerado automaticamente a partir das fontes disponíveis e requer revisão e validação pelo médico responsável antes de qualquer uso clínico ou registro em prontuário.
```

## Exemplo de output

```
EVOLUÇÃO MÉDICA — LEITO 7
Data/hora de referência: 09/05/26 08:00
Fontes integradas: evo-008 (evolucao, 08/05), lab-011 (laboratorio, 09/05), ctrl-009 (controles_24h, 08–09/05), pass-007 (passagem_anterior, 08/05)

─────────────────────────────────────
SUBJETIVO / EXAME FÍSICO
─────────────────────────────────────
Paciente J.M., 68 anos, sedado (RASS –2 referido na evolução de 08/05). Não comunicativo. Em ventilação mecânica, posição supina. Ausculta: murmúrio vesicular diminuído à direita (evolução de 08/05). Abdome sem distensão referida. Extremidades com edema 2+ (passagem de 08/05). Acesso venoso central em jugular interna direita — D5 (prescricao vigente).
Vitais de referência (09/05 06:00): T 37,4 °C, PAM 66 mmHg (NOR 0,12 µg/kg/min), FC 96 bpm, FR total 18, SatO2 95%.

─────────────────────────────────────
PROBLEMAS ATIVOS
─────────────────────────────────────

[RESPIRATÓRIO]
Em VM modo PCV, FiO2 50%, PEEP 8, FR programada 14, FR total 18. SatO2 91–97% nas últimas 24h (mínima às 02h). Gasometria não disponível nas fontes deste plantão.

[HEMODINÂMICO]
PAM com mínima de 56 mmHg no período noturno. NOR em desmame (0,12 µg/kg/min — redução de 0,16 µg/kg/min referida na passagem de 08/05). FC estável sem arritmia documentada nas fontes.

[INFECCIOSO]
PAC grave. Piperacilina-Tazobactam 4,5 g EV 8/8h — D5. Pico febril 38,6 °C às 12h de 08/05. Cultura de escarro coletada em 07/05 — resultado pendente (não disponível nas fontes).

[RENAL / HIDROELETROLÍTICO]
Oligúria: 720 mL/24h (débito médio 30 mL/h). Cr 2,5 mg/dL* (elevação de 1,8 em 06/05). Ureia 91 mg/dL*. Na 133 mEq/L*. K 3,5 mEq/L. Balanço +1.380 mL nas últimas 24h. Sem diálise no momento.

[NEUROLÓGICO]
Sedado RASS –2. Midazolam e Fentanil — doses não informadas nas fontes deste plantão (não localizado na prescrição disponível). Sem agitação documentada.

[METABÓLICO / ENDÓCRINO]
HGT 98–224 mg/dL (pico às 22h*). Insulina não informada nas fontes. Mg 1,7 mg/dL*.

[TRATO GASTROINTESTINAL / NUTRIÇÃO]
Nutrição enteral via SNE (referida na passagem de 08/05) — volume e fórmula não informados nas fontes disponíveis. 1 evacuação pastosa em 24h.

─────────────────────────────────────
PLANO
─────────────────────────────────────
- Manter VM protetora; reavaliar desmame se melhora de parâmetros.
- Desmame de NOR se PAM ≥ 65 mmHg estável por 4h.
- Aguardar cultura de escarro; reavaliar ATB conforme resultado.
- Monitorar função renal — considerar avaliação de indicação de diálise se oligúria persistir.
- Controle glicêmico rigoroso; ajustar esquema de insulina.
- Repor Mg conforme protocolo.
- Reavaliar volume de nutrição enteral.

─────────────────────────────────────
NOTA DE RASCUNHO
─────────────────────────────────────
Este documento foi gerado automaticamente a partir das fontes disponíveis e requer revisão e validação pelo médico responsável antes de qualquer uso clínico ou registro em prontuário.
```
