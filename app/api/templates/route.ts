import { fetchXiumi } from "@/lib/template-sources/provider-xiumi";
import { fetch96 } from "@/lib/template-sources/provider-96";
import { fetchOfficial135 } from "@/lib/template-sources/provider-135-official";
import { fetchXmy } from "@/lib/template-sources/provider-xmy";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (!["xiumi", "96", "xmy", "135-official"].includes(params.get("source") || "")) return Response.json({ error: "暂未接入该模板来源" }, { status: 400 });
  try { return Response.json(await (params.get("source") === "xiumi" ? fetchXiumi(params) : params.get("source") === "96" ? fetch96(params) : params.get("source") === "135-official" ? fetchOfficial135(params) : fetchXmy(params)), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return Response.json({ error: error instanceof Error && !/fetch failed|aborted|timeout/i.test(error.message) ? error.message : "来源请求超时或连接失败，请重试。" }, { status: 502 }); }
}
