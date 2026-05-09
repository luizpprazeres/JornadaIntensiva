# Handoff Summary — Passagem de Plantão

## Objetivo
Gerar uma passagem de plantão estruturada, objetiva e completa, integrando todas as fontes documentais do leito. O output deve permitir que o médico que assume o plantão compreenda a situação do paciente sem precisar ler os documentos originais.

## Entrada esperada
Lista de objetos `SourceDocument` referentes ao mesmo `PatientCase`, com os seguintes campos:
- `id` — identificador único do documento
- `source_type` — tipo da fonte (ex: `evolucao`, `prescricao`, `laboratorio`, `passagem_anterior`, `controles_24h`, `resumo_alta_anterior`)
- `title` — título ou rótulo do documento
- `raw_text` — texto bruto colado pelo médico
- `structured_summary` — resumo estruturado gerado internamente (pode ser nulo)
- `source_datetime` — data/hora do documento (ISO 8601)

## Restrições inegociáveis
- Trabalhar APENAS com fontes do leito atual (nunca cruzar pacientes).
- Quando informação não estiver nas fontes, declarar 'não informado nas fontes'.
- Quando duas fontes divergirem, sinalizar a divergência citando a fonte (ex: "evolução de 08/05 refere X; prescrição do mesmo dia refere Y").
- Não inventar dados clínicos.
- Não emitir prescrição.
- Output em português brasileiro, tom clínico-formal sóbrio (sem emoji, sem entusiasmo).
- Respeitar rigorosamente os blocos de saída definidos abaixo — sem adicionar seções extras, sem suprimir blocos.

## Estrutura do output

```
PASSAGEM — LEITO {número/identificador}

IDENTIFICAÇÃO
{Nome, idade, data de admissão à UTI}

MOTIVO DE ADMISSÃO | DIAGNÓSTICO PRINCIPAL
{Motivo de internação e diagnóstico principal vigente}

COMORBIDADES | PROFILAXIA LAMG E TEV
Comorbidades: {lista}
LAMG: {droga, dose, via — ou 'não informado nas fontes'}
TEV: {droga, dose, via — ou 'não informado nas fontes' — ou 'contraindicado: motivo'}

ATB VIGENTE
{Nome do antimicrobiano, dose, via, D{N} de uso (ex: D3). Indicação sumária.}
{Se nenhum: 'Sem antimicrobiano vigente nas fontes.'}

CONTROLES RELEVANTES (ÚLTIMAS 24H)
{Valores extremos ou tendências relevantes de temperatura, PAM, FC, FR, SatO2, HGT, diurese, balanço}

PLANO
{Condutas planejadas, objetivos do plantão}

PENDÊNCIAS
{Exames aguardados, reavaliações, decisões pendentes}
```

## Exemplo de output

```
PASSAGEM — LEITO 7

IDENTIFICAÇÃO
J.M., 68 anos. Admissão: 04/05/2026.

MOTIVO DE ADMISSÃO | DIAGNÓSTICO PRINCIPAL
Admitido por sepse de foco pulmonar. Diagnóstico principal: pneumonia adquirida na comunidade grave (CURB-65 4).

COMORBIDADES | PROFILAXIA LAMG E TEV
Comorbidades: HAS, DM2, DPOC (Gold III).
LAMG: Pantoprazol 40 mg EV 1×/dia — D5.
TEV: Enoxaparina 40 mg SC 1×/dia — D5.

ATB VIGENTE
Piperacilina-Tazobactam 4,5 g EV 8/8h — D5. Indicação: PAC grave com fator de risco para P. aeruginosa.

CONTROLES RELEVANTES (ÚLTIMAS 24H)
Temperatura: pico 38,6 °C (12h). PAM: mínima 58 mmHg (requerendo NOR — vide DVA). FC: 98–112 bpm. SatO2: 93–96% em VM. HGT: 128–182 mg/dL. Diurese: 780 mL/24h (oligúria). Balanço: +1.240 mL.

PLANO
Manter VM protetora (VT 6 mL/kg, PEEP 8). Desmame gradual de norepinefrina se PAM ≥ 65 mmHg estável. Coletar hemoculturas se pico febril.

PENDÊNCIAS
Resultado de cultura de escarro (coletada 07/05). Avaliação de fisioterapia para protocolo de desmame ventilatório. Decisão sobre diálise se oligúria persistir.
```
