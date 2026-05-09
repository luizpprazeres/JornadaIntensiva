import type { PatientCase, Shift, SourceDocument } from "@/types/domain";

const d = (iso: string) => new Date(iso);
const NOW = d("2026-05-09T08:00:00");

// ─── Shift ────────────────────────────────────────────────────────────────────

const shift: Shift = {
  id: "mock-shift-1",
  label: "Plantão simulado — 09/05/2026 manhã",
  started_at: d("2026-05-09T07:00:00"),
  ended_at: null,
  created_at: NOW,
  updated_at: NOW,
};

// ─── Patient Cases ─────────────────────────────────────────────────────────────

const patientCases: PatientCase[] = [
  {
    id: "mock-bed-5",
    shift_id: "mock-shift-1",
    bed_label: "Leito 5",
    patient_name_or_identifier: "A.B.",
    age: 54,
    admission_date: d("2026-05-05T14:30:00"),
    main_diagnosis: "Sepse de foco pulmonar — PAC grave / ARDS moderado",
    current_status: "Crítico — VM + DVA",
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "mock-bed-7",
    shift_id: "mock-shift-1",
    bed_label: "Leito 7",
    patient_name_or_identifier: "J.M.",
    age: 61,
    admission_date: d("2026-05-02T03:20:00"),
    main_diagnosis: "AVC isquêmico extenso — ACM esquerda — hemicraniectomia D3",
    current_status: "Crítico — VM + sedação",
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "mock-bed-9",
    shift_id: "mock-shift-1",
    bed_label: "Leito 9",
    patient_name_or_identifier: "R.S.",
    age: 47,
    admission_date: d("2026-04-28T09:00:00"),
    main_diagnosis: "Pancreatite aguda necrosante — etiologia biliar — D12",
    current_status: "Grave — desmame de DVA",
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: "mock-bed-12",
    shift_id: "mock-shift-1",
    bed_label: "Leito 12",
    patient_name_or_identifier: "M.O.",
    age: 72,
    admission_date: d("2026-05-06T06:00:00"),
    main_diagnosis: "IAM perioperatório — ICP em DA proximal — D4 pós-ICP",
    current_status: "Estável — desmame para enfermaria",
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
  },
];

// ─── Source Documents ──────────────────────────────────────────────────────────

const sourceDocuments: SourceDocument[] = [
  // ── Leito 5 — A.B. — Sepse pulmonar ─────────────────────────────────────────

  {
    id: "mock-src-bed5-handoff",
    patient_case_id: "mock-bed-5",
    source_type: "handoff",
    title: "Passagem de plantão — Leito 5 — 09/05",
    raw_text: `PASSAGEM — LEITO 5

A.B., 54 anos. Admissão: 05/05/2026.
Motivo de admissão: sepse grave de foco pulmonar.
Diagnóstico principal: pneumonia adquirida na comunidade grave (CURB-65 4) com ARDS moderado.

Comorbidades: tabagismo ativo (30 maços-ano), DM2, hipertensão arterial sistêmica.
Profilaxia LAMG: Pantoprazol 40 mg EV 1x/dia — D5.
Profilaxia TEV: Enoxaparina 40 mg SC 1x/dia — D5.

ATB vigente: Piperacilina-Tazobactam 4,5 g EV 8/8h — D5.
Indicação: PAC grave com fator de risco para P. aeruginosa (tabagismo, uso prévio de ATB).

Controles relevantes (08/05): pico febril 38,8 °C às 16h.
PAM oscilando 58–74 mmHg com NOR 0,10 µg/kg/min.
Diurese 680 mL/24h (oligúria). Balanço +920 mL.

Plano: manter VM protetora (VC 6 mL/kg, PEEP 10, FiO2 55%). Desmame gradual de NOR se PAM ≥ 65 mmHg estável. Coletar hemoculturas em caso de novo pico febril.

Pendências: resultado de cultura de escarro (coletada 07/05). Avaliar prone se PaO2/FiO2 < 100.`,
    structured_summary: null,
    source_datetime: d("2026-05-09T07:05:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  {
    id: "mock-src-bed5-lab",
    patient_case_id: "mock-bed-5",
    source_type: "laboratory",
    title: "Laboratório — Leito 5 — 08/05",
    raw_text: `LABORATÓRIO — LEITO 5 — 08/05/2026

Hemograma:
Hb: 8,8 g/dL | Ht: 27% | VCM: 88 fL
Leucócitos: 22.400/µL (Seg 86% / Bast 4% / Linf 7% / Mon 3% / Eos 0% / Bas 0%)
Plaquetas: 98.000/µL

Bioquímica:
Sódio (Na): 131 mEq/L
Potássio (K): 3,9 mEq/L
Ureia: 74 mg/dL
Creatinina (Cr): 1,9 mg/dL (basal 0,9 em prontuário ambulatorial)
Cálcio iônico: 1,05 mmol/L
Magnésio: 1,8 mg/dL
PCR: 182 mg/L

Gasometria arterial (FiO2 55%, VM):
pH 7,38 | PaO2 68 mmHg | PaCO2 38 mmHg | HCO3 22,4 mEq/L
P/F ratio: 124 (ARDS moderado)

Obs: amostra coletada via cateter arterial. Sem hemólise.`,
    structured_summary: null,
    source_datetime: d("2026-05-08T06:30:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  {
    id: "mock-src-bed5-ctrl",
    patient_case_id: "mock-bed-5",
    source_type: "controls_24h",
    title: "Controles 24h — Leito 5 — 08–09/05",
    raw_text: `CONTROLES 24H — LEITO 5
Período: 08/05/2026 07:00 → 09/05/2026 07:00

Temperatura (°C): mínima 36,8 / máxima 38,8 (pico 16h) / média 37,4
PAM (mmHg): mínima 58 / máxima 74 — NOR 0,10 µg/kg/min às 07h; 0,08 µg/kg/min às 22h
FC (bpm): mínima 92 / máxima 118 / média 104
FR: VM ativo — FR programada 14 / FR total 17
SatO2 (%): mínima 91 / máxima 97 — FiO2 55% (VM, modo PCV)
HGT (mg/dL): 6 aferições — mínima 102 / máxima 218 (pico 22h) / pré-café 134
Diurese: 680 mL/24h / débito médio 28 mL/h (oligúria)
Balanço hídrico 24h: +920 mL
Fezes: ausentes
Diálise: não aplicável
Acesso: CVC jugular interna direita D5, sem sinais de infecção local`,
    structured_summary: null,
    source_datetime: d("2026-05-09T07:00:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  // ── Leito 7 — J.M. — AVC isquêmico + hemicraniectomia ──────────────────────

  {
    id: "mock-src-bed7-evo",
    patient_case_id: "mock-bed-7",
    source_type: "medical_evolution",
    title: "Evolução médica — Leito 7 — 09/05",
    raw_text: `EVOLUÇÃO MÉDICA — LEITO 7 — 09/05/2026 07:30

J.M., 61 anos. AVC isquêmico extenso em território da ACM esquerda.
Hemicraniectomia descompressiva realizada em 03/05/2026 — D7 de pós-operatório.

Estado geral: sedado RASS –3, sem abertura ocular espontânea.
Pupilas: AE 5 mm arreativa (pós-cirúrgica); AD 3 mm fotorreativa.
Glasgow: E1V1M3 = 5.
Curativo de hemicraniectomia íntegro, sem eritema ou saída de secreção.
Ausculta pulmonar: murmúrio vesicular presente bilateralmente, sem ruídos adventícios.
SpO2 96% em VM. Abdome flácido, sem distensão. Edema MMII 1+.

[Neurológico] AVC isquêmico extenso em evolução. Valproato de sódio 1.000 mg EV 12/12h — D7 (profilaxia de crises). RASS alvo –2 a –3.
[Respiratório] VM modo VCV: VC 500 mL, FR 14, PEEP 6, FiO2 40%. SatO2 96%.
[Hemodinâmico] PA 128/78 mmHg, FC 72 bpm. Sem DVA. Ritmo sinusal.
[Renal] Diurese 1.320 mL/24h. Cr 0,9 mg/dL. Na 148 mEq/L — atenção para diabetes insipidus central.
[Nutricional] Dieta enteral via SNE: Nutrison Diason HP 60 mL/h. Evacuação presente.

Plano: manter sedação. Repor K (3,2 mEq/L). Discutir objetivos de cuidado com família — family meeting agendado para 09/05 às 14h. TC crânio controle para 10/05.

Pendências: resultado de TC controle (10/05). Avaliação neurologia para ajuste de valproato.`,
    structured_summary: null,
    source_datetime: d("2026-05-09T07:30:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  {
    id: "mock-src-bed7-lab",
    patient_case_id: "mock-bed-7",
    source_type: "laboratory",
    title: "Laboratório — Leito 7 — 07/05",
    raw_text: `LABORATÓRIO — LEITO 7 — 07/05/2026

Hemograma:
Hb: 10,2 g/dL | Ht: 31% | VCM: 90 fL
Leucócitos: 11.200/µL (Seg 74% / Bast 1% / Linf 19% / Mon 6% / Eos 0% / Bas 0%)
Plaquetas: 244.000/µL

Bioquímica:
Sódio (Na): 148 mEq/L — hipernatremia, suspeita de diabetes insipidus central
Potássio (K): 3,2 mEq/L
Ureia: 42 mg/dL
Creatinina (Cr): 0,9 mg/dL
Magnésio: 2,0 mg/dL
PCR: 24 mg/L

Obs: amostra coletada via CVC. Hipernatremia em investigação. Solicitar osmolalidade urinária e sérica conforme orientação neurológica.`,
    structured_summary: null,
    source_datetime: d("2026-05-07T06:00:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  {
    id: "mock-src-bed7-presc",
    patient_case_id: "mock-bed-7",
    source_type: "prescription",
    title: "Prescrição — Leito 7 — 08/05",
    raw_text: `PRESCRIÇÃO — LEITO 7 — 08/05/2026

1. Midazolam 10 mg + SF 0,9% 50 mL — BIC 2 mL/h (ajustar para RASS –2 a –3)
2. Fentanil 500 µg + SF 0,9% 50 mL — BIC 3 mL/h
3. Valproato de sódio 1.000 mg EV 12/12h (diluir em 100 mL SF, 30 min)
4. Pantoprazol 40 mg EV 1x/dia
5. Enoxaparina: SUSPENSA — aguardar 48h pós-cirurgia conforme neurocirurgia
6. Dipirona 1 g EV 6/6h se T > 37,8 °C ou dor (escala BPS)
7. Cloreto de potássio 19,1% 20 mL + SF 0,9% 100 mL EV em 2h (K 3,2 mEq/L)
8. Reposição de sódio livre restrita — ver protocolo de hipernatremia
9. Nutrição enteral via SNE: Nutrison Diason HP 60 mL/h — meta 1.800 kcal/dia
10. HGT 6/6h — alvo 140–180 mg/dL
11. VM: VCV, VC 500 mL, FR 14, PEEP 6, FiO2 40%
12. Cabeceira 30°. Fisioterapia respiratória 2x/dia.`,
    structured_summary: null,
    source_datetime: d("2026-05-08T08:00:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  // ── Leito 9 — R.S. — Pancreatite necrosante ─────────────────────────────────

  {
    id: "mock-src-bed9-handoff",
    patient_case_id: "mock-bed-9",
    source_type: "handoff",
    title: "Passagem de plantão — Leito 9 — 09/05",
    raw_text: `PASSAGEM — LEITO 9

R.S., 47 anos. Admissão: 28/04/2026. D12 de pancreatite aguda necrosante, etiologia biliar.
Diagnóstico: pancreatite necrosante com coleção peri-pancreática e bacteremia por Klebsiella pneumoniae (hemocultura positiva 02/05).

Comorbidades: colecistolitíase (colecistectomia planejada pós-recuperação). Etilismo social eventual.
Profilaxia LAMG: Pantoprazol 40 mg EV 1x/dia — D12.
Profilaxia TEV: Heparina não-fracionada 5.000 UI SC 8/8h — D12 (enoxaparina evitada — TFG 28 mL/min/1,73m²).

ATB vigente: Meropeném 1 g EV 8/8h — D7 (dose ajustada para TFG 28).
Indicação: bacteremia por K. pneumoniae sensível confirmada em hemocultura 02/05.

Controles (08/05): afebril nas últimas 36h. PAM estabilizou sem DVA desde 08/05 às 04h. Diurese 1.100 mL/24h (melhora). Balanço +320 mL.

Plano: manter meropeném (meta D7→D14). TC abdome controle em 11/05. Cirurgia de plantão comunicada — discutir necrosectomia se piora ou infecção de necrose confirmada.

Pendências: resultado de hemocultura de controle (07/05 — pendente). TGO/TGP e bilirrubinas de hoje.`,
    structured_summary: null,
    source_datetime: d("2026-05-09T07:10:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  {
    id: "mock-src-bed9-ctrl",
    patient_case_id: "mock-bed-9",
    source_type: "controls_24h",
    title: "Controles 24h — Leito 9 — 08–09/05",
    raw_text: `CONTROLES 24H — LEITO 9
Período: 08/05/2026 07:00 → 09/05/2026 07:00

Temperatura (°C): mínima 36,6 / máxima 37,2 (afebril no período)
PAM (mmHg): mínima 68 / máxima 88 — sem DVA desde 08/05 04:00
FC (bpm): mínima 78 / máxima 96 / média 86
FR (irpm): 16–20 (ar ambiente, cateter nasal 2 L/min em desmame)
SatO2 (%): mínima 94 / máxima 98 — cateter nasal 2 L/min
HGT (mg/dL): 4 aferições — mínima 128 / máxima 174
Diurese: 1.100 mL/24h / débito médio 46 mL/h (melhora)
Balanço hídrico 24h: +320 mL
Fezes: 1 evacuação, consistência pastosa, sem sangue visível
Diálise: não aplicável
Acesso: CVC subclávia esquerda D12, PICC em MSE D5 para ATB`,
    structured_summary: null,
    source_datetime: d("2026-05-09T07:00:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  {
    id: "mock-src-bed9-note",
    patient_case_id: "mock-bed-9",
    source_type: "physician_note",
    title: "Nota de intercorrência — Leito 9 — 09/05 02:30",
    raw_text: `NOTA DO PLANTONISTA — LEITO 9 — 09/05/2026 02:30

Chamada pela enfermagem por piora de dor abdominal.
R.S. relata dor em epigástrio e flancos — EVA 8/10 às 01:45h.
Administrado morfina 4 mg EV em bolus às 01:50h.
Reavaliação às 02:20h: EVA 4/10. Melhora parcial.

EF no momento: abdome distendido, dor à palpação difusa em andar superior, sem defesa ou peritonismo. Ruídos hidroaéreos presentes e diminuídos.
T 36,8 °C, PA 134/82 mmHg, FC 102 bpm (transitório — reverteu após analgesia para 88 bpm), SatO2 97%.

Conduta: manter morfina EV conforme protocolo de analgesia. Repetir avaliação em 2h.
Se EVA > 6 novamente ou febre > 38 °C: acionar cirurgião de plantão para avaliação imediata.

Cirurgia ciente via telefone às 02:35h. Aguardando evolução.`,
    structured_summary: null,
    source_datetime: d("2026-05-09T02:30:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  // ── Leito 12 — M.O. — IAM perioperatório ────────────────────────────────────

  {
    id: "mock-src-bed12-evo",
    patient_case_id: "mock-bed-12",
    source_type: "medical_evolution",
    title: "Evolução médica — Leito 12 — 09/05",
    raw_text: `EVOLUÇÃO MÉDICA — LEITO 12 — 09/05/2026 08:00

M.O., 72 anos. IAM tipo 1 de parede anterior (IAMCSST) com início durante cirurgia de fratura de fêmur esquerdo em 04/05/2026. ICP de emergência com stent em DA proximal em 05/05/2026. D4 de pós-ICP.

Estado geral: acordado, orientado em tempo e espaço, colaborativo. Referindo discreta dispneia ao esforço. Sem dor torácica no momento.
Ausculta pulmonar: estertores crepitantes finos em bases bilaterais.
Ausculta cardíaca: RCR2T, sem sopros audíveis.
MMII: edema 2+ bilateral simétrico.
Curativo cirúrgico (coxa esquerda): íntegro, sem sinais de infecção.

[Cardíaco] Monitorização contínua. Ritmo sinusal, FC 68 bpm. ECG hoje sem supradesnivelamento. Troponina em queda (série em andamento).
[Respiratório] Em ar ambiente. SpO2 94%. Estertores em bases — congestão pulmonar leve provável.
[Hemodinâmico] PA 118/74 mmHg. Sem DVA. Betabloqueador, AAS, clopidogrel, estatina em uso.
[Renal] Cr 1,4 mg/dL (basal referida 1,1). Diurese 1.480 mL/24h. Monitorar Cr com ramipril.

Plano: manter dupla antiagregação sem interrupção. Ecocardiograma solicitado (resultado pendente). Fisioterapia motora para mobilização precoce (ortopedia). Avaliar alta para enfermaria se mantiver estabilidade nas próximas 12h.

Pendências: ecocardiograma (solicitado 08/05 — resultado pendente). Avaliação de ortopedia para planejamento de reabilitação.`,
    structured_summary: null,
    source_datetime: d("2026-05-09T08:00:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  {
    id: "mock-src-bed12-lab",
    patient_case_id: "mock-bed-12",
    source_type: "laboratory",
    title: "Laboratório — Leito 12 — 09/05",
    raw_text: `LABORATÓRIO — LEITO 12 — 09/05/2026

Hemograma:
Hb: 9,4 g/dL | Ht: 29% | VCM: 87 fL
Leucócitos: 9.800/µL (Seg 72% / Bast 1% / Linf 20% / Mon 7% / Eos 0% / Bas 0%)
Plaquetas: 312.000/µL

Bioquímica:
Sódio (Na): 138 mEq/L
Potássio (K): 4,0 mEq/L
Ureia: 38 mg/dL
Creatinina (Cr): 1,4 mg/dL (basal 1,1 referida)
Magnésio: 2,1 mg/dL
PCR: 41 mg/L

Troponina I alta sensibilidade (série):
— 05/05/2026 (pico estimado): 18.400 ng/L
— 07/05/2026: 4.200 ng/L
— 09/05/2026 (06h): 1.100 ng/L — em queda esperada pós-ICP

Obs: queda de troponina compatível com evolução pós-ICP sem re-oclusão. Sem elevação nova detectada.`,
    structured_summary: null,
    source_datetime: d("2026-05-09T06:00:00"),
    created_at: NOW,
    updated_at: NOW,
  },

  {
    id: "mock-src-bed12-presc",
    patient_case_id: "mock-bed-12",
    source_type: "prescription",
    title: "Prescrição — Leito 12 — 08/05",
    raw_text: `PRESCRIÇÃO — LEITO 12 — 08/05/2026

1. AAS 100 mg VO 1x/dia (após alimentação) — manter sem interrupção
2. Clopidogrel 75 mg VO 1x/dia — manter sem interrupção (stent D3)
3. Atorvastatina 80 mg VO ao deitar
4. Metoprolol succinato 25 mg VO 1x/dia
5. Ramipril 2,5 mg VO 1x/dia — monitorar Cr e K
6. Pantoprazol 40 mg VO 1x/dia (proteção gástrica com dupla antiagregação)
7. Enoxaparina 40 mg SC 1x/dia (profilaxia TEV pós-cirúrgico ortopédico)
8. Furosemida 20 mg EV se SatO2 < 93% ou sinais de congestão progressiva
9. Dipirona 1 g EV 6/6h se dor
10. Dieta cardioprotegida hipossódica VO — conforme aceitação
11. HGT 6/6h — alvo 140–180 mg/dL
12. Fisioterapia motora e respiratória 2x/dia
13. Monitorização cardíaca contínua. ECG diário.`,
    structured_summary: null,
    source_datetime: d("2026-05-08T08:00:00"),
    created_at: NOW,
    updated_at: NOW,
  },
];

// ─── Export ────────────────────────────────────────────────────────────────────

export const MOCK_DATA: {
  shift: Shift;
  patientCases: PatientCase[];
  sourceDocuments: SourceDocument[];
} = {
  shift,
  patientCases,
  sourceDocuments,
};
