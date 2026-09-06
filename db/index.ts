import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// Schema changes belong to Drizzle migrations. Reads never seed or backfill data.
export function getDb() {
  if (!env.DB) throw new Error("数据库连接不可用");
  return drizzle(env.DB, { schema });
}
