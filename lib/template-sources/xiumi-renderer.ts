import { load } from "cheerio";
type Value = Record<string, unknown>;
const object = (value: unknown): Value => value && typeof value === "object" && !Array.isArray(value) ? value as Value : {};
const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]!));
function css(value: unknown): string {
  return Object.entries(object(value)).filter(([key,val])=>/^[a-zA-Z][a-zA-Z0-9]*$/.test(key) && (typeof val==="string" || typeof val==="number") && !String(val).includes("tn-default-color")).map(([key,val])=>`${key.replace(/[A-Z]/g,char=>`-${char.toLowerCase()}`)}:${val}`).join(";");
}
function group(value: unknown, depth=0): string {
  if(depth>80)return "";
  if(Array.isArray(value))return value.map(node=>group(node,depth+1)).join("");
  const node=object(value),comp=object(node._comp);
  if(typeof comp._$raHTML==="string" && comp._$raHTML.trim())return comp._$raHTML;
  if(node.type==="text" && typeof node.text==="string")return `<div class="tn-cell-text" style="${escape(css(node.style))}">${node.text}</div>`;
  if(node.type==="image") {
    const image=object(node.image);
    const source=node.src || node.url || image.src || image.url;
    return typeof source==="string" ? `<div class="tn-cell-image" style="${escape(css(node.style))}"><img src="${escape(source)}" style="width:100%;height:auto"></div>` : "";
  }
  if(Array.isArray(node.items))return `<div class="tn-cell-group" style="${escape(css(node.style))}">${group(node.items,depth+1)}</div>`;
  const slots=Object.entries(node).filter(([key,val])=>!key.startsWith("_") && val && typeof val==="object");
  if(!slots.length)return "";
  const columns=slots.filter(([key])=>/^col\d+$/.test(key));
  const inner=columns.length>1 ? `<div style="display:flex;align-items:flex-start">${columns.map(([,val])=>`<div style="flex:1;min-width:0">${group(val,depth+1)}</div>`).join("")}</div>` : slots.map(([,val])=>group(val,depth+1)).join("");
  return comp.tplId ? `<section class="tn-comp" style="${escape(css(comp.style))}">${inner}</section>` : inner;
}
function hasContent(html: string): boolean {
  const $ = load(html, {}, false);
  return !!$.root().text().trim() || $("img,svg,table").length > 0;
}
export function renderXiumiContent(value: unknown): string {
  const data=object(value);
  if(!Array.isArray(data.cubes))throw new Error("秀米预览内容不可用。");
  const pages: string[]=[];
  for(const rawCube of data.cubes) {
    const cube=object(rawCube);
    for(const rawPage of Array.isArray(cube.pages)?cube.pages:[]) {
      const page=object(rawPage),comp=object(page._comp);
      const html=typeof comp._$raHTML==="string" ? comp._$raHTML : group(page.layers);
      if(hasContent(html))pages.push(`<section class="xiumi-page" style="${escape(css(comp.style))}">${html}</section>`);
    }
  }
  // Some exports retain their flow components only in appendix fragments.
  if(!pages.length) {
    const fragments=object(object(data.$appendix).fragments);
    const flow=Array.isArray(fragments.flow)?fragments.flow:[];
    for(const fragment of flow) {const html=group(object(fragment).slices);if(hasContent(html))pages.push(`<section class="xiumi-page">${html}</section>`);}
  }
  if(!pages.length)throw new Error("秀米未提供可渲染的完整内容。");
  const $=load(`<section class="xiumi-template">${pages.join("")}</section>`,{},false);
  // Convert protocol-relative asset links before sanitizing the exported HTML.
  $("[src],[href],[xlink\\:href]").each((_,node)=>{
    for(const attribute of ["src","href","xlink:href"]) {
      const url=$(node).attr(attribute);
      if(url?.startsWith("//"))$(node).attr(attribute,`https:${url}`);
    }
  });
  $("[style]").each((_,node)=>{ $(node).attr("style",($(node).attr("style") || "").replace(/url\(\s*(["']?)\/\//gi,'url($1https://')); });
  $(".tn-comp,.tn-cell-text,.tn-cell-image,.tn-cell-group").each((_,node)=>{
    const element=$(node),text=element.text().trim(),images=element.find("img,image").length;
    const kind=element.hasClass("tn-cell-image")?"图片组件":element.hasClass("tn-cell-text")?(text.length>45?"正文框":"标题"):images>1?(text?"图文组合":"多图布局"):images?(text?"图文组合":"图片组件"):text.length>45?"正文框":text?"标题":"装饰组件";
    element.attr("data-xiumi-kind",kind);
  });
  return $.html();
}
