import { load } from "cheerio";
import type { SourceTemplate, TemplateResult } from "../template-sources";
const origin = "https://www.135editor.com";
export async function fetchOfficial135(params: URLSearchParams): Promise<TemplateResult> {
  const requestedPage = Number(params.get("page") || 1);
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > 60) throw new Error("官方作者主页仅支持第 1–60 页。");
  const url = new URL("/editor_styles/author_detail", origin);
  url.searchParams.set("creator", "135");url.searchParams.set("cate_id", "101");url.searchParams.set("page", String(requestedPage));
  const response = await fetch(url, {cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`官方来源暂时不可用（${response.status}）`);
  const $ = load(await response.text());
  if(!$("#author-works #main").length)throw new Error("官方作者主页暂时不可用。");
  const items: SourceTemplate[] = [];
  $("#author-works .works-item").each((_,node)=>{
    const card=$(node),link=card.find("a.title").first(),image=card.find(".img-box img").first();
    const id=link.attr("href")?.match(/\/view_contribute\/(\d+)\.html/)?.[1];
    const src=image.attr("data-src") || image.attr("src") || "";
    if(!id || !/^https:\/\/(?:bcn|bdn|static)\.135editor\.com\//.test(src) || items.some(item=>item.id===id))return;
    items.push({id,title:link.text().trim(),image:src,url:`${origin}/moban/detail/${id}.html`,filters:{}});
  });
  const pagination=$(".pagelink"),page=Number(pagination.find('input[name="page"]').attr("value") || 1);
  if(page!==requestedPage)throw new Error("原站没有返回请求的页码。");
  const maxPages=Number(pagination.find('input[name="page"]').attr("max") || 1);
  if(!Number.isInteger(maxPages) || maxPages<1 || maxPages>60)throw new Error("原站分页范围发生变化。");
  const count=pagination.text().match(/([\d,]+)条/);
  return {groups:[],items,total:count?Number(count[1].replaceAll(",","")):items.length===0?0:null,page,pageSize:15,maxPages,hasNext:page<maxPages && !!pagination.find("a.next-page").length,loginRequired:false,sourceUrl:url.href,fetchedAt:new Date().toISOString()};
}
export async function fetchOfficial135Preview(id:string):Promise<string> {
  const response=await fetch(`${origin}/moban/detail/${id}.html`,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error("官方模板暂时无法访问。");
  return response.text();
}
