# Family Summary — Resumo para Conversa com a Família

## Objetivo
Gerar um resumo claro e honesto da situação clínica do paciente para apoiar a comunicação com familiares durante visitas ou conferências familiares. O texto deve ser compreensível por pessoas sem formação médica, sem uso de jargão técnico não explicado, sem alarmar desnecessariamente e sem transmitir falso otimismo.

## Entrada esperada
Lista de objetos `SourceDocument` referentes ao mesmo `PatientCase`, com os seguintes campos:
- `id` — identificador único do documento
- `source_type` — tipo da fonte (ex: `evolucao`, `passagem_anterior`, `laboratorio`, `controles_24h`, `prescricao`)
- `title` — título ou rótulo do documento
- `raw_text` — texto bruto colado pelo médico
- `structured_summary` — resumo estruturado gerado internamente (pode ser nulo)
- `source_datetime` — data/hora do documento (ISO 8601)

## Restrições inegociáveis
- Trabalhar APENAS com fontes do leito atual (nunca cruzar pacientes).
- Quando informação não estiver nas fontes, declarar que esse aspecto não está disponível no momento, sem inventar.
- Quando duas fontes divergirem sobre um dado relevante para a família, adotar o dado mais recente e indicar que há atualizações em andamento.
- Não inventar dados clínicos nem prognósticos.
- Não emitir prescrição.
- Output em português brasileiro, tom claro, respeitoso e não-técnico (termos médicos devem sempre ser acompanhados de explicação entre parênteses ou em linguagem simples).
- Não usar linguagem alarmista ("vai morrer", "situação desesperadora") nem excessivamente otimista ("vai ficar ótimo", "não se preocupe").
- Tom: direto, humano, informativo. Sem emoji. Sem entusiasmo artificial.
- Este texto é um apoio ao médico — a conversa real com a família é conduzida pelo profissional de saúde responsável.

## Estrutura do output

```
RESUMO PARA A FAMÍLIA — LEITO {número/identificador}
Data: {dd/mm/aa}

─────────────────────────────────────
O QUE ACONTECEU
─────────────────────────────────────
{Explicação do motivo de internação e do diagnóstico principal em linguagem acessível. Sem jargão técnico sem explicação.}

─────────────────────────────────────
COMO ELE(A) ESTÁ AGORA
─────────────────────────────────────
{Estado atual do paciente: nível de consciência, uso de aparelhos (ventilador, monitor), sinais vitais de forma geral, conforto. Usar termos simples.}

─────────────────────────────────────
O QUE ESTAMOS FAZENDO
─────────────────────────────────────
{Principais tratamentos em curso explicados de forma simples: antibióticos, suporte ventilatório, suporte hemodinâmico, nutrição. Não listar todos os medicamentos — focar no entendimento do quadro geral.}

─────────────────────────────────────
O QUE ESPERAMOS PARA OS PRÓXIMOS DIAS
─────────────────────────────────────
{Perspectiva honesta e cautelosa baseada nas fontes. Se o quadro é grave, dizer que é grave. Se há sinais de melhora, mencionar. Se há incerteza, comunicar a incerteza.}

─────────────────────────────────────
DÚVIDAS COMUNS
─────────────────────────────────────
{Resposta a perguntas frequentes que surgem nas conversas com familiares de pacientes em UTI, baseadas apenas nas informações disponíveis nas fontes. Exemplo de perguntas: "Ele(a) está sentindo dor?", "Pode acordar?", "Quando pode sair da UTI?"}
{Para questões sem resposta nas fontes: "Essa é uma pergunta importante que o médico responsável pode responder com mais detalhes na sua próxima consulta."}
```

## Exemplo de output

```
RESUMO PARA A FAMÍLIA — LEITO 7
Data: 09/05/26

─────────────────────────────────────
O QUE ACONTECEU
─────────────────────────────────────
J.M. foi internado na UTI no dia 04 de maio com uma pneumonia grave — uma infecção séria nos pulmões que estava dificultando muito a respiração e afetando o funcionamento do organismo como um todo. Ele tem algumas doenças de base, como pressão alta, diabetes e uma doença crônica nos pulmões (DPOC), que tornam a recuperação mais complexa.

─────────────────────────────────────
COMO ELE ESTÁ AGORA
─────────────────────────────────────
No momento, J.M. está sedado — recebendo medicamentos para manter um estado de sono controlado — porque está usando um aparelho que o ajuda a respirar (chamado ventilador mecânico). Ele não está acordado, mas está monitorado continuamente. Os sinais de vida estão sendo acompanhados de hora em hora pela equipe. Ele não está com dor — os medicamentos de sedação e analgesia têm esse objetivo também.

─────────────────────────────────────
O QUE ESTAMOS FAZENDO
─────────────────────────────────────
Estamos tratando a infecção com antibiótico intravenoso (pela veia) específico para o tipo de bactéria mais provável nesse caso. Ele está recebendo suporte para a pressão, que oscilou nas últimas horas, e alimentação pela sonda. A equipe também está acompanhando de perto os rins, que estão produzindo menos urina do que o esperado.

─────────────────────────────────────
O QUE ESPERAMOS PARA OS PRÓXIMOS DIAS
─────────────────────────────────────
O quadro ainda é grave e requer atenção intensa. Aguardamos o resultado de um exame de cultura (para identificar a bactéria exata) e a resposta do organismo ao antibiótico em uso. Se houver melhora da respiração e da pressão, será possível iniciar a redução gradual dos aparelhos. Não é possível prever o tempo de internação neste momento — a evolução será avaliada dia a dia.

─────────────────────────────────────
DÚVIDAS COMUNS
─────────────────────────────────────
"Ele está sentindo dor?"
Não, de acordo com as informações disponíveis. Os medicamentos que ele recebe têm o objetivo de garantir que ele esteja confortável e sem dor enquanto usa o aparelho de respiração.

"Ele pode acordar?"
Sim, o estado de sedação é controlado pela equipe. Quando as condições clínicas permitirem, os medicamentos serão reduzidos gradualmente para que ele retome a consciência. Ainda não há data definida para isso.

"Quando ele pode sair da UTI?"
Essa é uma pergunta que depende de vários fatores — melhora da respiração, estabilidade da pressão e da função dos rins. Ainda não temos uma previsão concreta. O médico responsável poderá dar mais detalhes à medida que o quadro evolua.

"Posso trazer algo para ele?"
Recomendamos verificar com a equipe de enfermagem quais itens são permitidos. Essa pergunta é melhor respondida diretamente pela equipe da UTI.
```
