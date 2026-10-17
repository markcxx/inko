"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bookmark, Layers, X } from "lucide-react";
import IconButton from "@/components/ui/icon-button";
import { TemplateLoadError, TemplatePreviewLoading } from "./template-states";
import type { NativeComponent } from "@/lib/component-sources";
import type { SourceTemplate } from "@/lib/template-sources";
import type { TemplateComponent, TemplatePreview } from "@/lib/template-sources/preview";
import shared from "@/components/articles/article-library.module.css";
import styles from "./template-library.module.css";
export type SavedComponent = TemplateComponent & { key: string; templateId: string; templateTitle: string; sourceId?: string; sourceComponentId?: string; categoryPath?: string[]; originUrl?: string; sourceKind?: "native" | "template" };
export const componentStorage = "inko.saved-template-components";
export function previewDocument(html: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src 'none'; base-uri 'none'; form-action 'none'"><style>html{background:white;overscroll-behavior:none}body{overscroll-behavior:none;margin:0;color:#333;font:16px/1.6 sans-serif;overflow-wrap:break-word}*{box-sizing:border-box;max-width:100%}img{max-width:100%;height:auto}p{margin:0}.tn-comp,.tn-child-position-absolute{position:relative}.tn-cell-text{overflow-wrap:break-word}.tn-cell-image img{vertical-align:middle} [data-component]{cursor:pointer} [data-component]:hover,[data-component]:focus-visible,[data-selected]{outline:2px solid var(--component-accent, currentColor)!important;outline-offset:-2px!important} [data-component]:hover{box-shadow:inset 0 0 0 10000px color-mix(in srgb, var(--component-accent, currentColor) 5%, transparent)}</style></head><body>${html}</body></html>`;
}
const palette = ["#7470c6", "#287d71", "#3681b8", "#d36b52", "#b78c40", "#ad5887"];
function tint(value: string, color: string) {
  return value.replace(/#[\da-f]{6}\b|#[\da-f]{3}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/gi, token => {
    const rgb = token.startsWith("#") ? (token.length === 4 ? token.slice(1).split("").map(c => c+c).join("") : token.slice(1)).match(/../g)!.map(v => parseInt(v,16)) : token.match(/[\d.]+/g)!.map(Number);
    const max = Math.max(...rgb.slice(0,3)), min = Math.min(...rgb.slice(0,3));
    if (max-min < 28) return token;
    const light = (max+min)/510;
    return `color-mix(in srgb, ${color} ${Math.round((light > .5 ? (1-light)*2 : light*2)*100)}%, ${light > .5 ? "white" : "black"})`;
  });
}
export default function TemplatePreviewDialog({ item, sourceId, onClose, onSave, nativeItem }: { nativeItem?: NativeComponent; sourceId: string; item: SourceTemplate; onClose: () => void; onSave: (item: SavedComponent) => boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), frame = useRef<HTMLIFrameElement>(null);
  const originalStyles = useRef<{ element: Element; style: string }[]>([]);
  const chooseComponent = useRef<(element: HTMLElement) => void>(() => {});
  const [retry,setRetry] = useState(0);
  const [data,setData] = useState<TemplatePreview|null>(null), [error,setError] = useState("");
  const [position,setPosition] = useState<{top:number;left:number}|null>(null);
  const [selected,setSelected] = useState<string>(""), [color,setColor] = useState(""), [saved,setSaved] = useState("");
  useEffect(() => {
    const elements = [document.documentElement, document.body];
    const properties = ["overflow", "overscroll-behavior"];
    const previous = elements.map(element => properties.map(property => ({
      property, value: element.style.getPropertyValue(property), priority: element.style.getPropertyPriority(property),
    })));
    elements.forEach(element => {
      element.style.setProperty("overflow", "hidden");
      element.style.setProperty("overscroll-behavior", "none");
    });
    return () => elements.forEach((element, index) => previous[index].forEach(({ property, value, priority }) => {
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    }));
  }, []);
  useEffect(() => {
    if(!dialog.current?.open)dialog.current?.showModal();
    setData(null);setError("");setSelected("");setPosition(null);
    originalStyles.current=[];
    if(nativeItem) { setData(nativeItem.preview); return; }
    const controller = new AbortController();
    fetch(`/api/templates/preview?source=${encodeURIComponent(sourceId)}&id=${item.id}`, {signal:controller.signal}).then(async response => {
      const body = await response.json();
      if(!response.ok) throw new Error(body.error);
      if(!controller.signal.aborted) setData(body);
    }).catch(reason => {if(!controller.signal.aborted)setError(reason.message);});
    return () => controller.abort();
  }, [item.id, sourceId, retry, nativeItem]);
  const applyColors = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    const accent = color || (dialog.current ? getComputedStyle(dialog.current).getPropertyValue("--accent").trim() : "") || "#7470c6";
    originalStyles.current.forEach(({ element, style }) => {
      element.setAttribute("style", color ? tint(style, color) : style);
    });
    doc.documentElement.style.setProperty("--component-accent", accent);
  }, [color]);
  useEffect(() => { applyColors(); }, [applyColors]);
  const prepare = () => {
    const doc = frame.current?.contentDocument; if(!doc) return;
    originalStyles.current = Array.from(doc.querySelectorAll("[style]"), element => ({ element, style: element.getAttribute("style") || "" }));
    applyColors();
    const place = () => {
      const active = doc.querySelector<HTMLElement>("[data-selected]");
      const iframe = frame.current;
      if(!active || !iframe) { setPosition(null); return; }
      const rect = active.getBoundingClientRect();
      if(rect.bottom < 0 || rect.top > iframe.clientHeight) { setPosition(null); return; }
      setPosition({ top: Math.min(Math.max(rect.top + 4, 4), iframe.clientHeight - 40), left: iframe.offsetLeft + Math.max(4, iframe.clientWidth - (data?.components.find(entry=>entry.id===active.dataset.component)?.parentId ? 72 : 36)) });
    };
    doc.addEventListener("scroll",place); doc.defaultView?.addEventListener("resize",place);
    chooseComponent.current = element => {
      doc.querySelectorAll("[data-selected]").forEach(node=>node.removeAttribute("data-selected"));
      element.setAttribute("data-selected", "true");setSelected(element.dataset.component!);setSaved("");place();
    };
    const choose = (event: Event) => {
      const target = event.target as Node | null;
      const element = (target?.nodeType === 1 ? target as Element : target?.parentElement)?.closest<HTMLElement>("[data-component]");
      if(!element)return;
      event.preventDefault();event.stopPropagation();chooseComponent.current(element);
    };
    doc.addEventListener("click", choose);
    doc.addEventListener("keydown", event => {if(event.key==="Enter" || event.key===" ")choose(event);});
  };
  const component = data?.components.find(component=>component.id===selected);
  const save = () => {
    if(!component)return;
    const node = frame.current?.contentDocument?.querySelector(`[data-component="${component.id}"]`)?.cloneNode(true) as HTMLElement|undefined;
    if(node) [node,...Array.from(node.querySelectorAll("[data-component]"))].forEach(element=>["data-component","data-selected","tabindex","role","aria-label"].forEach(attr=>element.removeAttribute(attr)));
    const success = onSave({...component, label: node?.textContent?.trim().slice(0,36) || component.label, html:node?.outerHTML || component.html, key:`${sourceId}:${item.id}:${component.id}:${color || "original"}`,sourceId,sourceKind:nativeItem?"native":"template",sourceComponentId:nativeItem?.id,categoryPath:nativeItem?.categoryPath,originUrl:nativeItem?.url,templateId:item.id,templateTitle:item.title});setSaved(success ? "已收藏" : "保存失败，重试");
  };
  const saveWhole = () => {
    if(!nativeItem)return;
    const body = frame.current?.contentDocument?.body.cloneNode(true) as HTMLElement | undefined;
    body?.querySelectorAll("[data-component]").forEach(element=>["data-component","data-selected","tabindex","role","aria-label"].forEach(attribute=>element.removeAttribute(attribute)));
    const success=onSave({id:nativeItem.id,kind:nativeItem.kind,label:nativeItem.title,html:body?.innerHTML || nativeItem.preview.html,key:`${sourceId}:native:${nativeItem.id}:${color || "original"}`,sourceId,sourceComponentId:nativeItem.id,sourceKind:"native",categoryPath:nativeItem.categoryPath,originUrl:nativeItem.url,templateId:nativeItem.id,templateTitle:nativeItem.title});
    setSaved(success?"已收藏":"保存失败，重试");
  };
  return <dialog ref={dialog} className={`${shared.dialog} ${styles.previewDialog}`} onCancel={onClose} onClose={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}} aria-label="完整模板预览">
    {nativeItem && data && <div className={styles.previewWholeSave}><IconButton icon={Bookmark} label={saved || "收藏整个组件"} active={saved === "已收藏"} onClick={saveWhole}/></div>}
    <div className={styles.previewClose}><IconButton icon={X} label="关闭模板预览" onClick={onClose}/></div>
    <div className={styles.previewStage}>{error ? <TemplateLoadError preview onRetry={()=>setRetry(value=>value+1)} onClose={onClose}/> : !data ? <TemplatePreviewLoading/> : <iframe ref={frame} title="完整模板内容" sandbox="allow-same-origin" srcDoc={previewDocument(data.html)} onLoad={prepare} className={styles.templateFrame}/>}{component && position && <div className={styles.componentTools} style={position}>{component.parentId && <button className={styles.componentAction} onClick={()=>{const node=frame.current?.contentDocument?.querySelector<HTMLElement>(`[data-component="${component.parentId}"]`);if(node)chooseComponent.current(node);}} aria-label="选择外层组件" data-tooltip="选择外层组件"><Layers size={16}/></button>}<button className={styles.componentAction} onClick={save} aria-label={saved || "收藏组件"} data-tooltip={saved || "收藏组件"}><Bookmark size={16} fill={saved === "已收藏" ? "currentColor" : "none"}/></button></div>}</div>
    {data && !error && <div className={styles.palette} aria-label="模板主题色">{palette.map(value=><button key={value} style={{background:value}} aria-label={`主题色 ${value}`} data-tooltip="切换主题色" aria-pressed={color===value} onClick={()=>{setColor(value);setSaved("");}}/>)}</div>}

  </dialog>;
}
