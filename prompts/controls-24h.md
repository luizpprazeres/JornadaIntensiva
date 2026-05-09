# Controls 24h — Controles das Últimas 24 Horas

## Objetivo
Organizar e apresentar os controles clínicos das últimas 24 horas do paciente em formato compacto, destacando valores extremos e tendências relevantes. Inclui parâmetros vitais, glicemia, balanço hídrico, diurese, fezes e, quando aplicável, ultrafiltração de diálise.

## Entrada esperada
Lista de objetos `SourceDocument` referentes ao mesmo `PatientCase`, com os seguintes campos:
- `id` — identificador único do documento
- `source_type` — tipo da fonte (ex: `controles_24h`, `evolucao`, `prescricao`, `passagem_anterior`)
- `title` — título ou rótulo do documento
- `raw_text` — texto bruto colado pelo médico
- `structured_summary` — resumo estruturado gerado internamente (pode ser nulo)
- `source_datetime` — data/hora do documento (ISO 8601)

## Restrições inegociáveis
- Trabalhar APENAS com fontes do leito atual (nunca cruzar pacientes).
- Quando informação não estiver nas fontes, declarar 'não informado nas fontes' no parâmetro correspondente.
- Quando duas fontes divergirem para o mesmo parâmetro, sinalizar a divergência citando a fonte.
- Não inventar dados clínicos.
- Não emitir prescrição nem condutas.
- Output em português brasileiro, tom clínico-formal sóbrio (sem emoji, sem entusiasmo).
- Indicar valores extremos (mínimo e máximo) para parâmetros com múltiplas aferições.
- Não interpretar clinicamente além de sinalizar valores fora da faixa de normalidade com asterisco (*).

## Estrutura do output

```
CONTROLES 24H — LEITO {número/identificador}
Período: {dd/mm/aa HH:mm} a {dd/mm/aa HH:mm} (conforme identificado nas fontes)

TEMPERATURA
Mín: {valor} °C | Máx: {valor} °C | Tendência: {estável / ascendente / descendente}

PAM (mmHg)
Mín: {valor} | Máx: {valor} | Tendência: {estável / ascendente / descendente}
{Se DVA em uso: "DVA vigente — vide prescrição."}

FC (bpm)
Mín: {valor} | Máx: {valor} | Tendência: {estável / ascendente / descendente}

FR (irpm)
Mín: {valor} | Máx: {valor}
{Se em ventilação mecânica: "Paciente em VM — FR programada: {valor}; FR total: {valor}."}

SatO2 (%)
Mín: {valor} | Máx: {valor} | FiO2/suporte: {dispositivo e parâmetro}

HGT (mg/dL)
Mín: {valor} | Máx: {valor} | Aferições: {N} vezes
{Valores fora de 70–180 mg/dL marcados com *}

DIURESE
Total 24h: {valor} mL | Débito horário médio: {valor} mL/h
{Classificação: normal (≥ 0,5 mL/kg/h) / oligúria (< 0,5) / anúria (< 100 mL/24h) — somente se peso disponível nas fontes}

BALANÇO HÍDRICO
Balanço 24h: {valor} mL ({positivo / negativo / zerado})
Balanço acumulado: {valor se disponível nas fontes — caso contrário: 'não informado nas fontes'}

FEZES
{Número de evacuações / consistência / observações — ou 'não informado nas fontes'}

DIÁLISE / UF
{Se paciente em diálise: modalidade, UF prescrita, UF realizada, intercorrências.}
{Se não aplicável ou não informado: 'não aplicável' ou 'não informado nas fontes'}

OBSERVAÇÕES
{Intercorrências relevantes do período, sinalizações de divergência entre fontes, parâmetros com dados incompletos.}
```

## Exemplo de output

```
CONTROLES 24H — LEITO 7
Período: 08/05/26 07:00 a 09/05/26 07:00

TEMPERATURA
Mín: 36,8 °C | Máx: 38,6 °C* | Tendência: ascendente (pico às 12h)

PAM (mmHg)
Mín: 56* | Máx: 74 | Tendência: instável
DVA vigente — vide prescrição.

FC (bpm)
Mín: 88 | Máx: 118* | Tendência: variável

FR (irpm)
Paciente em VM — FR programada: 14; FR total: 18.

SatO2 (%)
Mín: 91* | Máx: 97 | FiO2: 50% em VM (modo PCV)

HGT (mg/dL)
Mín: 98 | Máx: 224* | Aferições: 6 vezes
* Valor de 224 mg/dL às 22h — fora do alvo (70–180 mg/dL).

DIURESE
Total 24h: 720 mL | Débito horário médio: 30 mL/h
Oligúria (< 0,5 mL/kg/h para peso de 72 kg estimado na evolução).

BALANÇO HÍDRICO
Balanço 24h: +1.380 mL (positivo)
Balanço acumulado: não informado nas fontes

FEZES
1 evacuação (consistência pastosa). Sem sangue relatado.

DIÁLISE / UF
não aplicável

OBSERVAÇÕES
Pico febril às 12h sem novo foco identificado nas fontes. Instabilidade de PAM durante o turno noturno; conduta de ajuste de DVA não documentada nas fontes disponíveis.
```
