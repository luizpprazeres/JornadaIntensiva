# Laboratory Format — Formatação de Exames Laboratoriais

## Objetivo
Compactar resultados de exames laboratoriais de um leito em **uma única linha por data**, no padrão fixo abaixo. Sem comentários interpretativos. Sem valores absolutos do leucograma. Sem HCM, CHCM, RDW, MPV, Mentzer, RDWI.

## Entrada esperada
Lista de objetos `SourceDocument` referentes ao mesmo `PatientCase`, filtrados por `source_type === "laboratory"`. Campos: `id`, `source_type`, `title`, `raw_text`, `structured_summary`, `source_datetime`, `created_at`.

## Restrições inegociáveis
- Trabalhar APENAS com fontes do leito atual (nunca cruzar pacientes).
- Quando uma análise não estiver na fonte, marcar `—` no lugar do valor.
- Quando duas fontes da MESMA data divergirem, usar a mais recente (`source_datetime` desc) e citar a divergência ao final em uma linha separada começando com `Divergência:`.
- Não inventar valores numéricos.
- Não comentar interpretação clínica (ex.: não escrever "anemia leve").
- Não copiar texto extra antes ou depois das linhas LAB.

## Estrutura do output (padrão fixo)

Cabeçalho de referência (não imprimir):
`HB | HT | VCM | LEUCO | SEG % | BAST % | LINF % | MON % | EOS % | BAS % | PLAQ | NA | K | UREIA | CR | CA ION | MG | PCR`

### Linha LAB
```
LAB (DD/MM/AA): HB X | HT X | VCM X | LEUCO X | SEG X% | BAST X% | LINF X% | MON X% | EOS X% | BAS X% | PLAQ X | NA X | K X | UREIA X | CR X | CA ION X | MG X | PCR X
```

### Comparação com anterior
- Aplica-se **APENAS** a `LEUCO` e `SEG`.
- Quando houver lab anterior do mesmo leito com valor para esses campos, formato:
  - `LEUCO X (ANTERIOR Y)`
  - `SEG X% (ANTERIOR Y%)`
- Demais parâmetros **NÃO** comparam.

### Adicionais relevantes
- Ao final da MESMA linha LAB, acrescentar exames adicionais quando aparecerem na fonte, na ordem:
  - `CK X | CKMB X | TROP X | D-DÍMERO X | GLIC X`
- Se algum não foi solicitado, omitir do final (não imprimir `—` para extras).

### Quando houver várias datas
- Imprimir uma linha LAB por data, do MAIS RECENTE para o mais antigo.
- A comparação `(ANTERIOR ...)` é feita comparando cada lab com o lab cronologicamente anterior dele.

## Exemplo de output

Caso 1 — duas datas, com comparação:
```
LAB (11/04/26): HB 12,55 | HT 35,50 | VCM 99,70 | LEUCO 6610 (ANTERIOR 6300) | SEG 77,81% (ANTERIOR 64,09%) | BAST 0,49% | LINF 20,28% | MON 0,52% | EOS 0,61% | BAS 0,29% | PLAQ 214 | NA 141,00 | K 4,65 | UREIA 28 | CR 0,88 | CA ION 4,70 | MG 1,90 | PCR 1,60
LAB (10/04/26): HB 12,30 | HT 35,10 | VCM 99,40 | LEUCO 6300 | SEG 64,09% | BAST 0,40% | LINF 28,11% | MON 0,52% | EOS 0,61% | BAS 0,29% | PLAQ 220 | NA 140,00 | K 4,30 | UREIA 30 | CR 0,90 | CA ION 4,65 | MG 1,85 | PCR 0,90
```

Caso 2 — com adicionais (CK/Trop/Glic):
```
LAB (12/04/26): HB 13,10 | HT 38,40 | VCM 90,00 | LEUCO 8100 (ANTERIOR 6610) | SEG 80,00% (ANTERIOR 77,81%) | BAST 0,30% | LINF 15,00% | MON 0,40% | EOS 0,20% | BAS 0,10% | PLAQ 200 | NA 138,00 | K 4,00 | UREIA 35 | CR 1,10 | CA ION 4,80 | MG 1,80 | PCR 4,20 | CK 320 | CKMB 12 | TROP 0,08 | D-DÍMERO 1.250 | GLIC 156
```

Caso 3 — exame parcial:
```
LAB (13/04/26): HB — | HT — | VCM — | LEUCO 9200 | SEG 82,00% | BAST 1,00% | LINF 13,00% | MON 0,50% | EOS 0,30% | BAS 0,20% | PLAQ — | NA 137,00 | K 3,80 | UREIA — | CR — | CA ION — | MG — | PCR —
Divergência: data 13/04/26 trazia dois hemogramas (06h05 e 14h22) com leucos diferentes; manteve 14h22.
```
