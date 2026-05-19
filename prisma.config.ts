// prisma.config.ts
import 'dotenv/config';  // ← AJOUTEZ CETTE LIGNE
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  datasource: {
    url: env("DATABASE_URL"),
  },
});