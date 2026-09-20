import { existsSync } from "node:fs";
import { migrate } from "../src/lib/store";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
migrate()
  .then(() => console.log("SkillLoop schema ready. No user data was reset."))
  .catch((error) => {
    console.error(
      "Schema setup failed. Verify DATABASE_URL, TLS and database permissions.",
    );
    if (error instanceof Error && error.message.startsWith("SETUP:"))
      console.error(error.message);
    process.exitCode = 1;
  });
