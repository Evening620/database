import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
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
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

const client = new Client({
  connectionString: normalizeConnectionString(connectionString),
  ssl: pgssl === "disable" ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  const sql = await readFile(resolve(process.cwd(), "sql/04_purchase_logic.sql"), "utf8");
  await client.query(sql);
  await client.query("BEGIN");
  const candidate = await client.query(`
    SELECT i.item_id, u.user_id
    FROM item AS i
    CROSS JOIN LATERAL (
      SELECT user_id
      FROM "user"
      ORDER BY user_id
      LIMIT 1
    ) AS u
    WHERE i.status = 0
    ORDER BY i.item_id
    LIMIT 1;
  `);

  if (candidate.rows[0]) {
    await client.query("SELECT * FROM purchase_item($1, $2, CURRENT_DATE);", [
      candidate.rows[0].item_id,
      candidate.rows[0].user_id,
    ]);
    console.log("Purchase function smoke test passed and was rolled back.");
  } else {
    console.log("Purchase function updated. Smoke test skipped because no unsold item exists.");
  }

  await client.query("ROLLBACK");
} catch (error) {
  try {
    await client.query("ROLLBACK");
  } catch {
    // Ignore rollback errors when the connection failed before BEGIN.
  }
  console.error("Purchase function update failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
