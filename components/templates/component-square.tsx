"use client";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Eye, LayoutTemplate, Search, X } from "lucide-react";
import type { ComponentResult, NativeComponent } from "@/lib/component-sources";
import IconButton from "@/components/ui/icon-button";
import FilterRow from "./filter-row";
import Pagination from "@/components/ui/pagination";
import EmptyState from "@/components/ui/empty-state";
import TemplatePreviewDialog, { previewDocument, type SavedComponent } from "./template-preview";
import { ComponentListLoading, TemplateLoadError } from "./template-states";
import shared from "@/components/articles/article-library.module.css";
import styles from "./template-library.module.css";
function ComponentRendering({ item, saved, onPreview, onSave }: { item: NativeComponent; saved: boolean; onPreview: () => void; onSave: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(144);
  useEffect(() => {
    const iframe = frame.current;
    if (!iframe) return;
    let observer: ResizeObserver | undefined;
    const measure = () => {
      observer?.disconnect();
      const content = iframe.contentDocument?.getElementById("component-content");
      if (!content) return;
      const update = () => setHeight(Math.max(64, Math.ceil(content.getBoundingClientRect().height)));
      observer = new ResizeObserver(update);
      observer.observe(content);
      update();
    };
    iframe.addEventListener("load", measure);
    measure();
    return () => { iframe.removeEventListener("load", measure); observer?.disconnect(); };
  }, [item.preview.html]);
  const document = previewDocument(`<div id="component-content" style="display:flow-root;padding:16px">${item.preview.html}</div>`)
    .replace("</style>", "html,body{overflow:hidden;pointer-events:none}[data-component]{cursor:default}</style>");
  return <div className={styles.nativeItem}>
    <div className={styles.nativeSurface}>
      <iframe ref={frame} title={item.title} className={styles.nativeFrame} style={{height}} sandbox="allow-same-origin" tabIndex={-1} aria-hidden="true" srcDoc={document}/>
      <div className={styles.nativeActions}>
        <IconButton icon={Eye} label="预览组件" onClick={onPreview}/>
        <IconButton icon={Bookmark} label={saved ? "已收藏" : "收藏组件"} active={saved} onClick={onSave}/>
      </div>
    </div>
    {!!item.categoryPath.length && <div className={`${styles.tags} ${styles.nativeTags}`}>{item.categoryPath.map((label,index)=><span key={`${label}-${index}`}>{label}</span>)}</div>}
  </div>;
}
export default function ComponentSquare({sourceId,onSave,savedKeys,globalSearch=""}:{sourceId:string;onSave:(component:SavedComponent)=>boolean;savedKeys:string[];globalSearch?:string}) {
  const [query,setQuery]=useState(""),[filters,setFilters]=useState<Record<string,string>>({}),[page,setPage]=useState(1);
  const [result,setResult]=useState<ComponentResult|null>(null),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
  const [preview,setPreview]=useState<NativeComponent|null>(null);
  const filterKey=JSON.stringify(filters),search=sourceId === "96" ? "" : [globalSearch,query].map(value=>value.trim()).filter(Boolean).join(" ");
  useEffect(()=>{
    const controller=new AbortController();setLoading(true);setFailed(false);
    const timer=setTimeout(async()=>{
      try {
        const params=new URLSearchParams({source:sourceId,page:String(page),query:search});
        Object.entries(JSON.parse(filterKey) as Record<string,string>).forEach(([key,value])=>{if(value)params.set(key,value);});
        const response=await fetch(`/api/components?${params}`,{signal:controller.signal});
        if(!response.ok)throw new Error();const data=await response.json();if(!controller.signal.aborted)setResult(data);
      }catch{if(!controller.signal.aborted)setFailed(true);}finally{if(!controller.signal.aborted)setLoading(false);}
    },250);
    return()=>{clearTimeout(timer);controller.abort();};
  },[sourceId,page,search,filterKey,retry]);
  const choose=(group:string,value:string)=>{setFilters(previous=>group==="type"?{...previous,type:value,subtype:"",detail:""}:group==="subtype"?{...previous,subtype:value,detail:""}:{...previous,[group]:value});setPage(1);};
  const save=(item:NativeComponent)=>onSave({id:item.id,kind:item.kind,label:item.title,html:item.preview.html.replace(/\s(?:data-component|data-selected|tabindex|role|aria-label)="[^"]*"/g,""),key:`${sourceId}:native:${item.id}:original`,sourceId,sourceKind:"native",sourceComponentId:item.id,categoryPath:item.categoryPath,originUrl:item.url,templateId:item.id,templateTitle:item.title});
  return <section aria-label="组件广场">{sourceId !== "96" && <div className={styles.toolbar}><label className={shared.search}><Search size={17}/><input aria-label="搜索组件" placeholder={sourceId==="xiumi"?"搜索当前分类组件…":"搜索组件…"} maxLength={20} value={query} onChange={event=>{setQuery(event.target.value);setPage(1);}}/>{query && <button aria-label="清空组件搜索" onClick={()=>setQuery("")}><X size={14}/></button>}</label></div>}
    {!!result?.groups.length && <div className={styles.filters}>{result.groups.map(group=><FilterRow key={group.id} group={group} value={filters[group.id] || group.defaultValue || ""} onChange={value=>choose(group.id,value)}/>)}</div>}
    <div className={styles.resultBar}><span>{loading || failed ? "" : result?.total===null ? `本页 ${result.items.length} 个组件` : `共 ${result?.total?.toLocaleString() || 0} 个组件`}</span></div>
    {loading?<ComponentListLoading/>:failed?<TemplateLoadError noun="组件" onRetry={()=>setRetry(value=>value+1)}/>:result?.items.length?<><div className={styles.componentMasonry}>{result.items.map(item=><ComponentRendering key={item.id} item={item} saved={savedKeys.includes(`${sourceId}:native:${item.id}:original`)} onPreview={()=>setPreview(item)} onSave={()=>save(item)}/>)}</div><Pagination total={result.total} page={result.page} pageSize={result.pageSize} count={result.items.length} countSummary hasNext={result.hasNext} showPageSize={false} onPageChange={setPage} onPageSizeChange={()=>{}} label="组件分页"/></>:<EmptyState icon={LayoutTemplate} title="没有找到匹配的组件" description="换个分类或关键词，发现更多组件。" action={<button className="empty-state-button" onClick={()=>{setQuery("");setFilters({});setPage(1);}}>查看组件</button>}/>}
    {preview && <TemplatePreviewDialog key={preview.id} sourceId={sourceId} item={preview} nativeItem={preview} onClose={()=>setPreview(null)} onSave={onSave}/>}
  </section>;
}
