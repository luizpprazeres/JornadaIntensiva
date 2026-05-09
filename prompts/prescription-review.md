# Prescription Review — Checklist de Revisão de Prescrição

## Objetivo
Gerar um checklist estruturado de revisão de prescrição para apoiar o médico na identificação de lacunas, itens a confirmar e inconsistências entre as fontes do leito. Este prompt não prescreve medicamentos — apenas levanta o status de cada categoria e sinaliza itens que requerem atenção ou confirmação.

## Entrada esperada
Lista de objetos `SourceDocument` referentes ao mesmo `PatientCase`, com os seguintes campos:
- `id` — identificador único do documento
- `source_type` — tipo da fonte (ex: `prescricao`, `evolucao`, `laboratorio`, `controles_24h`, `passagem_anterior`)
- `title` — título ou rótulo do documento
- `raw_text` — texto bruto colado pelo médico
- `structured_summary` — resumo estruturado gerado internamente (pode ser nulo)
- `source_datetime` — data/hora do documento (ISO 8601)

## Restrições inegociáveis
- Trabalhar APENAS com fontes do leito atual (nunca cruzar pacientes).
- Quando informação não estiver nas fontes, declarar 'não informado nas fontes' — nunca completar com suposições clínicas ou preencher automaticamente com condutas padrão.
- Quando duas fontes divergirem (ex: evolução cita ATB diferente da prescrição), sinalizar a divergência citando ambas as fontes.
- Não inventar dados clínicos.
- Não emitir prescrição, não sugerir doses, não sugerir medicamentos específicos.
- Output em português brasileiro, tom clínico-formal sóbrio (sem emoji, sem entusiasmo).
- O checklist é uma ferramenta de apoio à revisão — não substitui o julgamento médico.

## Estrutura do output

Para cada categoria, apresentar dois campos:
- **Status nas fontes:** o que está documentado (ou 'não informado nas fontes')
- **Lacuna / item a confirmar:** o que está ausente, divergente ou que requer verificação ativa

```
CHECKLIST DE REVISÃO DE PRESCRIÇÃO — LEITO {número/identificador}
Data de referência: {dd/mm/aa}
Fontes utilizadas: {lista de ids e source_types}

─────────────────────────────────────
ATB
─────────────────────────────────────
Status nas fontes: {nome, dose, via, D{N} de uso, indicação, culturas disponíveis e resultado}
Lacuna / item a confirmar: {ex: cultura pendente, prazo de reavaliação, necessidade de ajuste renal}

─────────────────────────────────────
PROFILAXIA TEV
─────────────────────────────────────
Status nas fontes: {droga, dose, via — ou 'não informado nas fontes'}
Lacuna / item a confirmar: {ex: ausência de prescrição, contraindicação não documentada, peso não informado para cálculo de dose}

─────────────────────────────────────
PROFILAXIA LAMG
─────────────────────────────────────
Status nas fontes: {droga, dose, via — ou 'não informado nas fontes'}
Lacuna / item a confirmar: {ex: ausência de prescrição, duplicidade, via não adequada}

─────────────────────────────────────
DIETA / NUTRIÇÃO
─────────────────────────────────────
Status nas fontes: {via (oral/enteral/parenteral), fórmula, volume, velocidade — ou 'não informado nas fontes'}
Lacuna / item a confirmar: {ex: meta calórica/proteica não informada, tolerância não documentada, jejum não justificado}

─────────────────────────────────────
HIDRATAÇÃO
─────────────────────────────────────
Status nas fontes: {solução, volume, velocidade — ou 'não informado nas fontes'}
Lacuna / item a confirmar: {ex: hidratação não documentada, indicação não clara frente ao balanço positivo}

─────────────────────────────────────
ELETRÓLITOS
─────────────────────────────────────
Status nas fontes: {reposições prescritas com valores-gatilho — ou 'não informado nas fontes'}
Lacuna / item a confirmar: {ex: valores alterados nos exames sem reposição documentada — citar eletrólito e valor}

─────────────────────────────────────
INSULINA / CONTROLE GLICÊMICO
─────────────────────────────────────
Status nas fontes: {esquema prescrito (basal/correção/bomba), alvo glicêmico, frequência de HGT — ou 'não informado nas fontes'}
Lacuna / item a confirmar: {ex: HGT alterado sem ajuste documentado, esquema não localizado na prescrição}

─────────────────────────────────────
SEDAÇÃO / ANALGESIA
─────────────────────────────────────
Status nas fontes: {drogas, doses, escalas utilizadas (RASS/BPS/CPOT), alvo documentado — ou 'não informado nas fontes'}
Lacuna / item a confirmar: {ex: RASS não documentado, ausência de escala de analgesia, droga citada na evolução sem aparecer na prescrição}

─────────────────────────────────────
DROGAS VASOATIVAS (DVA)
─────────────────────────────────────
Status nas fontes: {drogas, doses em µg/kg/min, alvo de PAM documentado — ou 'não aplicável' / 'não informado nas fontes'}
Lacuna / item a confirmar: {ex: DVA citada sem dose na prescrição, alvo de PAM não especificado}

─────────────────────────────────────
VENTILAÇÃO MECÂNICA
─────────────────────────────────────
Status nas fontes: {modo, FiO2, PEEP, VC ou pressão, FR programada, alvo de SatO2 — ou 'não aplicável' / 'não informado nas fontes'}
Lacuna / item a confirmar: {ex: parâmetros de VM não detalhados na prescrição, sem critérios de desmame documentados}

─────────────────────────────────────
DISPOSITIVOS INVASIVOS
─────────────────────────────────────
Status nas fontes: {acesso venoso central, cateter arterial, sonda vesical, SNE/SNG, dreno, outros — com data de inserção quando disponível}
Lacuna / item a confirmar: {ex: dispositivo sem data documentada, necessidade de revisão de indicação não registrada}

─────────────────────────────────────
EXAMES PENDENTES
─────────────────────────────────────
Status nas fontes: {exames solicitados com data de solicitação e resultado, se disponível}
Lacuna / item a confirmar: {ex: exame solicitado sem resultado nas fontes, exame citado na evolução sem solicitação localizada}

─────────────────────────────────────
CONDUTAS PENDENTES
─────────────────────────────────────
Status nas fontes: {condutas documentadas nas fontes como pendentes ou planejadas}
Lacuna / item a confirmar: {ex: conduta mencionada na passagem sem registro na evolução atual}

─────────────────────────────────────
NOTA
─────────────────────────────────────
Este checklist foi gerado automaticamente a partir das fontes disponíveis. Itens não localizados nas fontes não significam necessariamente ausência na prescrição real — podem refletir documentação incompleta. Validação pelo médico responsável é obrigatória.
```

## Exemplo de output

```
CHECKLIST DE REVISÃO DE PRESCRIÇÃO — LEITO 7
Data de referência: 09/05/26
Fontes utilizadas: presc-010 (prescricao, 08/05), evo-008 (evolucao, 08/05), lab-011 (laboratorio, 09/05), ctrl-009 (controles_24h, 08–09/05)

─────────────────────────────────────
ATB
─────────────────────────────────────
Status nas fontes: Piperacilina-Tazobactam 4,5 g EV 8/8h — D5 (presc-010). Indicação: PAC grave. Cultura de escarro coletada em 07/05 — resultado pendente.
Lacuna / item a confirmar: Resultado de cultura não disponível nas fontes. Reavaliar indicação e espectro após resultado. Ajuste de dose para função renal (Cr 2,5 mg/dL) não documentado.

─────────────────────────────────────
PROFILAXIA TEV
─────────────────────────────────────
Status nas fontes: Enoxaparina 40 mg SC 1×/dia (presc-010) — D5.
Lacuna / item a confirmar: Peso do paciente não informado nas fontes para confirmar dose adequada. Verificar função renal para ajuste (Cr 2,5 mg/dL — risco de acúmulo).

─────────────────────────────────────
PROFILAXIA LAMG
─────────────────────────────────────
Status nas fontes: Pantoprazol 40 mg EV 1×/dia (presc-010) — D5.
Lacuna / item a confirmar: Sem lacunas identificadas nas fontes.

─────────────────────────────────────
DIETA / NUTRIÇÃO
─────────────────────────────────────
Status nas fontes: Nutrição enteral via SNE referida na passagem de 08/05. Volume e fórmula não localizados na prescrição disponível (presc-010).
Lacuna / item a confirmar: Volume, fórmula e velocidade de infusão não informados nas fontes deste plantão. Confirmar prescrição nutricional.

─────────────────────────────────────
HIDRATAÇÃO
─────────────────────────────────────
Status nas fontes: não informado nas fontes.
Lacuna / item a confirmar: Balanço +1.380 mL em 24h. Avaliar necessidade de hidratação adicional frente ao balanço positivo e à oligúria.

─────────────────────────────────────
ELETRÓLITOS
─────────────────────────────────────
Status nas fontes: Reposição de eletrólitos não localizada na prescrição disponível (presc-010).
Lacuna / item a confirmar: Mg 1,7 mg/dL* (abaixo do limite inferior). Na 133 mEq/L*. Reposição não documentada nas fontes — confirmar se prescrita ou se necessária.

─────────────────────────────────────
INSULINA / CONTROLE GLICÊMICO
─────────────────────────────────────
Status nas fontes: HGT 6×/dia referido nos controles (ctrl-009). Esquema de insulina não localizado na prescrição disponível (presc-010).
Lacuna / item a confirmar: HGT máximo 224 mg/dL às 22h sem ajuste documentado. Confirmar esquema de insulina na prescrição real.

─────────────────────────────────────
SEDAÇÃO / ANALGESIA
─────────────────────────────────────
Status nas fontes: RASS –2 referido na evolução de 08/05 (evo-008). Midazolam e Fentanil citados na evolução sem doses localizadas na prescrição disponível (presc-010).
Lacuna / item a confirmar: Doses de sedação/analgesia não confirmadas nas fontes. Escala de analgesia (BPS/CPOT) não documentada nas fontes.

─────────────────────────────────────
DROGAS VASOATIVAS (DVA)
─────────────────────────────────────
Status nas fontes: Norepinefrina 0,12 µg/kg/min referida nos controles (ctrl-009). Não localizada com dose explícita na prescrição disponível (presc-010).
Lacuna / item a confirmar: Dose de NOR e alvo de PAM não documentados na prescrição disponível. Confirmar prescrição real.

─────────────────────────────────────
VENTILAÇÃO MECÂNICA
─────────────────────────────────────
Status nas fontes: VM modo PCV, FiO2 50%, PEEP 8, FR 14, FR total 18 (ctrl-009/evo-008). Parâmetros não detalhados na prescrição disponível (presc-010).
Lacuna / item a confirmar: Critérios de desmame ventilatório não documentados nas fontes. Confirmar parâmetros na prescrição real.

─────────────────────────────────────
DISPOSITIVOS INVASIVOS
─────────────────────────────────────
Status nas fontes: CVC em jugular interna direita — D5 (presc-010). SNE referida (pass-007). Sem cateter arterial documentado nas fontes.
Lacuna / item a confirmar: Data de inserção da SNE não informada nas fontes. Monitorização de PAM por cateter arterial não documentada — confirmar se via manguito.

─────────────────────────────────────
EXAMES PENDENTES
─────────────────────────────────────
Status nas fontes: Cultura de escarro (07/05) — resultado pendente. Hemograma e bioquímica de 09/05 disponíveis (lab-011).
Lacuna / item a confirmar: Gasometria arterial não disponível nas fontes deste plantão. Confirmar se solicitada.

─────────────────────────────────────
CONDUTAS PENDENTES
─────────────────────────────────────
Status nas fontes: Avaliação de fisioterapia para desmame ventilatório (pass-007). Decisão sobre diálise se oligúria persistir (pass-007).
Lacuna / item a confirmar: Avaliação de fisioterapia não documentada como realizada nas fontes. Decisão sobre diálise não registrada nas fontes do plantão atual.

─────────────────────────────────────
NOTA
─────────────────────────────────────
Este checklist foi gerado automaticamente a partir das fontes disponíveis. Itens não localizados nas fontes não significam necessariamente ausência na prescrição real — podem refletir documentação incompleta. Validação pelo médico responsável é obrigatória.
```
