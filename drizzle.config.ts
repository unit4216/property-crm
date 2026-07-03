import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit runs outside Next.js, so load env vars from .env.local manually.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
