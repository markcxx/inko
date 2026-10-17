import { load } from "cheerio";
import type { SourceTemplate, TemplateFilter, TemplateResult } from "../template-sources";
const origin = "https://bj.96weixin.com";
async function request96(url: URL): Promise<string> {
  const response = await fetch(url, {cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`96 编辑器来源暂时不可用（${response.status}）`);
  return response.text();
}
export async function fetch96(params: URLSearchParams): Promise<TemplateResult> {
  const page=Number(params.get("page") || 1);
  if(!Number.isInteger(page) || page<1 || page>10000)throw new Error("页码无效。");
  const holiday=params.get("holiday") || "0",industry=params.get("industry") || "0";
  if(!/^\d{1,6}$/.test(holiday) || !/^\d{1,6}$/.test(industry))throw new Error("分类参数无效。");
  const url=new URL(`/material/tpl/${holiday}_${industry}_${page}`,origin);
  url.searchParams.set("order","addtime");
  const $=load(await request96(url));
  const actualPage=Number($("#material").attr("data-page"));
  if(actualPage!==page)throw new Error("原站没有返回请求的模板页，请重新选择页码。");
  const totalText=$(".float-page #count").first().text().replaceAll(",","").trim();
  if(!/^\d+$/.test(totalText))throw new Error("原站未返回有效的模板总数。");
  const total=Number(totalText);
  const groups: TemplateFilter[]=[];
  $(".material-breadcrumb").each((_,node)=>{
    const row=$(node),label=row.find("cite").text().replace(/[：:]/g,"").trim();
    const id=label==="节日"?"holiday":label==="行业"?"industry":"";
    if(!id)return;
    const options: TemplateFilter["options"]=[];
    row.find('a[href]').each((_,link)=>{
      const match=$(link).attr("href")?.match(/^\/material\/tpl\/(\d+)_(\d+)_\d+/);
      const value=match?.[id==="holiday"?1:2];
      if(value && value!=="0" && !options.some(option=>option.id===value))options.push({id:value,label:$(link).text().trim()});
    });
    if(options.length)groups.push({id,label,options});
  });
  if(groups.length!==2)throw new Error("原站分类结构发生变化，请稍后重试。");
  for(const [id,value] of [["holiday",holiday],["industry",industry]])if(value!=="0" && !groups.find(group=>group.id===id)?.options.some(option=>option.id===value))throw new Error("原站已不存在该分类，请清空筛选。");
  const items: SourceTemplate[]=[];
  $('.list-style.material_tpl .style-item[data-type="tpl"][data-id]').each((_,node)=>{
    const card=$(node),id=card.attr("data-id"),link=card.find('.title a').first().clone();
    link.find("i").remove();
    const title=link.text().trim(),img=card.find('.item-content img').first();
    const raw=img.attr("data-src") || img.attr("src") || "";
    if(!id || !/^\d+$/.test(id) || !title || items.some(item=>item.id===id))return;
    let image = "";
    try {
      const address=new URL(raw,origin);
      if (["http:","https:"].includes(address.protocol) && /(?:^|\.)96weixin\.com$/.test(address.hostname)) {
        address.protocol="https:";
        image=address.href;
      }
    } catch { /* A missing cover must not remove an otherwise valid template. */ }
    items.push({id,title,image,url:`${origin}/material/tpl/${id}.html`,filters:{...(holiday!=="0"?{holiday:[holiday]}:{}),...(industry!=="0"?{industry:[industry]}:{})}});
  });
  if(total>0 && page<=Math.ceil(total/32) && !items.length)throw new Error("原站模板列表结构发生变化，请稍后重试。");
  return {groups,items,total,page,pageSize:32,maxPages:Math.max(1,Math.ceil(total/32)),hasNext:page*32<total,loginRequired:false,sourceUrl:url.href,fetchedAt:new Date().toISOString()};
}
export async function fetch96Preview(id:string):Promise<string> {
  if(!/^\d{1,9}$/.test(id))throw new Error("模板编号无效。");
  const html = await request96(new URL(`/material/tpl/${id}.html`,origin));
  return html.replace(/\bhttp:\/\/((?:[a-z0-9-]+\.)*96weixin\.com)(?=[/:?#\s"'<>])/gi,"https://$1");
}
