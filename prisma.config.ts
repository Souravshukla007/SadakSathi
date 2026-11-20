// Load .env with Node's built-in loader (no dotenv dependency needed).
try { process.loadEnvFile(); } catch { /* no .env: use real environment variables */ }
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
