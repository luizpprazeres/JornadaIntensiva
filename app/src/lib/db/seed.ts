import { MOCK_DATA } from "@/mocks/seed-data";
import { db } from "@/lib/db/client";
import {
  clinicalSnapshots,
  handoffNotes,
  patientCases,
  pendingItems,
  prescriptionReviews,
  shifts,
  sourceDocuments,
} from "@/lib/db/schema";

console.log("Iniciando seed...");

// Limpar em ordem reversa de FK para evitar violações de integridade
db.delete(sourceDocuments).run();
db.delete(clinicalSnapshots).run();
db.delete(prescriptionReviews).run();
db.delete(handoffNotes).run();
db.delete(pendingItems).run();
db.delete(patientCases).run();
db.delete(shifts).run();

console.log("Tabelas limpas.");

// Inserir shift
db.insert(shifts).values(MOCK_DATA.shift).run();

// Inserir patient cases
db.insert(patientCases).values(MOCK_DATA.patientCases).run();

// Inserir source documents
db.insert(sourceDocuments).values(MOCK_DATA.sourceDocuments).run();

const nShifts = 1;
const nCases = MOCK_DATA.patientCases.length;
const nSources = MOCK_DATA.sourceDocuments.length;

console.log(`Seeded ${nShifts} shift, ${nCases} patient cases, ${nSources} source documents.`);

process.exit(0);
