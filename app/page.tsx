"use client";

import { useEffect, useMemo, useState } from "react";
import Overview from "@/components/dashboard/overview";
import Select from "@/components/ui/select";
import { demoDataset, periods, type Article } from "@/lib/analytics";
import IconButton from "@/components/ui/icon-button";
import { ArrowUpRight, BookOpen, ChartPie, Check, ChevronDown, ChevronRight, CircleHelp, Feather, FileText, Folder, ImageIcon, LayoutTemplate, Lightbulb, Moon, PanelLeft, Plus, Search, Settings2, Sparkles, Star, Sun, Telescope, X, type LucideIcon } from "lucide-react";

const nav: [string, LucideIcon][] = [["首页看板", ChartPie], ["文章库", FileText], ["选题灵感", Lightbulb], ["调研工作台", Telescope], ["图片工作台", ImageIcon], ["素材与知识库", BookOpen], ["模板与风格", LayoutTemplate]];
const actions: [LucideIcon, string, string][] = [[Feather, "开始写作", "把想法写成好文章"], [Lightbulb, "发现选题", "寻找下一个好灵感"], [Telescope, "深度调研", "让观点有据可依"], [ImageIcon, "生成配图", "让内容更有画面"]];
export default function Home() {
  const [dark, setDark] = useState(false), [sidebar, setSidebar] = useState(true);
  const [period, setPeriod] = useState("7"), [search, setSearch] = useState(""), [tab, setTab] = useState("最近编辑");
  const [modal, setModal] = useState<string | null>(null), [draft, setDraft] = useState(""), [saved, setSaved] = useState<Article[]>([]);
  const [notice, setNotice] = useState(""), [favorite, setFavorite] = useState(false);
  useEffect(() => { const id = setTimeout(() => setNotice(""), 3500); return () => clearTimeout(id); }, [notice]);
  useEffect(() => { if (!modal) return; const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(null); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [modal]);
  const [source, setSource] = useState("demo");
  const [now, setNow] = useState(() => new Date(0));
  const example = useMemo(() => demoDataset(now), [now]);
  const dataset = useMemo(() => source === "demo" ? example : { articles: saved, events: [] }, [source, example, saved]);
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
    setNow(new Date()); setSaved(next); setSource("local"); setModal(null); setTab("最近编辑"); setSearch(""); setNotice("草稿已保存在本机，统计已更新");
  };
  return <div className={`workspace ${dark ? "dark" : ""} ${!sidebar ? "hide-sidebar" : ""}`}>
    <aside className="sidebar">
      <button className="workspace-name" onClick={() => setNotice("当前为个人创作空间")}><span className="avatar">M</span><span>墨可的创作空间</span><ChevronDown size={13} /></button>
      <div className="side-section"><div className="side-tabs"><span>收藏</span><span>最近访问</span></div>{["长期主义写作计划", "我的灵感收集箱", ...(favorite ? ["首页看板"] : [])].map(name => <button key={name} className="favorite-link" onClick={() => name === "首页看板" ? window.scrollTo({ top: 0, behavior: "smooth" }) : open(name)}><i />{name}</button>)}</div>
      <div className="nav-heading">创作工作台</div><nav>{nav.map(([name, Icon], index) => <button key={name} className={`nav-item ${index === 0 ? "selected" : ""}`} onClick={() => index === 0 ? window.scrollTo({ top: 0, behavior: "smooth" }) : open(name)}>{index !== 0 && <ChevronRight className="nav-chevron" size={13} />}<Icon size={19} strokeWidth={1.65} /><span>{name}</span>{name === "文章库" && <small>{dataset.articles.length}</small>}</button>)}</nav>
      <div className="nav-heading second-heading">个人空间</div><button className="nav-item" onClick={() => open("我的文件夹")}><ChevronRight className="nav-chevron" size={13} /><Folder size={19} strokeWidth={1.65} />我的文件夹</button><button className="nav-item" onClick={() => open("设置与用量")}><ChevronRight className="nav-chevron" size={13} /><Settings2 size={19} strokeWidth={1.65} />设置与用量</button>
      <div className="sidebar-bottom"><div className="quota"><div><Sparkles size={14} />{source === "demo" ? "当前展示示例数据" : "当前统计本机数据"}</div><small>创作的每一步，都有迹可循。</small></div><a className="brand" href="/"><span className="brand-symbol">✳</span> inko<span className="brand-caption">创作，由此发生</span></a></div>
    </aside>
    <div className="center-column"><header className="topbar"><div className="header-left"><IconButton icon={PanelLeft} label="切换导航栏" onClick={() => setSidebar(!sidebar)} /><IconButton icon={Star} label="收藏看板" active={favorite} onClick={() => { setFavorite(!favorite); setNotice(favorite ? "已取消收藏" : "首页看板已加入收藏"); }} /><span className="breadcrumb">工作台</span><span className="slash">/</span><span>首页看板</span></div><div className="header-right"><div className="global-search"><Search size={15} /><input aria-label="搜索文章" placeholder="搜索内容…" value={search} onChange={e => setSearch(e.target.value)} /><span className="search-hint">搜索</span></div><IconButton icon={dark ? Moon : Sun} label="切换明暗主题" onClick={() => setDark(!dark)} /></div></header>
      <main><div className="page-heading"><h1>创作概览 <span>让好内容持续发生。</span></h1><div className="heading-actions"><Select label="数据来源" value={source} onChange={setSource} options={[{ value: "demo", label: "示例数据" }, { value: "local", label: "我的数据" }]} /><Select label="统计时间范围" value={period} onChange={setPeriod} options={periods} /><button className="primary-button" onClick={() => open("新建文章")}><Plus size={15} />新建创作</button></div></div>
      <p className="data-source-note">{source === "demo" ? "示例数据 · 用于预览统计效果，不代表真实创作记录。" : "我的数据 · 基于本机保存的文章；尚未接入 AI 服务，暂无调用记录。"} 各图表跟随所选时间范围，环比对比前一等长区间。</p>
      <Overview data={dataset} dark={dark} days={Number(period)} now={now} />
      <section className="quick-actions" aria-label="创作快捷入口">{actions.map(([Icon, title, desc]) => <button key={title} onClick={() => open(title)}><span className="quick-icon"><Icon size={20} strokeWidth={1.5} /></span><span><strong>{title}</strong><small>{desc}</small></span><ArrowUpRight size={15} /></button>)}</section>
      <section className="articles-section"><div className="article-heading"><div className="article-tabs">{["最近编辑", "草稿箱"].map(name => <button key={name} className={tab === name ? "chosen" : ""} onClick={() => setTab(name)}>{name}</button>)}</div><button className="text-button" onClick={() => open("文章库")}>全部文章<ArrowUpRight size={14} /></button></div><div className="table-wrap"><table><thead><tr><th>文章标题</th><th>分类</th><th>字数</th><th>状态</th><th>最近编辑</th><th /></tr></thead><tbody>{rows.map((a) => <tr key={a.id} onClick={() => open(a.title)} tabIndex={0} onKeyDown={e => { if (e.key === "Enter") open(a.title); }}><td><FileText size={16} />{a.title}</td><td>{a.category}</td><td>{a.words.toLocaleString()}</td><td><span className={`status ${{"草稿":"gray","撰写中":"purple","待润色":"blue","已完成":"green"}[a.status]}`}><i />{a.status}</span></td><td>{new Date(a.createdAt).toLocaleDateString("zh-CN")}</td><td><ChevronRight size={14} /></td></tr>)}</tbody></table>{rows.length === 0 && <div className="empty">没有找到相关内容，换个关键词试试。</div>}</div></section>
      <footer><span>© 2026 inko · 为创作者而生</span><button onClick={() => open("帮助与反馈")}><CircleHelp size={13} />帮助与反馈</button></footer></main>
    </div>
    {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}
    {modal && <div className="modal-backdrop" onClick={() => setModal(null)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={e => e.stopPropagation()}><div className="card-heading"><h2 id="dialog-title">{modal}</h2><IconButton icon={X} label="关闭" onClick={() => setModal(null)} /></div><p className="modal-description">{["新建文章", "开始写作", "记录灵感"].includes(modal) ? "写下你的想法，开启下一次创作。" : "此模块已纳入平台规划，完整功能将在后续接入。你可以先将想法保存为草稿。"}</p><label htmlFor="draft-title">标题或创作想法</label><textarea id="draft-title" autoFocus placeholder="例如：聊聊 AI 时代，创作者如何保持独立思考…" value={draft} onChange={e => setDraft(e.target.value)} /><div className="modal-footer"><span>保存到本机 · 未接入 AI 服务</span><button className="primary-button" disabled={!draft.trim()} onClick={saveDraft}><Plus size={14} />保存草稿</button></div></section></div>}
  </div>;
}
