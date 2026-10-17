import { renderXiumiContent } from "./xiumi-renderer";
import type { SourceTemplate, TemplateFilter, TemplateResult } from "../template-sources";
const origin="https://xiumi.us";
type Tag={tag_id:number;tag_name:string;childTags?:Tag[]};
type Goods={show_goods_id:number;show?:{title?:string;cover?:string;show_url?:string}};
function trustedUrl(raw:string,base=origin) {
  const url=new URL(raw,base);
  if(url.protocol!=="https:" || !/(?:^|\.)(?:xiumi\.us|xiumius\.cn)$/.test(url.hostname) || url.username || url.password)throw new Error("秀米资源地址不可用。");
  return url;
}
async function get(url:URL) {
  const signal=AbortSignal.timeout(20000);
  let current=trustedUrl(url.href);
  for(let hop=0;hop<=5;hop++) {
    const response=await fetch(current,{cache:"no-store",redirect:"manual",signal});
    if([301,302,303,307,308].includes(response.status)) {
      const location=response.headers.get("location");
      await response.body?.cancel();
      if(!location || hop===5)break;
      current=trustedUrl(location,current.href);
      continue;
    }
    if(!response.ok)throw new Error("秀米来源暂时不可用。");
    return response;
  }
  throw new Error("秀米预览暂时不可用。");
}
async function api(path:string,params:URLSearchParams=new URLSearchParams()):Promise<unknown> {
  const url=new URL(path,origin);url.search=params.toString();
  const result=await (await get(url)).json();
  if(result?.code!==0 || result.data===undefined)throw new Error("秀米暂未返回可用数据。");
  return result.data;
}
function isTag(value:unknown):value is Tag {
  if(!value || typeof value!=="object")return false;
  const tag=value as Tag;return Number.isSafeInteger(tag.tag_id) && typeof tag.tag_name==="string" && (!tag.childTags || (Array.isArray(tag.childTags) && tag.childTags.every(isTag)));
}
export async function fetchXiumi(params:URLSearchParams):Promise<TemplateResult> {
  const page=Number(params.get("page") || 1),query=params.get("query")?.trim() || "";
  if(!Number.isInteger(page) || page<1 || page>10000 || query.length>100)throw new Error("筛选参数无效。");
  const sort=params.get("sort") || "source";
  if(!["source","newest"].includes(sort))throw new Error("排序参数无效。");
  const tree=await api("/api/show_goods/tags_tree",new URLSearchParams({show_type:"paper",tag_level_from:"2",tag_level_to:"0",show_goods:"false"}));
  if(!Array.isArray(tree) || !tree.every(isTag))throw new Error("秀米分类暂不可用。");
  const roots=(tree as Tag[])[0]?.childTags || [];
  const groups:TemplateFilter[]=roots.map(tag=>({id:`xiumi-${tag.tag_id}`,label:tag.tag_name,options:(tag.childTags || []).map(child=>({id:String(child.tag_id),label:child.tag_name}))})).filter(group=>group.options.length);
  const tags:string[]=[];
  for(const [key,value] of params)if(key.startsWith("xiumi-") && value){
    const group=groups.find(group=>group.id===key);
    if(!group?.options.some(option=>option.id===value) || tags.includes(value))throw new Error("秀米分类参数无效。");
    tags.push(value);
  }
  const request=new URLSearchParams({limit:"72",page:String(page-1),show_type:"paper",showgoods_type:"paper",price_scope:"all",by_nearest:"1",tpl_flag:"0"});
  if(query)request.set("search",query);
  tags.forEach(tag=>request.append("tag_id",tag));
  const data=await api("/api/show_goods/goodses",request) as {count?:number;goodses?:Goods[]};
  if(!data || !Number.isSafeInteger(data.count) || data.count! < 0 || !Array.isArray(data.goodses))throw new Error("秀米列表暂不可用。");
  const total=data.count!,items:SourceTemplate[]=[];
  for(const item of data.goodses) {
    if(!item || !Number.isSafeInteger(item.show_goods_id) || !item.show?.title || items.some(row=>row.id===String(item.show_goods_id)))continue;
    let image="",url="https://xiumi.us/#/studio/shop/paper";
    try{if(item.show.cover)image=trustedUrl(item.show.cover).href;}catch{/* Render a cover placeholder. */}
    try{if(item.show.show_url)url=trustedUrl(item.show.show_url).href;}catch{/* Keep the original shop link. */}
    items.push({id:String(item.show_goods_id),title:item.show.title,image,url,filters:{}});
  }
  return {groups,items,total,page,pageSize:72,maxPages:Math.max(1,Math.ceil(total/72)),hasNext:page*72<total,loginRequired:false,sourceUrl:`${origin}/#/studio/shop/paper?${new URLSearchParams({page:String(page-1),freefilter:"all",by_nearest:"1"})}`,fetchedAt:new Date().toISOString()};
}
export async function fetchXiumiPreview(id:string):Promise<string> {
  if(!/^\d{1,9}$/.test(id))throw new Error("模板编号无效。");
  const goods=await api(`/api/show_goods/goodses/${id}`) as {show?:{show_id?:number;show_url?:string}};
  if(!goods?.show?.show_url)throw new Error("秀米预览暂不可用。");
  const published=await (await get(trustedUrl(goods.show.show_url))).text();
  const match=published.match(/injectedData\.showInfo\s*=\s*JSON\.parse\(decodeURIComponent\("([^"]+)"\)\)/);
  if(!match)throw new Error("秀米预览暂不可用。");
  const info=JSON.parse(decodeURIComponent(match[1]));
  if(info.show_id!==goods.show.show_id || typeof info.show_data_url!=="string")throw new Error("秀米内容不可用。");
  const content=await (await get(trustedUrl(info.show_data_url))).json();
  return renderXiumiContent(content);
}
