import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { query } from "../lib/db.js";

async function migrate() {
  try {
    console.log("Adding image_url column to annonces table...");
    await query("ALTER TABLE annonces ADD COLUMN IF NOT EXISTS image_url TEXT;");
    console.log("Column image_url added successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
