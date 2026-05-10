import type { ClinicalAI, ClinicalSnapshotInput } from "@/lib/ai";
import type {
  ClinicalSnapshot,
  Divergence,
  FreshnessEntry,
  Gap,
  GapSeverity,
  IngestedFragment,
  PatientCase,
  PrescriptionReviewItem,
  SourceDocument,
  SourceType,
} from "@/types/domain";

const missing = "não informado nas fontes";
const limitation = "Baseado apenas nas fontes inseridas neste leito.";

type SnapshotField = keyof ClinicalSnapshotInput;

type FieldRule = {
  field: SnapshotField;
  keywords: string[];
};

type LabField = {
  label: string;
  regexes: RegExp[];
};

type ControlField = {
  label: string;
  regexes: RegExp[];
};

export function extractByKeywords(text: string, keywords: string[]): string | null {
  const normalizedKeywords = keywords.map((keyword) => keyword.toLocaleLowerCase("pt-BR"));
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    lines.find((line) => {
      const normalizedLine = line.toLocaleLowerCase("pt-BR");
      return normalizedKeywords.some((keyword) => normalizedLine.includes(keyword));
    }) ?? null
  );
}

export function joinSources(sources: SourceDocument[]): string {
  return sources
    .map((source) => {
      const datetime = source.source_datetime ? pt(source.source_datetime) : "sem data";
      return `— [${source.source_type}, ${datetime}, ${source.id}] —\n${source.raw_text}`;
    })
    .join("\n\n");
}

export function pt(date: Date | null | undefined): string {
  if (!date) {
    return "—";
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
}

const fieldRules: FieldRule[] = [
  {
    field: "main_diagnosis",
    keywords: ["diagnóstico", "diagnostico", "motivo", "admissão", "admissao", "sepse", "choque"],
  },
  {
    field: "active_problems",
    keywords: ["problema", "ativo", "pendência", "pendencia", "insuficiência", "disfunção"],
  },
  {
    field: "respiratory_status",
    keywords: ["ventilação", "ventilacao", "vm", "peep", "fio2", "sat", "sato2", "fr", "tubo"],
  },
  {
    field: "hemodynamic_status",
    keywords: ["hemodin", "pam", "noradrenalina", "nora", "vasopressor", "dva", "choque"],
  },
  {
    field: "renal_status",
    keywords: ["renal", "diurese", "creatinina", "ureia", "diálise", "dialise", "balanço"],
  },
  {
    field: "infectious_status",
    keywords: ["infecção", "infeccao", "sepse", "pcr", "febre", "cultura", "atb", "antibiótico"],
  },
  {
    field: "nutrition_status",
    keywords: ["dieta", "nutri", "enteral", "parenteral", "jejum", "sonda"],
  },
  {
    field: "antibiotics",
    keywords: ["atb", "antibiótico", "antibiotico", "cef", "piperacilina", "tazobactam", "mero", "vanco"],
  },
  {
    field: "vasoactive_drugs",
    keywords: ["noradrenalina", "nora", "vasopressina", "dobutamina", "dva", "vasoativa"],
  },
  {
    field: "sedation_analgesia",
    keywords: ["sedação", "sedacao", "analgesia", "fentanil", "midazolam", "propofol", "dexmedetomidina"],
  },
  {
    field: "devices",
    keywords: ["cateter", "cvc", "sne", "svd", "tubo", "dreno", "acesso", "sonda"],
  },
  {
    field: "latest_labs",
    keywords: ["hb", "ht", "leuco", "plaqueta", "plq", "sódio", "sodio", "potássio", "potassio", "cr", "pcr"],
  },
  {
    field: "latest_controls",
    keywords: ["temp", "temperatura", "pam", "fr", "fc", "sato2", "sat", "hgt", "diurese", "balanço", "fezes"],
  },
  {
    field: "pending_items",
    keywords: ["pendente", "pendência", "pendencia", "aguarda", "programado", "solicitado"],
  },
  {
    field: "plan",
    keywords: ["plano", "conduta", "manter", "monitorar", "reavaliar", "programar"],
  },
];

const prescriptionCategories: Array<{ category: string; keywords: string[] }> = [
  { category: "ATB", keywords: ["atb", "antibiótico", "antibiotico", "cef", "mero", "vanco"] },
  { category: "profilaxia TEV", keywords: ["tev", "trombose", "heparina", "enoxaparina"] },
  { category: "profilaxia LAMG", keywords: ["lamg", "omeprazol", "pantoprazol", "profilaxia gástrica"] },
  { category: "dieta/nutrição", keywords: ["dieta", "nutri", "enteral", "parenteral", "jejum"] },
  { category: "hidratação", keywords: ["hidratação", "hidratacao", "soro", "ringer", "sf 0,9"] },
  { category: "eletrólitos", keywords: ["sódio", "sodio", "potássio", "potassio", "k ", "mg", "magnésio"] },
  { category: "insulina/HGT", keywords: ["insulina", "hgt", "glicemia", "dextro"] },
  { category: "sedação/analgesia", keywords: ["sedação", "sedacao", "analgesia", "fentanil", "midazolam"] },
  { category: "drogas vasoativas", keywords: ["noradrenalina", "nora", "vasopressina", "dobutamina", "dva"] },
  { category: "ventilação mecânica", keywords: ["ventilação", "ventilacao", "vm", "peep", "fio2"] },
  { category: "dispositivos invasivos", keywords: ["cateter", "cvc", "svd", "tubo", "dreno", "sonda"] },
  { category: "exames pendentes", keywords: ["exame", "cultura", "tc", "rx", "usg", "pendente"] },
  { category: "condutas pendentes", keywords: ["conduta", "pendente", "aguarda", "programado", "solicitado"] },
];

/**
 * Padrão LAB (linha única, caixa-alta, ordem fixa).
 * Sem valores absolutos do leucograma. Sem HCM, CHCM, RDW, MPV, Mentzer, RDWI.
 * Comparação com anterior aplica-se APENAS a LEUCO e SEG (tratadas no formatLaboratory).
 */
const labFields: LabField[] = [
  { label: "HB", regexes: [/\bHb[:\s=]+([\d,.]+)/i, /Hemoglobina[:\s=]+([\d,.]+)/i] },
  { label: "HT", regexes: [/\bHt[:\s=]+([\d,.]+)/i, /Hemat[oó]crito[:\s=]+([\d,.]+)/i] },
  { label: "VCM", regexes: [/\bVCM[:\s=]+([\d,.]+)/i] },
  { label: "LEUCO", regexes: [/\bLeuco(?:citos)?[:\s=]+([\d.,]+)/i] },
  { label: "SEG", regexes: [/\bSeg(?:mentados)?[:\s=]+([\d,.]+)\s*%?/i] },
  { label: "BAST", regexes: [/\bBast(?:ões|oes)?[:\s=]+([\d,.]+)\s*%?/i] },
  { label: "LINF", regexes: [/\bLinf(?:ócitos|ocitos)?[:\s=]+([\d,.]+)\s*%?/i] },
  { label: "MON", regexes: [/\bMon(?:ócitos|ocitos)?[:\s=]+([\d,.]+)\s*%?/i] },
  { label: "EOS", regexes: [/\bEos(?:inófilos|inofilos)?[:\s=]+([\d,.]+)\s*%?/i] },
  { label: "BAS", regexes: [/\bBas(?:ófilos|ofilos)?[:\s=]+([\d,.]+)\s*%?/i] },
  { label: "PLAQ", regexes: [/\b(?:Plq|Plaquetas?)[:\s=]+([\d.,]+)/i] },
  { label: "NA", regexes: [/\bNa\+?[:\s=]+([\d,.]+)/i, /S[oó]dio[:\s=]+([\d,.]+)/i] },
  { label: "K", regexes: [/\bK\+?[:\s=]+([\d,.]+)/i, /Pot[aá]ssio[:\s=]+([\d,.]+)/i] },
  { label: "UREIA", regexes: [/\bUreia[:\s=]+([\d,.]+)/i] },
  { label: "CR", regexes: [/\b(?:Cr|Creatinina)[:\s=]+([\d,.]+)/i] },
  { label: "CA ION", regexes: [/\bCa(?:lcio)?\s*ion(?:izado)?[:\s=]+([\d,.]+)/i, /\bC[aá]lcio\s+i[oô]nico[:\s=]+([\d,.]+)/i] },
  { label: "MG", regexes: [/\bMg\+?\+?[:\s=]+([\d,.]+)/i, /Magn[eé]sio[:\s=]+([\d,.]+)/i] },
  { label: "PCR", regexes: [/\bPCR[:\s=]+([\d,.]+)/i] },
];

/**
 * Campos opcionais — só aparecem na linha LAB se mencionados na fonte.
 * Aparecem ao FINAL da linha, na ordem definida abaixo.
 */
const labExtraFields: LabField[] = [
  { label: "CK", regexes: [/\bCK[:\s=]+([\d,.]+)/i] },
  { label: "CKMB", regexes: [/\bCK[-\s]?MB[:\s=]+([\d,.]+)/i] },
  { label: "TROP", regexes: [/\bTrop(?:onina)?[:\s=]+([\d,.<>]+)/i] },
  { label: "D-DÍMERO", regexes: [/\bD[\s-]?D[ií]mero[:\s=]+([\d,.<>]+)/i] },
  { label: "GLIC", regexes: [/\bGlicemia[:\s=]+([\d,.]+)/i, /\bGlic\.?[:\s=]+([\d,.]+)/i] },
];

/**
 * Padrão IMAGE (linha única, caixa-alta).
 * Estrutura: NOME DO EXAME (DATA): IMPRESSÃO PRINCIPAL
 * A heurística pega o título do source ou tenta extrair "TC ...", "RX ...", "USG ..." da primeira linha.
 */
const IMAGING_NAME_PATTERNS: Array<{ regex: RegExp; canonical: string }> = [
  { regex: /\bTC\s+(?:de\s+)?cr[aâ]nio\b/i, canonical: "TC DE CRÂNIO" },
  { regex: /\bTC\s+(?:de\s+)?t[oó]rax\b/i, canonical: "TC DE TÓRAX" },
  { regex: /\bTC\s+(?:de\s+)?abdome\b/i, canonical: "TC DE ABDOME" },
  { regex: /\bTC\s+(?:de\s+)?pelv(?:e|is)\b/i, canonical: "TC DE PELVE" },
  { regex: /\bRX\s+(?:de\s+)?t[oó]rax\b/i, canonical: "RX DE TÓRAX" },
  { regex: /\bRX\s+(?:de\s+)?abdome\b/i, canonical: "RX DE ABDOME" },
  { regex: /\bUSG\s+(?:de\s+)?abdome\b/i, canonical: "USG DE ABDOME" },
  { regex: /\bUSG\s+(?:de\s+)?vias\s+urin[aá]rias\b/i, canonical: "USG VIAS URINÁRIAS" },
  { regex: /\bUSG\s+ponto\s+de\s+cuidado\b/i, canonical: "USG PONTO DE CUIDADO" },
  { regex: /\bEcocardiograma\b/i, canonical: "ECOCARDIOGRAMA" },
  { regex: /\bRessonância\b|\bRM\b/i, canonical: "RM" },
  { regex: /\bAngio\s*TC\b/i, canonical: "ANGIO-TC" },
  { regex: /\bDoppler\b/i, canonical: "DOPPLER" },
];

const controlFields: ControlField[] = [
  { label: "Temp", regexes: [/Temp(?:eratura)?[:\s]+([\d,.]+)/i] },
  { label: "PAM", regexes: [/PAM[:\s]+([\d,.]+)/i] },
  { label: "FR", regexes: [/\bFR[:\s]+([\d,.]+)/i] },
  { label: "FC", regexes: [/\bFC[:\s]+([\d,.]+)/i] },
  { label: "SatO2", regexes: [/SatO?2?[:\s]+([\d,.]+%?)/i, /Satura[cç][aã]o[:\s]+([\d,.]+%?)/i] },
  { label: "HGT", regexes: [/HGT[:\s]+([\d,.]+)/i, /Glicemia[:\s]+([\d,.]+)/i] },
  { label: "diurese", regexes: [/Diurese[:\s]+([^\n;]+)/i] },
  { label: "balanço", regexes: [/Balan[cç]o(?: h[ií]drico)?[:\s]+([^\n;]+)/i] },
  { label: "fezes", regexes: [/Fezes[:\s]+([^\n;]+)/i, /Evacua[cç][aã]o[:\s]+([^\n;]+)/i] },
  { label: "UF", regexes: [/\bUF[:\s]+([^\n;]+)/i, /Ultrafiltra[cç][aã]o[:\s]+([^\n;]+)/i] },
];

function assertSinglePatientCase(patientCase: PatientCase, sources: SourceDocument[]): void {
  const foreign = sources.find((source) => source.patient_case_id !== patientCase.id);

  if (foreign) {
    throw new Error("Fontes de outro leito foram recusadas pela camada de IA.");
  }
}

function sourcesByType(sources: SourceDocument[], sourceType: SourceType): SourceDocument[] {
  return sources.filter((source) => source.source_type === sourceType);
}

function firstExtract(sources: SourceDocument[], keywords: string[]): string {
  const text = joinSources(sources);
  return extractByKeywords(text, keywords) ?? missing;
}

function extractAllByKeywords(sources: SourceDocument[], keywords: string[]): string[] {
  const lowerKeywords = keywords.map((keyword) => keyword.toLocaleLowerCase("pt-BR"));

  return sources.flatMap((source) =>
    source.raw_text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => {
        const normalized = line.toLocaleLowerCase("pt-BR");
        return lowerKeywords.some((keyword) => normalized.includes(keyword));
      }),
  );
}

function appendDivergenceNote(value: string, sources: SourceDocument[], keywords: string[]): string {
  const lines = Array.from(new Set(extractAllByKeywords(sources, keywords)));

  if (lines.length < 2) {
    return value;
  }

  const hasNegation = lines.some((line) => /\b(nega|sem|ausente|não|nao)\b/i.test(line));
  const hasPositive = lines.some((line) => !/\b(nega|sem|ausente|não|nao)\b/i.test(line));

  if (!hasNegation || !hasPositive) {
    return value;
  }

  return `${value}\nPossível divergência entre fontes: ${lines.slice(0, 3).join(" | ")}`;
}

function generateSnapshotFromSources(sources: SourceDocument[]): ClinicalSnapshotInput {
  const clinicalFields = fieldRules.reduce(
    (snapshot, rule) => ({
      ...snapshot,
      [rule.field]: appendDivergenceNote(firstExtract(sources, rule.keywords), sources, rule.keywords),
    }),
    {
      main_diagnosis: missing,
      active_problems: missing,
      respiratory_status: missing,
      hemodynamic_status: missing,
      renal_status: missing,
      infectious_status: missing,
      nutrition_status: missing,
      antibiotics: missing,
      vasoactive_drugs: missing,
      sedation_analgesia: missing,
      devices: missing,
      latest_labs: missing,
      latest_controls: missing,
      pending_items: missing,
      plan: missing,
    },
  );

  return {
    ...clinicalFields,
    cited_source_ids: sources.map((s) => s.id),
    divergences: [],
    provider: "heuristic",
    model: null,
  };
}

function snapshotToInput(snapshot: ClinicalSnapshot): ClinicalSnapshotInput {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, patient_case_id, updated_at, version, ...input } = snapshot;
  return input;
}

function present(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "" || value === missing) {
    return "—";
  }

  return String(value);
}

function extractRegex(text: string, regexes: RegExp[]): string {
  for (const regex of regexes) {
    const match = regex.exec(text);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return "—";
}

function sourceDate(source: SourceDocument): Date | null {
  return source.source_datetime ?? source.created_at ?? null;
}

/**
 * Heurística para extrair a IMPRESSÃO PRINCIPAL de um laudo de imagem.
 * Procura blocos como "Impressão diagnóstica:", "Conclusão:", "Opinião:", "Comentário final:".
 * Se não encontrar, condensa o texto em uma frase curta sem boilerplate.
 */
function extractImagingImpression(rawText: string): string {
  const text = rawText.replace(/\r/g, "").trim();

  const cuePatterns = [
    /(?:impress[aã]o\s+diagn[oó]stica|impress[aã]o|conclus[aã]o|opini[aã]o|coment[aá]rio\s+final)\s*[:\-]\s*([\s\S]+)/i,
  ];

  for (const cue of cuePatterns) {
    const m = text.match(cue);
    if (m && m[1]) {
      return condenseImpression(m[1]);
    }
  }

  // Fallback: tenta últimas 3 linhas significativas (laudos costumam terminar na conclusão)
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^(t[eé]cnica|paciente|protocolo|comparativo|m[eé]todo)\b/i.test(l));

  if (lines.length === 0) {
    return "AGUARDA LAUDO";
  }

  return condenseImpression(lines.slice(-3).join(" "));
}

function condenseImpression(raw: string): string {
  // Remove introduções genéricas e separa em até 3 achados clínicos.
  const cleaned = raw
    .replace(/\s+/g, " ")
    .replace(/^[\s.;:,-]+/, "")
    .replace(/\b(observa[-\s]se|nota[-\s]se|verifica[-\s]se|presença\s+de|ausência\s+de)\s+/gi, "")
    .trim();

  // Quebra em sentenças e pega no máximo 3, separadas por "; ".
  const sentences = cleaned
    .split(/(?<=[.;])\s+|(?<=\.)\s*$/)
    .map((s) => s.replace(/[.;]+$/, "").trim())
    .filter((s) => s.length > 3);

  const top = sentences.slice(0, 3).join("; ");
  const result = top.length > 0 ? top : cleaned;

  // Se o laudo for explicitamente parcial:
  if (/aguarda(?:r|ndo)?\s+laudo|laudo\s+pendente|preliminar/i.test(result)) {
    return result.toUpperCase();
  }

  return result.length > 220 ? `${result.slice(0, 217).trim()}...` : result;
}

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLocaleLowerCase("pt-BR")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .split(/[^a-z0-9]+/i)
        .filter((token) => token.length >= 3),
    ),
  );
}

function scoreLine(line: string, tokens: string[]): number {
  const normalized = tokenize(line);
  return tokens.filter((token) => normalized.includes(token)).length;
}

function splitRawTextIntoBlocks(rawText: string): string[] {
  const normalized = rawText.replace(/\r/g, "").trim();

  if (!normalized) {
    return [];
  }

  const doubleBlankBlocks = normalized
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (doubleBlankBlocks.length > 1) {
    return doubleBlankBlocks;
  }

  return normalized
    .split(/(?=\n\s*(?:passagem de plantão|passagem de plantao|evolução|evolucao|prescrição|prescricao|laborat[oó]rio|controles?\s*24h|tc\b|rx\b|usg\b))/i)
    .map((block) => block.trim())
    .filter(Boolean);
}

function classifyBlock(block: string): {
  sourceType: SourceType;
  confidence: number;
  rationaleKeyword: string;
} {
  const text = block.toLocaleLowerCase("pt-BR");

  if (/\b(pam|fc|fr|sato2|sat\s*o2|hgt)\b/i.test(block)) {
    return { sourceType: "controls_24h", confidence: 0.95, rationaleKeyword: "PAM/FC/FR/SatO2/HGT" };
  }
  if (/\b(hb|ht|leuco|plq|plaquetas?|na|k|ureia|cr|creatinina)\b/i.test(block)) {
    return { sourceType: "laboratory", confidence: 0.95, rationaleKeyword: "Hb/Ht/Leuco/Plq/Na/K/Ureia/Cr" };
  }
  if (/\b(tc|rx|usg|ecocardiograma|impress[aã]o diagn[oó]stica)\b/i.test(block)) {
    return { sourceType: "imaging", confidence: 0.95, rationaleKeyword: "TC/RX/USG/ecocardiograma/impressão diagnóstica" };
  }
  if (/^\s*passagem de plant[aã]o/i.test(block) || /\bleito\s*\d+\b.*\bleito\s*\d+\b/is.test(block)) {
    return { sourceType: "handoff", confidence: 0.95, rationaleKeyword: "Passagem de plantão/lista de leitos" };
  }
  if (/\bevolu[cç][aã]o\b/i.test(block) && /\b(plano|respirat[oó]rio|hemodin[aâ]mico|renal|infeccioso)\b/i.test(block)) {
    return { sourceType: "medical_evolution", confidence: 0.9, rationaleKeyword: "Evolução com plano por sistema" };
  }
  if (/^\s*(?:\d+[\).:-]|\-)\s+/m.test(block) && /\b(?:mg|ml|mcg|ev|vo|sc|iv|ui)\b/i.test(block)) {
    return { sourceType: "prescription", confidence: 0.9, rationaleKeyword: "lista numerada com dose/via" };
  }
  if (text.includes("prescrição") || text.includes("prescricao")) {
    return { sourceType: "prescription", confidence: 0.9, rationaleKeyword: "prescrição" };
  }

  return { sourceType: "physician_note", confidence: 0.7, rationaleKeyword: "texto clínico inespecífico" };
}

function parseFragmentDate(block: string): Date | null {
  const dateMatch = /(\d{2})\/(\d{2})(?:\/(\d{2,4}))?/.exec(block);

  if (!dateMatch) {
    return null;
  }

  const hourMatch = /(\d{1,2})h(\d{2})?/.exec(block);
  const currentYear = new Date().getFullYear();
  const yearRaw = dateMatch[3];
  const year =
    yearRaw === undefined
      ? currentYear
      : yearRaw.length === 2
        ? 2000 + Number(yearRaw)
        : Number(yearRaw);
  const month = Number(dateMatch[2]) - 1;
  const day = Number(dateMatch[1]);
  const hour = hourMatch ? Number(hourMatch[1]) : 0;
  const minute = hourMatch?.[2] ? Number(hourMatch[2]) : 0;
  const parsed = new Date(year, month, day, hour, minute);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function titleForFragment(sourceType: SourceType, sourceDatetime: Date | null): string | null {
  if (!sourceDatetime) {
    return null;
  }

  const hour = `${String(sourceDatetime.getHours()).padStart(2, "0")}h${String(
    sourceDatetime.getMinutes(),
  ).padStart(2, "0")}`;

  if (sourceType === "laboratory") return `LAB ${hour}`;
  if (sourceType === "controls_24h") return `Controles ${hour}`;
  if (sourceType === "imaging") return `Imagem ${hour}`;
  if (sourceType === "handoff") return `Passagem ${hour}`;
  if (sourceType === "prescription") return `Prescrição ${hour}`;
  if (sourceType === "medical_evolution") return `Evolução ${hour}`;

  return null;
}

const freshnessCategories: Array<{
  category: SourceType;
  label: string;
  windowMinutes: number;
  essential: boolean;
}> = [
  { category: "handoff", label: "Passagem de plantão", windowMinutes: 12 * 60, essential: true },
  { category: "prescription", label: "Prescrição médica", windowMinutes: 24 * 60, essential: true },
  { category: "controls_24h", label: "Controles 24h", windowMinutes: 6 * 60, essential: true },
  { category: "laboratory", label: "Laboratório", windowMinutes: 24 * 60, essential: true },
  { category: "medical_evolution", label: "Evolução médica", windowMinutes: 12 * 60, essential: false },
  { category: "imaging", label: "Imagem", windowMinutes: 7 * 24 * 60, essential: false },
  { category: "diarist_evolution", label: "Evolução do diarista", windowMinutes: 24 * 60, essential: false },
];

const severityRank: Record<GapSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function mostRecentSourceDate(sources: SourceDocument[]): Date | null {
  return sources.reduce<Date | null>((latest, source) => {
    const candidate = source.source_datetime ?? source.created_at;

    if (!latest || candidate.getTime() > latest.getTime()) {
      return candidate;
    }

    return latest;
  }, null);
}

function freshnessStatus(
  ageMinutes: number | null,
  windowMinutes: number,
): FreshnessEntry["status"] {
  if (ageMinutes === null) return "missing";
  if (ageMinutes <= windowMinutes) return "fresh";
  if (ageMinutes <= windowMinutes * 2) return "aging";
  return "stale";
}

function hoursText(minutes: number): string {
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

export function createHeuristicAI(): ClinicalAI {
  return {
    providerName: "heuristic",
    modelName: null,

    async generateClinicalSnapshot({ patientCase, sources }) {
      assertSinglePatientCase(patientCase, sources);
      return generateSnapshotFromSources(sources);
    },

    async generateHandoff({ patientCase, sources, snapshot }) {
      assertSinglePatientCase(patientCase, sources);
      const data = snapshot ? snapshotToInput(snapshot) : generateSnapshotFromSources(sources);

      const body = [
        limitation,
        `Leito ${present(patientCase.bed_label)} – ${present(patientCase.patient_name_or_identifier)}, ${present(patientCase.age)}a, adm. ${pt(patientCase.admission_date)}.`,
        `Motivo de admissão | diagnóstico principal: ${present(data.main_diagnosis)}.`,
        "Comorbidades | profilaxia LAMG e TEV: —.",
        `ATB vigente: ${present(data.antibiotics)}.`,
        `Controles relevantes: ${present(data.latest_controls)}.`,
        `Plano: ${present(data.plan)}.`,
        `Pendências: ${present(data.pending_items)}.`,
      ].join(" ");

      return {
        body,
        cited: sources.map((s) => s.id),
        provider: "heuristic",
        model: null,
      };
    },

    async generateFamilySummary({ patientCase, sources }) {
      assertSinglePatientCase(patientCase, sources);
      const snapshot = generateSnapshotFromSources(sources);
      const diagnosis = patientCase.main_diagnosis ?? snapshot.main_diagnosis;
      const status = patientCase.current_status ?? snapshot.active_problems;
      const measures = [snapshot.nutrition_status, snapshot.respiratory_status, snapshot.infectious_status]
        .filter((item) => item !== missing)
        .join("; ");
      const next = snapshot.pending_items !== missing ? snapshot.pending_items : snapshot.plan;

      const body = [
        limitation,
        `O paciente está internado por ${diagnosis === missing || !diagnosis ? "informações ainda em coleta" : diagnosis}.`,
        `Atualmente ${status === missing || !status ? "as informações clínicas ainda estão em coleta" : status}.`,
        `As medidas em curso são ${measures || "informações ainda em coleta"}.`,
        `Os próximos dias: monitorar ${next === missing ? "informações ainda em coleta" : next}.`,
      ].join(" ");

      return {
        body,
        cited: sources.map((s) => s.id),
        provider: "heuristic",
        model: null,
      };
    },

    async generatePrescriptionChecklist({ patientCase, sources }) {
      assertSinglePatientCase(patientCase, sources);
      const items = prescriptionCategories.map<PrescriptionReviewItem>(({ category, keywords }) => {
        const knownStatus = firstExtract(sources, keywords);
        const found = knownStatus !== missing;

        return {
          category,
          known_status: found ? knownStatus : "não mencionado",
          gap: found ? "verificar" : "item ausente",
        };
      });

      return {
        items,
        cited: sources.map((s) => s.id),
        provider: "heuristic",
        model: null,
      };
    },

    async formatLaboratory({ sources }) {
      const labs = sourcesByType(sources, "laboratory");

      if (labs.length === 0) {
        return "Não encontrado nas fontes deste leito.";
      }

      // Ordena do mais antigo para o mais recente para construir comparações.
      const ordered = [...labs].sort((a, b) => {
        const aT = (sourceDate(a) ?? new Date(0)).getTime();
        const bT = (sourceDate(b) ?? new Date(0)).getTime();
        return aT - bT;
      });

      const previousValues: Record<string, string> = {};

      const lines = ordered.map((source) => {
        const date = pt(sourceDate(source));
        const tokens = labFields.map((field) => {
          const value = extractRegex(source.raw_text, field.regexes);

          // Para LEUCO e SEG, anexar (ANTERIOR Y) quando houver lab prévio com valor.
          if (field.label === "LEUCO" && previousValues.LEUCO && value !== "—") {
            return `LEUCO ${value} (ANTERIOR ${previousValues.LEUCO})`;
          }
          if (field.label === "SEG" && previousValues.SEG && value !== "—") {
            return `SEG ${value}% (ANTERIOR ${previousValues.SEG}%)`;
          }
          if (field.label === "SEG" && value !== "—") return `SEG ${value}%`;
          if (field.label === "BAST" && value !== "—") return `BAST ${value}%`;
          if (field.label === "LINF" && value !== "—") return `LINF ${value}%`;
          if (field.label === "MON" && value !== "—") return `MON ${value}%`;
          if (field.label === "EOS" && value !== "—") return `EOS ${value}%`;
          if (field.label === "BAS" && value !== "—") return `BAS ${value}%`;
          return `${field.label} ${value}`;
        });

        // Atualiza o "anterior" para a próxima iteração (sequência cronológica)
        const leuco = extractRegex(source.raw_text, labFields.find((f) => f.label === "LEUCO")!.regexes);
        const seg = extractRegex(source.raw_text, labFields.find((f) => f.label === "SEG")!.regexes);
        if (leuco !== "—") previousValues.LEUCO = leuco;
        if (seg !== "—") previousValues.SEG = seg;

        // Campos extras opcionais ao final.
        const extras = labExtraFields
          .map((field) => {
            const value = extractRegex(source.raw_text, field.regexes);
            return value !== "—" ? `${field.label} ${value}` : null;
          })
          .filter((v): v is string => Boolean(v));

        const parts = [...tokens, ...extras];
        return `LAB (${date}): ${parts.join(" | ")}`;
      });

      // Apresentar do mais recente para o mais antigo.
      return lines.reverse().join("\n");
    },

    async formatImaging({ sources }) {
      const images = sourcesByType(sources, "imaging");

      if (images.length === 0) {
        return "Não encontrado nas fontes deste leito.";
      }

      const ordered = [...images].sort((a, b) => {
        const aT = (sourceDate(a) ?? new Date(0)).getTime();
        const bT = (sourceDate(b) ?? new Date(0)).getTime();
        return bT - aT;
      });

      return ordered
        .map((source) => {
          const date = pt(sourceDate(source));

          // Tenta nome canônico via regex; senão usa o título da fonte; senão "EXAME".
          let name = "EXAME";
          for (const { regex, canonical } of IMAGING_NAME_PATTERNS) {
            if (regex.test(source.raw_text) || regex.test(source.title ?? "")) {
              name = canonical;
              break;
            }
          }
          if (name === "EXAME" && source.title) {
            name = source.title.toUpperCase();
          }

          const impression = extractImagingImpression(source.raw_text);

          return `${name} (${date}): ${impression}`;
        })
        .join("\n");
    },

    async formatControls24h({ sources }) {
      const controls = sourcesByType(sources, "controls_24h");

      if (controls.length === 0) {
        return "Não encontrado nas fontes deste leito.";
      }

      const header = `| Fonte | ${controlFields.map((field) => field.label).join(" | ")} |`;
      const separator = `| --- | ${controlFields.map(() => "---").join(" | ")} |`;
      const rows = controls.map((source) => {
        const values = controlFields.map((field) => extractRegex(source.raw_text, field.regexes));
        return `| ${pt(sourceDate(source))} | ${values.join(" | ")} |`;
      });

      return [header, separator, ...rows].join("\n");
    },

    async askCase({ patientCase, sources, question }) {
      assertSinglePatientCase(patientCase, sources);
      const tokens = tokenize(question);

      if (tokens.length === 0) {
        return {
          answer: "Não encontrado nas fontes deste leito.",
          cited: [],
          provider: "heuristic",
          model: null,
        };
      }

      const scored = sources
        .flatMap((source) =>
          source.raw_text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => ({ source, line, score: scoreLine(line, tokens) })),
        )
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      if (scored.length === 0) {
        return {
          answer: "Não encontrado nas fontes deste leito.",
          cited: [],
          provider: "heuristic",
          model: null,
        };
      }

      const cited = Array.from(new Set(scored.map((item) => item.source.id)));
      const answer = `${limitation} Trechos encontrados: ${scored.map((item) => item.line).join(" | ")}`;

      return {
        answer,
        cited,
        provider: "heuristic",
        model: null,
      };
    },

    async detectDivergences({ patientCase, sources }) {
      assertSinglePatientCase(patientCase, sources);

      // Heurística: tópicos clínicos comuns + verificar se há linhas com negação
      // contraditória sobre o mesmo termo em fontes diferentes.
      const TOPICS: Array<{ topic: string; keywords: string[] }> = [
        { topic: "Drogas vasoativas", keywords: ["noradrenalina", "vasopressina", "dobutamina"] },
        { topic: "Antibióticos", keywords: ["meropenem", "vancomicina", "tazocin", "cefepime", "ceftriaxona"] },
        { topic: "Sedação", keywords: ["midazolam", "fentanil", "propofol", "dexmedetomidina"] },
        { topic: "Ventilação mecânica", keywords: ["vm", "tubo orotraqueal", "tot", "extubação"] },
        { topic: "Diálise", keywords: ["hemodiálise", "diálise", "tsr", "hd"] },
        { topic: "Nutrição", keywords: ["dieta", "tne", "tnp", "jejum"] },
      ];

      const divergences: Divergence[] = [];

      for (const { topic, keywords } of TOPICS) {
        const sourceMatches = sources.flatMap((src) => {
          const lines = src.raw_text.split(/\r?\n/).map((l) => l.trim());
          const matches = lines.filter((l) => {
            const lower = l.toLocaleLowerCase("pt-BR");
            return keywords.some((k) => lower.includes(k));
          });
          return matches.map((line) => ({ sourceId: src.id, line }));
        });

        if (sourceMatches.length < 2) continue;

        const negative = sourceMatches.filter(({ line }) =>
          /\b(suspens[oa]|sem|nega(?:do|da)?|ausente|desligad[oa]|retirad[oa]|n[ãa]o\s)\b/i.test(line),
        );
        const positive = sourceMatches.filter(({ line }) => !negative.includes({ ...{ sourceId: "", line: "" } } as never)
          && !/\b(suspens[oa]|sem|nega(?:do|da)?|ausente|desligad[oa]|retirad[oa]|n[ãa]o\s)\b/i.test(line));

        if (negative.length > 0 && positive.length > 0) {
          const sourceIds = Array.from(
            new Set([...negative.map((m) => m.sourceId), ...positive.map((m) => m.sourceId)]),
          );
          if (sourceIds.length >= 2) {
            divergences.push({
              topic,
              description: `Possível divergência: "${negative[0].line}" vs "${positive[0].line}"`,
              source_ids: sourceIds.slice(0, 4),
            });
          }
        }
      }

      return { divergences, provider: "heuristic", model: null };
    },

    async ingestRawText({ patientCase, rawText }) {
      const blocks = splitRawTextIntoBlocks(rawText);
      const fragments: IngestedFragment[] = blocks.map((block) => {
        const classification = classifyBlock(block);
        const sourceDatetime = parseFragmentDate(block);

        return {
          source_type: classification.sourceType,
          raw_text: block,
          source_datetime: sourceDatetime,
          title: titleForFragment(classification.sourceType, sourceDatetime),
          confidence: classification.confidence,
          rationale: `Detectado pela heurística baseada em keywords ${classification.rationaleKeyword}.`,
        };
      });

      return {
        fragments,
        summary: `Detectados ${fragments.length} fragmentos via heurística para ${patientCase.bed_label}.`,
        provider: "heuristic",
        model: null,
      };
    },

    async detectGaps({ patientCase, sources }) {
      assertSinglePatientCase(patientCase, sources);

      const currentTime = Date.now();
      const freshness: FreshnessEntry[] = freshnessCategories.map((config) => {
        const categorySources = sources.filter((source) => source.source_type === config.category);
        const lastUpdateAt = mostRecentSourceDate(categorySources);
        const ageMinutes =
          lastUpdateAt === null ? null : Math.max(0, Math.round((currentTime - lastUpdateAt.getTime()) / 60000));

        return {
          category: config.category,
          label: config.label,
          last_update_at: lastUpdateAt,
          age_minutes: ageMinutes,
          status: freshnessStatus(ageMinutes, config.windowMinutes),
        };
      });

      const gaps = freshnessCategories.flatMap<Gap>((config) => {
        const entry = freshness.find((item) => item.category === config.category);

        if (!entry) {
          return [];
        }

        if (entry.status === "missing") {
          if (config.essential) {
            return [
              {
                category: config.category,
                label: `${config.label} não registrada`,
                severity: "critical",
                why: "Não há fonte deste tipo neste leito.",
                suggested_action: `Cole ${config.label} na aba Adicionar.`,
              },
            ];
          }

          if (config.category === "diarist_evolution") {
            return [
              {
                category: config.category,
                label: "Evolução do diarista não registrada",
                severity: "info",
                why: "Não há fonte deste tipo neste leito.",
                suggested_action: "Cole evolução do diarista na aba Adicionar.",
              },
            ];
          }

          return [];
        }

        if (entry.status === "stale" && entry.age_minutes !== null) {
          return [
            {
              category: config.category,
              label: `${config.label} desatualizados`,
              severity: "warning",
              why: `Última atualização há ${hoursText(entry.age_minutes)} (esperado: ${hoursText(config.windowMinutes)}).`,
              suggested_action: `Cole ${config.label} atualizado na aba Adicionar.`,
            },
          ];
        }

        return [];
      });

      return {
        gaps: gaps.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]).slice(0, 6),
        freshness,
        provider: "heuristic",
        model: null,
      };
    },
  };
}
