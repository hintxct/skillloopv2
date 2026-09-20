import { existsSync } from "node:fs";
import { Pool } from "pg";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

async function check() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is missing. Connect an isolated managed PostgreSQL database before deploying to Vercel. Local SQLite is not a deployment database.",
    );
    process.exitCode = 1;
    return;
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
  try {
    // Read-only check: validates connectivity, the migrated table and required columns.
    await pool.query(
      "SELECT kind, id, data, expires_at FROM sl_records LIMIT 0",
    );
    console.log(
      "PostgreSQL connection and SkillLoop schema are ready. No records were changed.",
    );
    if (process.env.DEMO_MODE !== "true") {
      console.error(
        "Set DEMO_MODE=true on this isolated demo deployment to enable demo sign-in.",
      );
      process.exitCode = 1;
    }
  } catch (error) {
    // Do not print credentials or database URLs from driver error messages.
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "unknown";
    console.error(
      code === "42P01"
        ? "SkillLoop schema is missing. Run npm run db:migrate against this database, then repeat npm run db:check."
        : "PostgreSQL check failed. Verify the connection string, TLS, network access, and database permissions.",
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void check();
