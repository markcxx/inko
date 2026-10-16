"use client";

import { useMemo, useRef, useState } from "react";
import { FileImage, FileText, LayoutTemplate, Grid2X2, List, Plus, Search, X, Check, Copy, Eye, Pencil, ClipboardCheck, Send, SendToBack } from "lucide-react";
import Checkbox from "@/components/ui/checkbox";
import Pagination from "@/components/ui/pagination";
import DataTable, { type TableColumn } from "@/components/ui/data-table";
import AnimatedOptions from "@/components/ui/animated-options";
import Select from "@/components/ui/select";
import EmptyState from "@/components/ui/empty-state";
import { editedLabel, libraryArticles, statusColors, type LibraryArticle, type LibraryStatus } from "@/lib/article-library";
import styles from "./article-library.module.css";

const statuses: (LibraryStatus | "全部文章")[] = ["全部文章", "草稿", "创作中", "待审阅", "已完成"];
function Cover({ article }: { article: LibraryArticle }) {
  return article.cover === null ? <div className={styles.placeholder}><FileImage size={34} strokeWidth={1.25} /><span>暂无封面</span></div> : <div className={styles.coverArt} role="img" aria-label={`${article.title}的封面`} style={{ backgroundPosition: `${(article.cover % 3) * 50}% ${Math.floor(article.cover / 3) * 100}%` }} />;
}
function Status({ value }: { value: LibraryStatus }) { return <span className={`status ${statusColors[value]}`}><i />{value}</span>; }
export default function ArticleLibrary({ globalSearch = "" }: { globalSearch?: string }) {
  const [articles, setArticles] = useState(libraryArticles);
  const [view, setView] = useState<"list" | "cards">("list");
  const [filter, setFilter] = useState("全部文章"), [query, setQuery] = useState(""), [topic, setTopic] = useState("all"), [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(8);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<LibraryArticle | null>(null);
  const [title, setTitle] = useState("");
  const [editing, setEditing] = useState<LibraryArticle | null>(null);
  const [editText, setEditText] = useState("");
  const [workflow, setWorkflow] = useState<{ article: LibraryArticle; action: "审核" | "发布" } | null>(null);
  const [published, setPublished] = useState<Set<string>>(new Set());
  const editDialog = useRef<HTMLDialogElement>(null), workflowDialog = useRef<HTMLDialogElement>(null);
  const dialog = useRef<HTMLDialogElement>(null), createDialog = useRef<HTMLDialogElement>(null);
  const topics = [...new Set(articles.map(a => a.topic))];
  const filtered = useMemo(() => articles.filter(a => (filter === "全部文章" || a.status === filter) && (topic === "all" || a.topic === topic) && a.title.toLowerCase().includes(query.trim().toLowerCase()) && a.title.toLowerCase().includes(globalSearch.trim().toLowerCase())).sort((a, b) => sort === "words" ? b.words - a.words : sort === "title" ? a.title.localeCompare(b.title, "zh-CN") : sort === "oldest" ? a.updatedAt.localeCompare(b.updatedAt) : b.updatedAt.localeCompare(a.updatedAt)), [articles, filter, topic, query, globalSearch, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize)), currentPage = Math.min(page, pages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const toggle = (id: string) => setSelected(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const show = (a: LibraryArticle) => { setPreview(a); dialog.current?.showModal(); };
  const duplicate = (a: LibraryArticle) => setArticles(previous => [{ ...a, id: crypto.randomUUID(), title: `${a.title}（副本）`, status: "草稿", updatedAt: new Date().toISOString() }, ...previous]);
  const exportArticles = (items: LibraryArticle[]) => {
    const blob = new Blob([items.map(a => `# ${a.title}\n\n${a.excerpt}\n`).join("\n---\n\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = items.length === 1 ? `${items[0].title}.md` : "文章摘要.md"; link.click(); URL.revokeObjectURL(url);
  };
  const edit = (article: LibraryArticle) => { setEditing(article); setTitle(article.title); setEditText(article.excerpt); editDialog.current?.showModal(); };
  const changeStatus = (article: LibraryArticle, status: LibraryStatus) => setArticles(previous => previous.map(a => a.id === article.id ? { ...a, status } : a));
  const actions = (article: LibraryArticle) => <div className={styles.rowActions}>
    <button aria-label={`预览：${article.title}`} data-tooltip="预览" onClick={() => show(article)}><Eye size={16} /><span className={styles.actionLabel}>预览</span></button>
    <button aria-label={`修改：${article.title}`} data-tooltip="修改" onClick={() => edit(article)}><Pencil size={15} /><span className={styles.actionLabel}>继续修改</span></button>
    <button aria-label={`复制：${article.title}`} data-tooltip="复制" onClick={() => duplicate(article)}><Copy size={15} /></button>
    {article.status === "草稿" || article.status === "创作中" ? <button className={styles.workflowAction} aria-label={`提交审核：${article.title}`} data-tooltip="提交审核" onClick={() => changeStatus(article, "待审阅")}><SendToBack size={16} /></button> : <button className={styles.workflowAction} aria-label={`${article.status === "待审阅" ? "审核" : "发布"}：${article.title}`} data-tooltip={published.has(article.id) ? "已发布" : article.status === "待审阅" ? "审核" : "发布"} disabled={published.has(article.id)} onClick={() => { setWorkflow({ article, action: article.status === "待审阅" ? "审核" : "发布" }); workflowDialog.current?.showModal(); }}>{article.status === "待审阅" ? <ClipboardCheck size={16} /> : published.has(article.id) ? <Check size={16} /> : <Send size={16} />}</button>}
  </div>;
  const tableColumns: TableColumn<LibraryArticle>[] = [
    { key: "title", heading: "文章标题", className: styles.titleCell, render: a => <button className={styles.articleTitle} onClick={() => show(a)}><span className={styles.tableCover}><Cover article={a} /></span><span className={styles.titleCopy}><strong>{a.title}</strong><small>{a.excerpt}</small></span></button> },
    { key: "topic", heading: "主题", className: styles.topicCell, render: a => <span className={styles.muted}>{a.topic}</span> },
    { key: "words", heading: "字数", className: styles.number, render: a => a.words ? a.words.toLocaleString() : "—" },
    { key: "layout", heading: "排版", className: styles.layoutCell, render: a => <span className={styles.layoutName}>{a.layout || "未设置"}</span> },
    { key: "status", heading: "状态", className: styles.statusCell, render: a => <Status value={a.status} /> },
    { key: "date", heading: "最近编辑", className: styles.dateCell, render: a => <span className={styles.muted}>{editedLabel(a.updatedAt)}</span> },
    { key: "actions", heading: "操作", className: styles.actionsCell, render: actions },
  ];
  return <main className={styles.library}>
    <div className={styles.heading}><div><h1>文章库</h1><p>从一个想法，到一篇好文章。</p></div><button className="primary-button" onClick={() => { setTitle(""); createDialog.current?.showModal(); }}><Plus size={17} />开始创作</button></div>
    <div className={styles.tabRow}><div className={styles.tabScroll}><AnimatedOptions value={filter} onChange={value => { setFilter(value); setPage(1); }} label="文章状态" options={statuses.map((value, i) => ({ value, label: value, count: value === "全部文章" ? articles.length : articles.filter(a => a.status === value).length, color: ["#6c78b8", "#8a7d69", "#9375c2", "#4c91bd", "#539b83"][i] }))} /></div><span className={styles.total}>共 {filtered.length} 篇文章</span></div>
    <div className={styles.toolbar}><label className={styles.search}><Search size={17} /><input aria-label="搜索文章标题" placeholder="搜索文章标题…" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />{query && <button aria-label="清空标题搜索" onClick={() => setQuery("")}><X size={14} /></button>}</label><Select label="文章主题" value={topic} onChange={value => { setTopic(value); setPage(1); }} options={[{ value: "all", label: "全部主题" }, ...topics.map(value => ({ value, label: value }))]} /><Select label="文章排序" value={sort} onChange={value => { setSort(value); setPage(1); }} options={[{ value: "recent", label: "最近编辑 ↓" }, { value: "oldest", label: "最早编辑 ↑" }, { value: "words", label: "字数最多 ↓" }, { value: "title", label: "标题排序" }]} /><div className={styles.viewSwitch}><AnimatedOptions variant="segment" value={view} onChange={mode => { setView(mode as "list" | "cards"); setPageSize(mode === "cards" ? 6 : 8); setPage(1); }} label="显示方式" options={[{ value: "list", label: <><List size={17} />列表</> }, { value: "cards", label: <><Grid2X2 size={16} />卡片</> }]} /></div></div>
    {selected.size > 0 && <div className={styles.selection}><span><Check size={15} />已选择 {selected.size} 篇</span><button onClick={() => exportArticles(articles.filter(a => selected.has(a.id)))}>导出摘要</button><button onClick={() => setSelected(new Set())}>取消选择</button></div>}
    {rows.length === 0 ? <EmptyState icon={Search} title="没有找到相关文章" description="试试其他关键词，或调整筛选条件。" action={<button className="empty-state-button" onClick={() => { setQuery(""); setTopic("all"); setFilter("全部文章"); }}>重置筛选</button>} /> : view === "list" ? <DataTable rows={rows} columns={tableColumns} selected={selected} onSelectionChange={setSelected} className={styles.table} /> : <div className={styles.grid}>{rows.map(a => <article key={a.id} className={`${styles.card} ${selected.has(a.id) ? styles.selectedCard : ""}`}><div className={styles.cover}><button className={styles.coverLink} aria-label={`查看文章：${a.title}`} onClick={() => show(a)}><Cover article={a} /></button><Checkbox className={styles.cardCheckbox} aria-label={`选择：${a.title}`} checked={selected.has(a.id)} onChange={() => toggle(a.id)} /><div className={styles.cardStatus}><Status value={a.status} /></div></div><div className={styles.cardBody}><div className={styles.cardEyebrow}><span className={styles.topic}>{a.topic}</span><span><FileText size={13} />{a.words ? `${a.words.toLocaleString()} 字` : "尚未撰写"}</span></div><button className={styles.cardTitle} onClick={() => show(a)}>{a.title}</button><p>{a.excerpt}</p><div className={styles.cardFooter}><span><LayoutTemplate size={13} />{a.layout || "未设置排版"}</span><time dateTime={a.updatedAt}>{editedLabel(a.updatedAt)}</time></div></div><div className={styles.cardActions}>{actions(a)}</div></article>)}</div>}
    <Pagination total={filtered.length} page={currentPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1); }} />
    <dialog ref={dialog} className={styles.dialog} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}><div className={styles.dialogHead}><h2>文章预览</h2><button aria-label="关闭文章预览" onClick={() => dialog.current?.close()}><X size={20} /></button></div>{preview && <><div className={styles.previewCover}><Cover article={preview} /></div><h3>{preview.title}</h3><div className={styles.previewMeta}><span>{preview.topic}</span><Status value={preview.status} /><span>{editedLabel(preview.updatedAt)}</span></div><p>{preview.excerpt}</p></>}</dialog>
    <dialog ref={editDialog} className={styles.dialog} onClick={e => { if (e.target === e.currentTarget) editDialog.current?.close(); }}><form onSubmit={e => { e.preventDefault(); if (!editing || !title.trim()) return; setArticles(previous => previous.map(a => a.id === editing.id ? { ...a, title: title.trim(), excerpt: editText, updatedAt: new Date().toISOString() } : a)); editDialog.current?.close(); }}><div className={styles.dialogHead}><h2>修改文章</h2><button type="button" aria-label="关闭修改" onClick={() => editDialog.current?.close()}><X size={20} /></button></div><label className={styles.newTitle}>文章标题<input value={title} onChange={e => setTitle(e.target.value)} required /></label><label className={styles.newTitle}>文章摘要<textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4} /></label><div className={styles.dialogActions}><button className="primary-button" disabled={!title.trim()}>保存修改</button></div></form></dialog>
    <dialog ref={workflowDialog} className={styles.dialog} onClick={e => { if (e.target === e.currentTarget) workflowDialog.current?.close(); }}><div className={styles.dialogHead}><h2>{workflow?.action === "审核" ? "审核文章" : "发布预览"}</h2><button aria-label="关闭流程预览" onClick={() => workflowDialog.current?.close()}><X size={20} /></button></div>{workflow && <><h3>{workflow.article.title}</h3><p>{workflow.article.excerpt}</p><div className={styles.workflowNote}>{workflow.action === "审核" ? "确认文章内容后，可以将它标记为已完成。" : "当前为发布流程预览，确认后展示发布完成状态，不会发送到公众号。"}</div><div className={styles.dialogActions}><button className="primary-button" onClick={() => { if (workflow.action === "审核") changeStatus(workflow.article, "已完成"); else setPublished(previous => new Set([...previous, workflow.article.id])); workflowDialog.current?.close(); }}>{workflow.action === "审核" ? "审核通过" : "预览发布完成"}</button></div></>}</dialog>
    <dialog ref={createDialog} className={styles.dialog} onClick={e => { if (e.target === e.currentTarget) createDialog.current?.close(); }}><form onSubmit={e => { e.preventDefault(); if (!title.trim()) return; setArticles(previous => [{ id: crypto.randomUUID(), title: title.trim(), topic: "未分类", words: 0, status: "草稿", cover: null, excerpt: "记录一点灵感，开启新的创作。", updatedAt: new Date().toISOString() }, ...previous]); setFilter("全部文章"); setTopic("all"); setQuery(""); setSort("recent"); setPage(1); createDialog.current?.close(); }}><div className={styles.dialogHead}><h2>开始创作</h2><button type="button" aria-label="关闭新建文章" onClick={() => createDialog.current?.close()}><X size={20} /></button></div><p>写下题目或一个想法，先为它留一张白纸。</p><label className={styles.newTitle}>文章标题<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="你今天想写些什么？" required /></label><div className={styles.dialogActions}><button className="primary-button" disabled={!title.trim()} type="submit"><Plus size={15} />创建草稿</button></div></form></dialog>
  </main>;
}
