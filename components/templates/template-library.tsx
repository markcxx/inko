"use client";

import { useEffect, useState } from "react";
import { Bookmark, Eye, ArrowUpRight, ChevronDown, ExternalLink, LayoutTemplate, Search, SlidersHorizontal, X } from "lucide-react";
import Select from "@/components/ui/select";
import AnimatedOptions from "@/components/ui/animated-options";
import Pagination from "@/components/ui/pagination";
import EmptyState from "@/components/ui/empty-state";
import { templateSources, type SourceTemplate, type TemplateResult } from "@/lib/template-sources";
import TemplatePreviewDialog, { componentStorage, previewDocument, type SavedComponent } from "./template-preview";
import { TemplateListLoading, TemplateLoadError } from "./template-states";
import ComponentSquare from "./component-square";
import { componentSources } from "@/lib/component-sources";
import FilterRow from "./filter-row";
import shared from "@/components/articles/article-library.module.css";
import styles from "./template-library.module.css";

function RemotePreview({ item }: { item: SourceTemplate }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return failed || !item.image ? <div className={shared.placeholder}><LayoutTemplate size={28} /><span>暂无封面</span></div> :
    <div className={styles.coverImage}>
      {!loaded && <div className={`${styles.coverImageLoading} ${styles.skeleton}`} aria-hidden="true"/>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.image} alt={item.title} loading="lazy" referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
    </div>;
}

export default function TemplateLibrary({ globalSearch = "" }: { globalSearch?: string }) {
  const [componentCategory,setComponentCategory] = useState("");
  const [sourceId, setSourceId] = useState(templateSources[0].id);
  const source = templateSources.find(item => item.id === sourceId) || templateSources[0];
  const [tab, setTab] = useState("browse");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TemplateResult | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [savedItems, setSavedItems] = useState<Record<string, SourceTemplate>>({});
  const [showFilters, setShowFilters] = useState(true);
  const [sort, setSort] = useState("source");
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(16);
  const [saved, setSaved] = useState<string[]>([]), [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<SourceTemplate | null>(null);
  const [components, setComponents] = useState<SavedComponent[]>([]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { const data: unknown = JSON.parse(localStorage.getItem("inko.template-bookmarks") || "[]"); if (Array.isArray(data)) setSaved(data.filter((id): id is string => typeof id === "string"));
        const storedComponents = JSON.parse(localStorage.getItem(componentStorage) || "[]");
        if (Array.isArray(storedComponents)) setComponents(storedComponents.filter(item => typeof item?.html === "string" && typeof item?.key === "string"));
        const metadata = JSON.parse(localStorage.getItem("inko.template-bookmark-items") || "{}");
        setSavedItems(metadata); }
      catch { setNotice("无法读取本机收藏"); }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(""), 3500); return () => clearTimeout(id); }, [notice]);
  const bookmarkKey = (item: SourceTemplate) => `${source.id}:${item.id}`;
  const toggleSaved = (item: SourceTemplate) => {
    const key = bookmarkKey(item), next = saved.includes(key) ? saved.filter(id => id !== key) : [...saved, key];
    try { const metadata = { ...savedItems, [key]: item }; localStorage.setItem("inko.template-bookmark-items", JSON.stringify(metadata)); localStorage.setItem("inko.template-bookmarks", JSON.stringify(next)); setSavedItems(metadata); setSaved(next); }
    catch { setNotice("收藏保存失败，请检查浏览器存储权限"); }
  };
  const filterKey = JSON.stringify(Object.fromEntries(Object.entries(filters).filter(([,value])=>value).sort(([a],[b])=>a.localeCompare(b))));
  const search = [globalSearch.trim(), query.trim()].filter(Boolean).join(" ");
  useEffect(() => {
    if (tab !== "browse") return;
    const controller = new AbortController();
    setLoading(true); setError("");
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ source: source.id, page: String(page), pageSize: String(pageSize), sort: source.sort === false ? "source" : sort, query: source.search === false ? "" : search });
        const selection = JSON.parse(filterKey) as Record<string,string>;
        Object.entries(selection).forEach(([key,value])=>{if(value)params.set(key,value);});
        const response = await fetch(`/api/templates?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "无法获取模板列表");
        if (!controller.signal.aborted) setResult(data);
      } catch (reason) { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "请求失败，请重试"); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [sourceId, page, pageSize, sort, search, filterKey, tab, retry, source.id, source.sort, source.search]);
  const groups = result?.groups || [];
  const selected = groups.flatMap(group => { const option = group.options.find(option => option.id === filters[group.id]); return option ? [{ group, option }] : []; });
  const sourceComponents = components.filter(item => item.sourceId === source.id || item.key.startsWith(`${source.id}:`) || (source.id === "135-official" && item.key.startsWith("135:")));
  const componentKinds = Array.from(new Set(sourceComponents.map(item=>item.categoryPath?.[0] || item.kind)));
  const activeComponentCategory = componentKinds.includes(componentCategory) ? componentCategory : "";
  const visibleComponents = sourceComponents.filter(item=>!activeComponentCategory || (item.categoryPath?.[0] || item.kind)===activeComponentCategory);
  const bookmarks = saved.filter(key => key.startsWith(`${source.id}:`)).map(key => savedItems[key]).filter((item): item is SourceTemplate => !!item);
  const localItems = bookmarks.filter(item => item.title.toLowerCase().includes(search.toLowerCase()));
  const currentPage = tab === "saved" ? Math.min(page, Math.max(1, Math.ceil(localItems.length / pageSize))) : result?.page || page;
  const rows = tab === "saved" ? localItems.slice((currentPage - 1) * pageSize, currentPage * pageSize) : result?.items || [];
  const reset = () => { setQuery(""); setFilters({}); setPage(1); };
  const setFilter = (group: string, value: string) => { setFilters(previous => group === "category" ? { category: value, subcategory: "" } : { ...previous, [group]: value }); setPage(1); };
  const showPreview = (item: SourceTemplate) => setPreview(item);
  const saveComponent = (item: SavedComponent) => {
    const next = [...components.filter(component => component.key !== item.key), item];
    try { localStorage.setItem(componentStorage, JSON.stringify(next)); setComponents(next); setNotice("组件已收藏"); return true; }
    catch { setNotice("收藏保存失败，请检查本机存储空间"); return false; }
  };
  const removeComponent = (key: string) => {
    const next = components.filter(item => item.key !== key);
    try { localStorage.setItem(componentStorage, JSON.stringify(next)); setComponents(next); } catch { setNotice("无法更新本机收藏"); }
  };
  return <main className={shared.library}>
    <div className={shared.heading}><div><h1>排版模板</h1><p>为每一篇内容，找到合适的表达。</p></div><div className={styles.source}><span>模板来源</span><Select label="模板来源" value={source.id} options={(tab === "square" ? componentSources : templateSources).map(item => ({ value: item.id, label: item.name }))} onChange={value => { setSourceId(value); reset(); setResult(null); setPreview(null); }} /></div></div>
    <div className={shared.tabRow}><div className={shared.tabScroll}><AnimatedOptions label="模板内容" value={tab} onChange={value => { setTab(value); setPage(1); if(value === "square" && !componentSources.some(item=>item.id===source.id)) {setSourceId(componentSources[0].id);reset();setResult(null);} }} options={[{ value: "browse", label: "模板广场" }, { value: "square", label: "组件广场" }, { value: "saved", label: "我的模板", count: saved.filter(id => id.startsWith(`${source.id}:`)).length, color: "#6c78b8" }, { value: "components", label: "收藏组件", count: sourceComponents.length }]} /></div><a className={`text-button ${styles.sourceLink}`} href={source.url} target="_blank" rel="noreferrer">访问来源<ExternalLink size={14} /></a></div>
    {tab !== "components" && tab !== "square" && <>
      <div className={styles.toolbar}>{(tab === "saved" || source.search !== false) && <label className={shared.search}><Search size={17} /><input aria-label="搜索模板" maxLength={20} placeholder={tab === "saved" ? "搜索本机收藏…" : "搜索原站模板…"} value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} />{query && <button aria-label="清空模板搜索" onClick={() => setQuery("")}><X size={14} /></button>}</label>}{tab === "browse" && source.sort !== false && <Select label="模板排序" value={sort} onChange={value => { setSort(value); setPage(1); }} options={[{ value: "source", label: "来源默认排序" }, { value: "newest", label: "最近上新" }]} /> }{tab === "browse" && groups.length > 0 && <button className={`text-button ${styles.filterToggle}`} aria-expanded={showFilters} aria-controls="template-filters" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={15} />{showFilters ? "收起筛选" : "展开筛选"}<ChevronDown size={14} className={showFilters ? styles.filterChevronExpanded : undefined} /></button>}</div>
      <div className={styles.filterCollapse} data-expanded={showFilters} hidden={tab !== "browse" || !groups.length} aria-hidden={!showFilters} inert={!showFilters}><div className={styles.filterCollapseInner}><section id="template-filters" aria-label={`${source.name}分类`} className={styles.filters}>
        {groups.map(group => <FilterRow key={`${source.id}:${group.id}`} group={group} value={filters[group.id] || ""} onChange={value => setFilter(group.id, value)} />)}
      </section></div></div>
      {tab === "browse" && selected.length > 0 && <div className={styles.selection}><span>已选</span>{selected.map(({ group, option }) => <button key={group.id} onClick={() => setFilter(group.id, "")} aria-label={`移除${group.label}筛选：${option.label}`}>{option.label}<X size={12} /></button>)}<button className="text-button" onClick={() => { setFilters({}); setPage(1); }}>清空筛选</button></div>}
      <div className={tab === "browse" ? styles.componentCanvas : undefined}>
      <div className={styles.resultBar}><span>{tab === "saved" ? `收藏的模板 ${localItems.length}` : loading || error ? "" : result?.total !== null && result?.total !== undefined ? `共 ${result.total.toLocaleString()} ${source.id === "xiumi" ? "条排版" : "套模板"}` : `本次返回 ${rows.length} 套 · 原站未提供总数`}</span></div>

      {tab === "browse" && loading ? <TemplateListLoading/> : tab === "browse" && error ? <TemplateLoadError onRetry={()=>setRetry(value=>value+1)}/> :
      rows.length ? <><div className={styles.grid}>{rows.map(item => <article className={`${shared.card} ${styles.templateCard}`} key={`${source.id}:${item.id}`}><div className={styles.cover}><RemotePreview item={item} /><div className={styles.cardOverlay}><a className={styles.useTemplate} href={item.url} target="_blank" rel="noreferrer" title={`在${source.name}中使用模板`}><ArrowUpRight size={16}/>使用模板</a><button className={styles.previewTemplate} onClick={() => showPreview(item)}><Eye size={16}/>预览模板</button><button className={styles.saveTemplate} onClick={() => toggleSaved(item)}><Bookmark size={16} fill={saved.includes(bookmarkKey(item)) ? "currentColor" : "none"}/>{saved.includes(bookmarkKey(item)) ? "取消收藏" : "收藏模板"}</button></div></div><div className={styles.cardBody}><button className={shared.cardTitle} onClick={() => showPreview(item)}>{item.title}</button><div className={styles.tags}>{groups.flatMap(group => group.options.filter(option => item.filters[group.id]?.includes(option.id))).slice(0, 3).map(option => <span key={option.id}>{option.label}</span>)}</div></div></article>)}</div><Pagination countSummary={tab === "browse"} total={tab === "saved" ? localItems.length : result?.total ?? null} page={currentPage} pageSize={tab === "saved" ? pageSize : result?.pageSize || pageSize} count={rows.length} hasNext={result?.hasNext || false} maxPages={tab === "saved" ? undefined : result?.maxPages} showPageSize={tab === "saved" || (!source.fixedPageSize && !result?.loginRequired)} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} label="模板分页" /></> : <EmptyState icon={tab === "saved" ? Bookmark : Search} title={tab === "saved" && !query && !globalSearch ? "还没有收藏模板" : "没有找到匹配的模板"} description={tab === "saved" ? "在模板卡片上点击收藏，喜欢的排版就能留在这里。" : "试试调整筛选条件，发现更多排版。"} action={<button className="empty-state-button" onClick={() => { reset(); setTab("browse"); }}>查看全部模板</button>} />}
      </div>
    </>}
    {tab === "square" && <ComponentSquare key={source.id} sourceId={source.id} onSave={saveComponent} savedKeys={components.map(item=>item.key)} globalSearch={globalSearch}/>}
    {tab === "components" && <div className={styles.toolbar}><Select label="组件分类" value={activeComponentCategory} onChange={setComponentCategory} options={[{value:"",label:"全部组件"},...componentKinds.map(kind=>({value:kind,label:kind}))]}/></div>}
    {tab === "components" && <div className={`${styles.componentCanvas} ${styles.collectionCanvas}`}>{visibleComponents.length ? <div className={styles.grid}>{visibleComponents.map(component => <article className={shared.card} key={component.key}><iframe sandbox="allow-same-origin" title={component.label} srcDoc={previewDocument(component.html)} className={styles.componentFrame}/><div className={styles.cardBody}><strong>{component.kind}</strong><p>{component.label}</p><div className={styles.cardFooter}><span>{component.sourceKind === "native" ? `原生组件 ${component.sourceComponentId}` : `模板 ${component.templateId}`}</span><button className="text-button" onClick={() => removeComponent(component.key)}>取消收藏</button></div></div></article>)}</div> : <EmptyState icon={LayoutTemplate} title="还没有收藏组件" description="打开完整模板预览，点击喜欢的组件即可收藏。" action={<button className="empty-state-button" onClick={() => setTab("browse")}>浏览模板</button>} />}</div>}
    {preview && <TemplatePreviewDialog key={`${source.id}:${preview.id}`} sourceId={source.id} item={preview} onClose={() => setPreview(null)} onSave={saveComponent}/>}
    {notice && <div className="toast" role="status">{notice}</div>}
  </main>;
}
