import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import pg from "pg";

const { Client } = pg;

if (existsSync(".env.local")) {
  process.loadEnvFile?.(".env.local");
}

if (existsSync(".env")) {
  process.loadEnvFile?.(".env");
}

function normalizeConnectionString(rawConnectionString) {
  try {
    const url = new URL(rawConnectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("uselibpqcompat");
    return url.toString();
  } catch {
    return rawConnectionString;
  }
}

const connectionString = process.env.DATABASE_URL;
const pgssl = process.env.PGSSL ?? "require";

if (!connectionString) {
  console.error(
    "Missing DATABASE_URL. Copy .env.example to .env.local and set a real PostgreSQL connection string.",
  );
  process.exit(1);
}

const client = new Client({
  connectionString: normalizeConnectionString(connectionString),
  ssl: pgssl === "disable" ? false : { rejectUnauthorized: false },
});

const files = [
  "sql/01_schema.sql",
  "sql/02_seed.sql",
  "sql/03_views.sql",
  "sql/04_purchase_logic.sql",
];

try {
  await client.connect();

  for (const relativePath of files) {
    const filePath = resolve(process.cwd(), relativePath);
    const sql = await readFile(filePath, "utf8");
    console.log(`Executing ${relativePath}`);
    await client.query(sql);
  }

  console.log("Database setup completed.");
} catch (error) {
  console.error("Database setup failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
