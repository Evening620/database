import "server-only";

import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

let pool: Pool | null = null;

function normalizeConnectionString(rawConnectionString: string): string {
  try {
    const url = new URL(rawConnectionString);
    url.searchParams.delete("sslmode");
    url.searchParams.delete("uselibpqcompat");
    return url.toString();
  } catch {
    return rawConnectionString;
  }
}

function getSslConfig() {
  const pgssl = process.env.PGSSL ?? "require";
  const connectionString = process.env.DATABASE_URL ?? "";

  if (
    pgssl === "disable" ||
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1")
  ) {
    return false;
  }

  return { rejectUnauthorized: false };
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "未检测到 DATABASE_URL。请先在 .env.local 或 Vercel 环境变量中配置真实 PostgreSQL 连接串。",
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString: normalizeConnectionString(process.env.DATABASE_URL),
      ssl: getSslConfig(),
      max: 10,
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(sql, params);
}

export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
