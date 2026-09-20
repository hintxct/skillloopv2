import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import type { Pool, PoolClient } from "pg";

type Row = { data: string; expires_at: string | number | null };
type Globals = typeof globalThis & {
  slPool?: Pool;
  slSqlite?: DatabaseSync;
  slQueue?: Promise<void>;
  slMemory?: Map<string, Row>;
  slBlobCache?: Map<string, Row>;
};
const globals = globalThis as Globals;
export const SCHEMA = `CREATE TABLE IF NOT EXISTS sl_records (
  kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, expires_at BIGINT,
  PRIMARY KEY (kind, id)
); CREATE INDEX IF NOT EXISTS sl_records_expiry ON sl_records(expires_at);`;

export interface Store {
  get<T>(kind: string, id: string): Promise<T | null>;
  put(
    kind: string,
    id: string,
    value: unknown,
    expires?: number,
  ): Promise<void>;
  remove(kind: string, id: string): Promise<void>;
}

export function backendName() {
  if (process.env.DATABASE_URL) return "PostgreSQL · shared backend";
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
    return "Vercel Blob · persistent demo";
  if (process.env.VERCEL) return "In-memory · demo (ephemeral)";
  return "SQLite · local development";
}

async function pool() {
  if (!globals.slPool) {
    const { Pool } = await import("pg");
    globals.slPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
      statement_timeout: 10000,
      idle_in_transaction_session_timeout: 15000,
    });
    globals.slPool.on("error", () => {
      console.error(
        "SkillLoop: an idle PostgreSQL connection failed. Check database availability.",
      );
    });
  }
  return globals.slPool;
}

async function sqlite() {
  if (process.env.VERCEL) {
    // On Vercel without DATABASE_URL we use in-memory store (ephemeral demo).
    // Keep this throw only for explicit migrate without DB; transaction() will use memory.
    throw new Error(
      "SETUP: Connect a PostgreSQL database, set DATABASE_URL, and run npm run db:migrate before using this deployment.",
    );
  }
  if (!globals.slSqlite) {
    const { DatabaseSync } = await import("node:sqlite");
    mkdirSync(join(process.cwd(), ".data"), { recursive: true });
    globals.slSqlite = new DatabaseSync(
      join(process.cwd(), ".data", "skillloop.sqlite"),
    );
    globals.slSqlite.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
    globals.slSqlite.exec(SCHEMA);
  }
  return globals.slSqlite;
}

function memoryStore(): Store {
  if (!globals.slMemory) globals.slMemory = new Map<string, Row>();
  const map = globals.slMemory;
  return {
    async get<T>(kind: string, id: string) {
      const key = `${kind}:${id}`;
      const row = map.get(key);
      if (
        !row ||
        (row.expires_at !== null && Number(row.expires_at) < Date.now())
      ) {
        if (row) map.delete(key);
        return null;
      }
      return JSON.parse(row.data) as T;
    },
    async put(kind, id, value, expires) {
      map.set(`${kind}:${id}`, {
        data: JSON.stringify(value),
        expires_at: expires ?? null,
      });
    },
    async remove(kind, id) {
      map.delete(`${kind}:${id}`);
    },
  };
}

function blobStore(): Store {
  // Persistent demo on Vercel via Blob — survives across serverless instances and devices.
  // Each record is a public JSON blob at skillloop/<kind>/<id>.json
  // Write-through memory cache gives read-after-write consistency on the same instance;
  // cross-instance reads use CDN-bypassed fetch with retries to handle Blob eventual consistency.
  const prefix = "skillloop";
  function cache(): Map<string, Row> {
    if (!globals.slBlobCache) globals.slBlobCache = new Map<string, Row>();
    return globals.slBlobCache;
  }
  return {
    async get<T>(kind: string, id: string) {
      const key = `${kind}:${id}`;
      const pathname = `${prefix}/${kind}/${id}.json`;
      // 1) Fast path: write-through cache (same instance, no CDN lag)
      const cached = cache().get(key);
      if (cached) {
        if (
          cached.expires_at !== null &&
          Number(cached.expires_at) < Date.now()
        ) {
          cache().delete(key);
        } else {
          try {
            return JSON.parse(cached.data) as T;
          } catch {}
        }
      }
      // 2) Blob read with retries (list can lag right after a put on another instance)
      try {
        const { list } = await import("@vercel/blob");
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { blobs } = await list({ prefix: pathname });
            const blob = blobs.find((b) => b.pathname === pathname);
            if (!blob) {
              if (attempt < 2) {
                await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
                continue;
              }
              return null;
            }
            // Cache-bust to bypass CDN edge cache after overwrite
            const url = `${blob.url}${blob.url.includes("?") ? "&" : "?"}cb=${Date.now()}`;
            const res = await fetch(url, {
              cache: "no-store",
              headers: { "Cache-Control": "no-cache" },
            });
            if (!res.ok) {
              if (attempt < 2) {
                await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
                continue;
              }
              return null;
            }
            const row = (await res.json()) as Row;
            if (
              row.expires_at !== null &&
              Number(row.expires_at) < Date.now()
            ) {
              try {
                const { del } = await import("@vercel/blob");
                await del(blob.url);
              } catch {}
              cache().delete(key);
              return null;
            }
            cache().set(key, row);
            return JSON.parse(row.data) as T;
          } catch {
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
              continue;
            }
            return null;
          }
        }
        return null;
      } catch {
        return null;
      }
    },
    async put(kind, id, value, expires) {
      const { put } = await import("@vercel/blob");
      const pathname = `${prefix}/${kind}/${id}.json`;
      const row: Row = {
        data: JSON.stringify(value),
        expires_at: expires ?? null,
      };
      // Write-through: update local cache immediately for read-after-write
      cache().set(`${kind}:${id}`, row);
      await put(pathname, JSON.stringify(row), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
      } as never);
    },
    async remove(kind, id) {
      cache().delete(`${kind}:${id}`);
      try {
        const { list, del } = await import("@vercel/blob");
        const pathname = `${prefix}/${kind}/${id}.json`;
        const { blobs } = await list({ prefix: pathname });
        const blob = blobs.find((b) => b.pathname === pathname);
        if (blob) await del(blob.url);
      } catch {}
    },
  };
}

function adapter(client: PoolClient | DatabaseSync, postgres: boolean): Store {
  async function query(sql: string, values: (string | number | null)[]) {
    if (postgres)
      return (await (client as PoolClient).query(sql, values)).rows as Row[];
    const statement = (client as DatabaseSync).prepare(
      sql.replace(/\$\d+/g, "?"),
    );
    if (sql.startsWith("SELECT"))
      return statement.all(...values) as unknown as Row[];
    statement.run(...values);
    return [];
  }
  return {
    async get<T>(kind: string, id: string) {
      const [row] = await query(
        "SELECT data, expires_at FROM sl_records WHERE kind=$1 AND id=$2",
        [kind, id],
      );
      if (
        !row ||
        (row.expires_at !== null && Number(row.expires_at) < Date.now())
      )
        return null;
      return JSON.parse(row.data) as T;
    },
    async put(kind, id, value, expires) {
      await query(
        "INSERT INTO sl_records (kind,id,data,expires_at) VALUES ($1,$2,$3,$4) ON CONFLICT (kind,id) DO UPDATE SET data=excluded.data, expires_at=excluded.expires_at",
        [kind, id, JSON.stringify(value), expires ?? null],
      );
    },
    async remove(kind, id) {
      await query("DELETE FROM sl_records WHERE kind=$1 AND id=$2", [kind, id]);
    },
  };
}

// A single transaction lock deliberately prioritises correctness for the small demo.
// Production scaling should normalise entities and use per-room/booking row locks.
export async function transaction<T>(
  work: (store: Store) => Promise<T>,
): Promise<T> {
  if (process.env.DATABASE_URL) {
    const client = await (await pool()).connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(734001)");
      const result = await work(adapter(client, true));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
  if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
    const previous = globals.slQueue ?? Promise.resolve();
    let release!: () => void;
    globals.slQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await work(blobStore());
    } finally {
      release();
    }
  }
  if (process.env.VERCEL) {
    // Ephemeral in-memory demo on Vercel without external DB.
    const previous = globals.slQueue ?? Promise.resolve();
    let release!: () => void;
    globals.slQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await work(memoryStore());
    } finally {
      release();
    }
  }
  const previous = globals.slQueue ?? Promise.resolve();
  let release!: () => void;
  globals.slQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  let db: DatabaseSync | undefined;
  try {
    db = await sqlite();
    db.exec("BEGIN IMMEDIATE");
    const result = await work(adapter(db, false));
    db.exec("COMMIT");
    return result;
  } catch (error) {
    if (db?.isTransaction) db.exec("ROLLBACK");
    throw error;
  } finally {
    release();
  }
}

export async function migrate() {
  if (process.env.DATABASE_URL) {
    const p = await pool();
    try {
      await p.query(SCHEMA);
    } finally {
      await p.end();
      globals.slPool = undefined;
    }
  } else if (process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID) {
    // Blob needs no schema migration.
  } else if (process.env.VERCEL) {
    if (!globals.slMemory) globals.slMemory = new Map<string, Row>();
  } else {
    await sqlite();
  }
}
