import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import * as schema from "@/lib/db/schema";

declare global {
  // eslint-disable-next-line no-var
  var __jornadaIntensivaDb:
    | {
        sqlite: Database.Database;
        db: BetterSQLite3Database<typeof schema>;
      }
    | undefined;
}

function createClient() {
  const sqlite = new Database("./jornada-intensiva.db");
  sqlite.pragma("journal_mode = WAL");

  const db = drizzle(sqlite, { schema });

  return { sqlite, db };
}

const client = globalThis.__jornadaIntensivaDb ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__jornadaIntensivaDb = client;
}

export const sqlite = client.sqlite;
export const db = client.db;
