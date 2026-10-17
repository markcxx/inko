import { load } from "cheerio";
import { extractPreview } from "../template-sources/preview";
import type { NativeComponent, ComponentResult } from "../component-sources";
import type { TemplateFilter } from "../template-sources";
async function get(url:string,body?:URLSearchParams) {
  const response=await fetch(url,{method:body?"POST":"GET",body,redirect:"error",signal:AbortSignal.timeout(20000),cache:"no-store"});
  if(!response.ok)throw new Error("组件暂时无法获取。");return response;
}
const pageOf=(params:URLSearchParams)=>{const page=Number(params.get("page") || 1);if(!Number.isInteger(page)||page<1||page>10000)throw new Error("页码无效。");return page;};
function wrap(html:string,source:string) {
  if(source==="96")return `<div class="detail_left material_tpl"><div class="detail_block_style">${html}</div></div>`;
  if(source==="xiumi")return `<section class="xiumi-template">${html}</section>`;
  return html;
}
function item(id:string,title:string,html:string,source:"96"|"xmy"|"xiumi",categoryPath:string[],url:string):NativeComponent {
  html=html.replace(/\bhttp:\/\/((?:[a-z0-9-]+\.)*96weixin\.com)(?=[/:?#\s"'<>])/gi,"https://$1");
  const $=load(html,{},false);
  $("[src],[href]").each((_,node)=>{for(const attr of ["src","href"]){const value=$(node).attr(attr);if(value?.startsWith("//"))$(node).attr(attr,`https:${value}`);}});
  $("[style]").each((_,node)=>{$(node).attr("style",($(node).attr("style") || "").replace(/url\(\s*(["']?)\/\//gi,'url($1https://'));});
  return {id,title,image:"",url,filters:{},kind:categoryPath.at(-1) || "组件",categoryPath,preview:extractPreview(wrap($.html(),source),source)};
}
function result(groups:TemplateFilter[],items:NativeComponent[],page:number,total:number|null,sourceUrl:string,hasNext?:boolean):ComponentResult {
  return {groups,items,page,total,pageSize:20,hasNext:hasNext ?? page*20<(total || 0),loginRequired:false,sourceUrl,fetchedAt:new Date().toISOString()};
}
function numberFilter(params:URLSearchParams,key:string) {const value=params.get(key)||"0";if(!/^\d{1,8}$/.test(value))throw new Error("分类无效。");return value;}
export async function fetch96Components(params:URLSearchParams):Promise<ComponentResult> {
  const page=pageOf(params),keys=["type","subtype","style","holiday","industry","color"],values=keys.map(key=>numberFilter(params,key));
  const url=`https://bj.96weixin.com/material/style/${values.join("_")}_${page}`;
  const $=load(await(await get(url)).text()),groups:TemplateFilter[]=[];
  if(Number($("#material").attr("data-page"))!==page)throw new Error("组件暂时无法获取。");
  const main:TemplateFilter={id:"type",label:"类型",options:[]},sub:TemplateFilter={id:"subtype",label:"细分",options:[]};
  $(".material-category > li").each((_,node)=>{
    const link=$(node).children("a").first(),match=link.attr("href")?.match(/\/style\/([\d_]+)/),id=match?.[1].split("_")[0];
    if(!id || id==="0")return;main.options.push({id,label:link.text().trim()});
    if(values[0]===id)$(node).find("dd a").each((_,anchor)=>{const parts=$(anchor).attr("href")?.match(/\/style\/([\d_]+)/)?.[1].split("_");if(parts?.[1] && parts[1]!=="0")sub.options.push({id:parts[1],label:$(anchor).text().trim()});});
  });groups.push(main);if(sub.options.length)groups.push(sub);
  const dimensions:Record<string,[string,number]>={"风格":["style",2],"节日":["holiday",3],"行业":["industry",4],"色彩":["color",5]};
  $(".material-breadcrumb").each((_,node)=>{
    const label=$(node).find("cite").text().replace(/[：:]/g,"").trim(),dimension=dimensions[label];if(!dimension)return;
    const group:TemplateFilter={id:dimension[0],label,options:[]};
    $(node).find("a[href]").each((_,anchor)=>{const parts=$(anchor).attr("href")?.match(/\/style\/([\d_]+)/)?.[1].split("_"),id=parts?.[dimension[1]];if(id && id!=="0" && !group.options.some(option=>option.id===id))group.options.push({id,label:$(anchor).text().trim()});});
    if(group.options.length)groups.push(group);
  });
  if(!main.options.length)throw new Error("组件分类暂不可用。");
  const match=$(".style-float-page a").first().text().match(/([\d,]+)\s*个素材/);
  if(!match)throw new Error("组件列表暂不可用。");const total=Number(match[1].replaceAll(",",""));
  const items:NativeComponent[]=[];
  $('.list-style .style-item[data-id]').each((_,node)=>{
    const card=$(node),id=card.attr("data-id"),title=card.find(".item-tools h2 > a").first().clone();title.find("i").remove();const html=card.find(".item-content").first().html();
    if(!id || !/^\d+$/.test(id) || !html || items.some(item=>item.id===id))return;
    const categories=groups.flatMap(group=>{const selected=group.options.find(option=>option.id===params.get(group.id));return selected?[selected.label]:[];});
    items.push(item(id,title.text().trim() || `组件 ${id}`,html,"96",categories,`https://bj.96weixin.com/material/style/${id}.html`));
  });
  const pageSize=30;return {...result(groups,items,page,total,url),pageSize,hasNext:page*pageSize<total};
}
type XmyCategory={id:number;catename:string;child?:XmyCategory[]};
export async function fetchXmyComponents(params:URLSearchParams):Promise<ComponentResult> {
  const page=pageOf(params),main=numberFilter(params,"type"),sub=numberFilter(params,"subtype"),third=numberFilter(params,"detail");
  const homepage=await(await get("https://www.xmyeditor.com/")).text();
  const match=homepage.match(/LB01\.labData\s*=\s*'(\[.*?\])';/);if(!match)throw new Error("组件分类暂不可用。");
  const categories=JSON.parse(match[1]) as XmyCategory[];
  if(!Array.isArray(categories))throw new Error("组件分类暂不可用。");
  const parent=categories.find(category=>String(category.id)===main),child=parent?.child?.find(category=>String(category.id)===sub);
  if((main!=="0"&&!parent)||(sub!=="0"&&!child)||(third!=="0"&&!child?.child?.some(category=>String(category.id)===third)))throw new Error("分类无效。");
  const groups:TemplateFilter[]=[{id:"type",label:"类型",options:categories.map(category=>({id:String(category.id),label:category.catename}))}];
  if(parent?.child?.length)groups.push({id:"subtype",label:"细分",options:parent.child.map(category=>({id:String(category.id),label:category.catename}))});
  if(child?.child?.length)groups.push({id:"detail",label:"样式",options:child.child.map(category=>({id:String(category.id),label:category.catename}))});
  const query=params.get("query")?.trim() || "";if(query.length>20)throw new Error("搜索文字过长。");
  const body=new URLSearchParams({page:String(page),pagesize:"20",keyword:query,cateid:third!=="0"?third:sub!=="0"?sub:main!=="0"?main:"",isfree:"2",tpl:"0",order:"",favorite:"0",keyword_type:"0"});
  const response=await(await get("https://wmapi.xmyeditor.com/api/style/lists",body)).json();
  if(response?.code!==0 || !Array.isArray(response.data?.list))throw new Error("组件暂不可用。");
  const items:NativeComponent[]=[];
  for(const entry of response.data.list)if(/^\d+$/.test(String(entry.id)) && typeof entry.code==="string" && !items.some(item=>item.id===String(entry.id))) {
    const path=typeof entry.cate_path==="string"?entry.cate_path.split("/"):[];
    items.push(item(String(entry.id),path.join(" · ") || `组件 ${entry.id}`,entry.code,"xmy",path,"https://www.xmyeditor.com/"));
  }
  const reported=Number(response.data.total);const total=Number.isSafeInteger(reported) && reported>=0 && reported!==10000?reported:null;
  return result(groups,items,page,total,"https://www.xmyeditor.com/",total===null?response.data.list.length>=20:page*20<total);
}
export async function fetchXiumiComponents(params:URLSearchParams):Promise<ComponentResult> {
  const page=pageOf(params);
  const read=async(path:string)=>{const response=await(await get(`https://xiumi.us${path}`)).json();if(response?.code!==0)throw new Error("组件暂不可用。");return response.data;};
  const catalog=await read("/api/templates/paper/comp/rooms");
  if(!Array.isArray(catalog?.rooms) || !catalog.rooms.length)throw new Error("组件目录暂不可用。");
  const rooms=catalog.rooms.filter((room:{tag?:string;name?:string})=>typeof room.tag==="string"&&typeof room.name==="string");
  const roomId=params.get("room") || rooms[0]?.tag;
  const room=rooms.find((room:{tag:string})=>room.tag===roomId);if(!room)throw new Error("组件分类无效。");
  const data=await read(`/api/templates/paper/comp/rooms/${encodeURIComponent(room.tag)}`);
  if(!Array.isArray(data?.items) || data.area?.no_permission)throw new Error("组件内容暂不可用。");
  const available=data.items.filter((entry:{accessibility?:string;template_id?:number;renderer_accelerate?:string})=>entry.accessibility==="Public" && Number.isSafeInteger(entry.template_id) && typeof entry.renderer_accelerate==="string" && entry.renderer_accelerate.trim());
  const query=params.get("query")?.trim().toLowerCase() || "";
  const rows=available.filter((entry:{display_name?:string})=>!query || entry.display_name?.toLowerCase().includes(query));
  const groups:TemplateFilter[]=[{id:"room",label:"类型",allowAll:false,defaultValue:room.tag,options:rooms.map((room:{tag:string;name:string})=>({id:room.tag,label:room.name}))}];
  const items=rows.slice((page-1)*20,page*20).map((entry:{template_id:number;display_name?:string;renderer_accelerate:string})=>{
    const title=entry.display_name && !entry.display_name.startsWith("paper-cp:") ? entry.display_name : load(entry.renderer_accelerate).text().replace(/\s+/g," ").trim().slice(0,36) || room.name;
    return item(String(entry.template_id),title,entry.renderer_accelerate,"xiumi",[room.name],"https://xiumi.us/studio/v5");
  });
  return result(groups,items,page,rows.length,"https://xiumi.us/studio/v5");
}
