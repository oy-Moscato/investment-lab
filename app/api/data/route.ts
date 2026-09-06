import { env } from "cloudflare:workers";
import { createDataHandlers } from "../../../server/data-service";

export async function GET() {
  if (!env.DB) return Response.json({ error: "数据库连接不可用" }, { status: 503 });
  return createDataHandlers(env.DB).GET();
}
export async function POST(request: Request) {
  if (!env.DB) return Response.json({ error: "数据库连接不可用" }, { status: 503 });
  return createDataHandlers(env.DB).POST(request);
}
