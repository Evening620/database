import process from "node:process";
import { existsSync } from "node:fs";
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

  const userCountResult = await client.query(
    'select count(*)::int as user_count from "user";',
  );
  const itemCountResult = await client.query(
    "select count(*)::int as item_count from item;",
  );
  const orderCountResult = await client.query(
    "select count(*)::int as order_count from orders;",
  );
  const soldViewResult = await client.query(
    "select * from sold_items_view order by item_name;",
  );
  const unsoldViewResult = await client.query(
    "select item_name from unsold_items_view order by item_id;",
  );

  console.log("Users:", userCountResult.rows[0].user_count);
  console.log("Items:", itemCountResult.rows[0].item_count);
  console.log("Orders:", orderCountResult.rows[0].order_count);
  console.log("Sold view rows:", soldViewResult.rows.length);
  console.log("Unsold view rows:", unsoldViewResult.rows.length);
} catch (error) {
  console.error("Database check failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
