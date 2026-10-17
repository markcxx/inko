import type { SourceTemplate, TemplateFilter, TemplateResult } from "../template-sources";

const api = "https://wmapi.xmyeditor.com/api/template";
export const xmySourceUrl = "https://www.xmyeditor.com/";
type Category = { id: number | string; catename: string; child?: Category[] };
type XmyItem = { id: string | number; title: string; cover_pic: string };

async function requestXmy(path: "cate" | "lists" | "getinfo", body?: URLSearchParams): Promise<unknown> {
  const response = await fetch(`${api}/${path}`, {
    method: body ? "POST" : "GET", body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`小蚂蚁来源暂时不可用（${response.status}）`);
  const result = await response.json();
  if (!result || result.code !== 0 || result.data === undefined) throw new Error(result?.code === 2 ? "原站当前要求登录，暂时无法匿名获取模板。" : "小蚂蚁接口未返回可用数据，请稍后重试。");
  return result.data;
}
function isCategory(item: unknown): item is Category {
  if (!item || typeof item !== "object") return false;
  const value = item as Category;
  return /^\d+$/.test(String(value.id)) && typeof value.catename === "string" && (!value.child || (Array.isArray(value.child) && value.child.every(isCategory)));
}
function safeImage(value: unknown): string {
  if (typeof value !== "string") return "";
  try { const url = new URL(value); return url.protocol === "https:" && /(?:^|\.)xmyeditor\.(?:com|cn)$/.test(url.hostname) ? url.href : ""; } catch { return ""; }
}
export async function fetchXmy(params: URLSearchParams): Promise<TemplateResult> {
  const page = Number(params.get("page") || 1);
  if (!Number.isInteger(page) || page < 1 || page > 10000) throw new Error("页码无效。");
  const query = params.get("query")?.trim() || "";
  if (query.length > 20) throw new Error("搜索关键词不能超过 20 个字。");
  const sort = params.get("sort") || "source";
  if (!["source", "newest"].includes(sort)) throw new Error("不支持的排序方式。");
  const data = await requestXmy("cate");
  if (!Array.isArray(data) || !data.every(isCategory)) throw new Error("原站分类数据格式发生变化。");
  const categories: Category[] = data;
  const category = params.get("category") || "", subcategory = params.get("subcategory") || "";
  const parent = categories.find(item => String(item.id) === category);
  if (category && !parent) throw new Error("该分类已不存在，请清空筛选。");
  if (subcategory && !parent?.child?.some(item => String(item.id) === subcategory)) throw new Error("子分类无效，请重新选择分类。");
  const groups: TemplateFilter[] = [{ id: "category", label: "分类", options: categories.map(item => ({ id: String(item.id), label: item.catename })) }];
  if (parent?.child?.length) groups.push({ id: "subcategory", label: "细分", options: parent.child.map(item => ({ id: String(item.id), label: item.catename })) });
  // Match the editor's own pagination. Page one can additionally contain recommendations.
  const body = new URLSearchParams({ page: String(page), pagesize: "20", keyword: query, cateid: subcategory || category, order: sort === "newest" ? "newest" : "", isfree: "2", favorite: "0", is_svg: "0", ai_keyword: "", keyword_type: "0" });
  const raw = await requestXmy("lists", body) as { list?: XmyItem[]; total?: number | string };
  if (!raw || !Array.isArray(raw.list)) throw new Error("原站模板列表格式发生变化。");
  const total = Number(raw.total);
  if (!Number.isSafeInteger(total) || total < 0) throw new Error("原站模板总数无效。");
  const items: SourceTemplate[] = [];
  for (const item of raw.list) {
    if (!item || !/^\d+$/.test(String(item.id)) || typeof item.title !== "string") continue;
    const image = safeImage(item.cover_pic);
    if (!image || items.some(entry => entry.id === String(item.id))) continue;
    items.push({ id: String(item.id), title: item.title, image, url: xmySourceUrl, filters: { ...(category ? { category: [category] } : {}), ...(subcategory ? { subcategory: [subcategory] } : {}) } });
  }
  return { groups, items, total, page, pageSize: 20, maxPages: Math.max(1, Math.ceil(total / 20)), hasNext: page * 20 < total, loginRequired: false, sourceUrl: xmySourceUrl, fetchedAt: new Date().toISOString() };
}
export async function fetchXmyPreview(id: string): Promise<string> {
  if (!/^\d{1,9}$/.test(id)) throw new Error("模板编号无效。");
  const data = await requestXmy("getinfo", new URLSearchParams({ id })) as { id?: string | number; code?: string };
  if (!data || String(data.id) !== id || typeof data.code !== "string" || !data.code.trim()) throw new Error("原站未返回此模板的完整内容。");
  return data.code;
}
