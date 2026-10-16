"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import ArticleLibrary from "@/components/articles/article-library";
import "@fontsource/geo/400.css";
import Overview from "@/components/dashboard/overview";
import Select from "@/components/ui/select";
import EmptyState from "@/components/ui/empty-state";
import useSidebarResize from "@/components/ui/use-sidebar-resize";
import { demoDataset, periods, type Article } from "@/lib/analytics";
import IconButton from "@/components/ui/icon-button";
import { ArrowUpRight, House, Check, ChevronDown, ChevronRight, CircleHelp, Feather, FileText, ImageIcon, LayoutTemplate, Lightbulb, Moon, PanelLeft, Plus, Search, Settings2, Star, Sun, Telescope, X, type LucideIcon } from "lucide-react";

const nav: [string, LucideIcon][] = [["首页", House], ["文章库", FileText], ["创作偏好", Settings2], ["排版模板", LayoutTemplate]];
const actions: [LucideIcon, string, string][] = [[Feather, "开始写作", "把想法写成好文章"], [Lightbulb, "发现选题", "寻找下一个好灵感"], [Telescope, "深度调研", "让观点有据可依"], [ImageIcon, "生成配图", "让内容更有画面"]];
export default function Workspace({ page = "home" }: { page?: "home" | "articles" }) {
  const pageTitle = page === "articles" ? "文章库" : "首页";
  const [dark, setDark] = useState(false);
  const sidebar = useSidebarResize();
  const [period, setPeriod] = useState("7"), [search, setSearch] = useState(""), [tab, setTab] = useState("最近编辑");
  const [modal, setModal] = useState<string | null>(null), [draft, setDraft] = useState(""), [saved, setSaved] = useState<Article[]>([]);
  const [notice, setNotice] = useState(""), [favorite, setFavorite] = useState(false);
  useEffect(() => { const id = setTimeout(() => setNotice(""), 3500); return () => clearTimeout(id); }, [notice]);
  useEffect(() => { if (!modal) return; const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(null); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [modal]);
  const [now, setNow] = useState(() => new Date(0));
  const example = useMemo(() => demoDataset(now), [now]);
  const dataset = useMemo(() => ({ articles: [...saved, ...example.articles], events: example.events }), [example, saved]);
  useEffect(() => {
    setNow(new Date());
    try {
      const data: unknown = JSON.parse(localStorage.getItem("inko.articles") || "[]");
      if (Array.isArray(data)) setSaved(data.filter((a): a is Article => a && typeof a.id === "string" && typeof a.title === "string" && typeof a.category === "string" && Number.isFinite(a.words) && a.words >= 0 && ["草稿", "撰写中", "待润色", "已完成"].includes(a.status) && Number.isFinite(Date.parse(a.createdAt))));
    } catch { setNotice("本机草稿读取失败，请检查浏览器存储权限"); }
  }, []);
  const open = (name: string) => { setDraft(""); setModal(name); };
  const rows = dataset.articles.filter(a => a.title.includes(search) && (tab !== "草稿箱" || a.status === "草稿")).slice(0, 8);
  const saveDraft = () => {
    const article: Article = { id: crypto.randomUUID(), title: draft.trim(), category: "未分类", words: 0, status: "草稿", createdAt: new Date().toISOString() };
    const next = [article, ...saved];
    try { localStorage.setItem("inko.articles", JSON.stringify(next)); } catch { setNotice("保存失败：浏览器存储不可用"); return; }
    setNow(new Date()); setSaved(next); setModal(null); setTab("最近编辑"); setSearch(""); setNotice("草稿已保存在本机，统计已更新");
  };
  return <div className={`workspace ${dark ? "dark" : ""} ${!sidebar.open ? "hide-sidebar" : ""} ${sidebar.dragging ? "resizing-sidebar" : ""}`} style={{ "--sidebar-width": `${sidebar.open ? sidebar.width : 0}px` } as CSSProperties}>
    <aside className="sidebar">
      <div className="sidebar-header"><Link className="brand" href="/" aria-label="inko 首页"><span className="brand-symbol">✳</span><span className="brand-copy"><span className="brand-wordmark">inko</span><span className="brand-caption">创作，由此发生</span></span></Link></div>
      <div className="sidebar-navigation">
      <div className="side-section"><div className="side-tabs"><span>收藏</span><span>最近访问</span></div>{["长期主义写作笔记", "AI 时代的创作方法", ...(favorite ? ["首页"] : [])].map(name => <button key={name} className="favorite-link" onClick={() => name === "首页" ? window.scrollTo({ top: 0, behavior: "smooth" }) : open(name)}><i />{name}</button>)}</div>
      <div className="nav-heading">创作工作台</div><nav>{nav.map(([name, Icon]) => name === "首页" || name === "文章库" ? <Link key={name} href={name === "首页" ? "/" : "/articles"} className={`nav-item ${name === pageTitle ? "selected" : ""}`} aria-current={name === pageTitle ? "page" : undefined}><Icon size={19} strokeWidth={1.65} /><span>{name}</span></Link> : <button key={name} className="nav-item" onClick={() => open(name)}><Icon size={19} strokeWidth={1.65} /><span>{name}</span></button>)}</nav>

      </div>
      <div className="sidebar-bottom"><details className="account-menu"><summary className="workspace-name account-button" aria-label="账号信息：Mark，mark@inko.app"><span className="avatar">M</span><span className="account-copy"><strong>Mark</strong><small>mark@inko.app</small></span><ChevronDown size={13} /></summary><div className="account-menu-panel"><span>Mark · 个人账号</span><button onClick={() => open("设置")}><Settings2 size={16} />设置</button></div></details></div>
    </aside>
    <div className="sidebar-resize-handle" role="separator" aria-label="调整导航栏宽度" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={420} aria-valuenow={sidebar.open ? Math.round(sidebar.width) : 0} aria-valuetext={sidebar.open ? `${Math.round(sidebar.width)} 像素` : "已收起"} tabIndex={0} title="拖动调整宽度，向左拖窄收起；双击收起或展开" {...sidebar.handleProps} />
    <div className="center-column"><header className="topbar"><div className="header-left"><IconButton icon={PanelLeft} label={sidebar.open ? "收起导航栏" : "展开导航栏"} onClick={sidebar.toggle} /><IconButton icon={Star} label="收藏看板" active={favorite} onClick={() => { setFavorite(!favorite); setNotice(favorite ? "已取消收藏" : "首页已加入收藏"); }} /><span className="breadcrumb">工作台</span><span className="slash">/</span><span>{pageTitle}</span></div><div className="header-right"><div className="global-search"><Search size={15} /><input aria-label="搜索文章" placeholder="搜索内容…" value={search} onChange={e => setSearch(e.target.value)} /><span className="search-hint">搜索</span></div><IconButton icon={dark ? Moon : Sun} label="切换明暗主题" onClick={() => setDark(!dark)} /></div></header>
      {page === "articles" ? <ArticleLibrary globalSearch={search} /> : <main><div className="page-heading"><h1>创作概览 <span>让好内容持续发生。</span></h1><div className="heading-actions"><Select label="统计时间范围" value={period} onChange={setPeriod} options={periods} /><button className="primary-button" onClick={() => open("新建文章")}><Plus size={15} />新建创作</button></div></div>

      <Overview data={dataset} dark={dark} days={Number(period)} now={now} />
      <section className="quick-actions" aria-label="创作快捷入口">{actions.map(([Icon, title, desc]) => <button key={title} onClick={() => open(title)}><span className="quick-icon"><Icon size={20} strokeWidth={1.5} /></span><span><strong>{title}</strong><small>{desc}</small></span><ArrowUpRight size={15} /></button>)}</section>
      <section className="articles-section"><div className="article-heading"><div className="article-tabs">{["最近编辑", "草稿箱"].map(name => <button key={name} className={tab === name ? "chosen" : ""} onClick={() => setTab(name)}>{name}</button>)}</div><Link className="text-button" href="/articles">全部文章<ArrowUpRight size={14} /></Link></div><div className="table-wrap"><table><thead><tr><th>文章标题</th><th>分类</th><th>字数</th><th>状态</th><th>最近编辑</th><th /></tr></thead><tbody>{rows.map((a) => <tr key={a.id} onClick={() => open(a.title)} tabIndex={0} onKeyDown={e => { if (e.key === "Enter") open(a.title); }}><td><FileText size={16} />{a.title}</td><td>{a.category}</td><td>{a.words.toLocaleString()}</td><td><span className={`status ${{"草稿":"gray","撰写中":"purple","待润色":"blue","已完成":"green"}[a.status]}`}><i />{a.status}</span></td><td>{new Date(a.createdAt).toLocaleDateString("zh-CN")}</td><td><ChevronRight size={14} /></td></tr>)}</tbody></table></div>{rows.length === 0 && <div className="article-empty"><EmptyState icon={search ? Search : FileText} title={search ? "没有找到相关文章" : tab === "草稿箱" ? "草稿箱还是空的" : "还没有创作记录"} description={search ? "试试其他关键词，或清空搜索查看全部内容。" : "把第一个想法写下来，让创作从这里开始。"} action={search ? <button className="empty-state-button" onClick={() => setSearch("")}><X size={14} />清空搜索</button> : <button className="empty-state-button" onClick={() => open("新建文章")}><Plus size={14} />开始创作</button>} /></div>}</section>
      <footer><span>© 2026 inko · 为创作者而生</span><button onClick={() => open("帮助与反馈")}><CircleHelp size={13} />帮助与反馈</button></footer></main>}
    </div>
    {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}
    {modal && <div className="modal-backdrop" onClick={() => setModal(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={e => e.stopPropagation()}><div className="card-heading"><h2 id="dialog-title">{modal}</h2><IconButton icon={X} label="关闭" onClick={() => setModal(null)} /></div><p className="modal-description">{["新建文章", "开始写作", "记录灵感"].includes(modal) ? "写下你的想法，开启下一次创作。" : "记录你的想法，为下一次创作积累灵感。"}</p><label htmlFor="draft-title">标题或创作想法</label><textarea id="draft-title" autoFocus placeholder="例如：聊聊 AI 时代，创作者如何保持独立思考…" value={draft} onChange={e => setDraft(e.target.value)} /><div className="modal-footer"><span>灵感从这里开始</span><button className="primary-button" disabled={!draft.trim()} onClick={saveDraft}><Plus size={14} />保存草稿</button></div></section></div>}
  </div>;
}
