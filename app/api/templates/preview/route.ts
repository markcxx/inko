import { fetchXiumiPreview } from "@/lib/template-sources/provider-xiumi";
import { fetch96Preview } from "@/lib/template-sources/provider-96";
import { fetchOfficial135Preview } from "@/lib/template-sources/provider-135-official";
import { extractPreview } from "@/lib/template-sources/preview";
import { fetchXmyPreview } from "@/lib/template-sources/provider-xmy";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (!["xiumi", "96", "xmy", "135-official"].includes(params.get("source") || "")) return Response.json({ error: "暂未接入该模板来源" }, { status: 400 });
  const id = params.get("id");
  if (!id || !/^\d{1,9}$/.test(id)) return Response.json({ error: "模板编号无效" }, { status: 400 });
  try {
    const source = params.get("source") === "xiumi" ? "xiumi" : params.get("source") === "96" ? "96" : params.get("source") === "135-official" ? "135-official" : "xmy";
    const html = await (source === "xiumi" ? fetchXiumiPreview(id) : source === "96" ? fetch96Preview(id) : source === "135-official" ? fetchOfficial135Preview(id) : fetchXmyPreview(id));
    return Response.json(extractPreview(html, source), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error && !/fetch failed|aborted|timeout/i.test(error.message) ? error.message : "模板加载失败，请稍后重试。" }, { status: 502 }); }
}
