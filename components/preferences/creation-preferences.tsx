"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type FormEvent } from "react";
import { Check, Copy, FileText, GripVertical, ImageIcon, MoreHorizontal, Pencil, Plus, Settings2, ShieldCheck, Trash2, Users, X } from "lucide-react";
import Select from "@/components/ui/select";
import Checkbox from "@/components/ui/checkbox";
import { emptyValues, initialSchemes, movePrompt, type Scheme, type Prompt, type PreferenceValues } from "./preference-model";
import styles from "./creation-preferences.module.css";

const sections = [
  { id: "audience", label: "账号与读者", icon: Users },
  { id: "writing", label: "写作习惯", icon: Pencil },
  { id: "boundaries", label: "表达约束", icon: ShieldCheck },
  { id: "research", label: "调研与引用", icon: FileText },
  { id: "visuals", label: "配图与排版", icon: ImageIcon },
  { id: "prompts", label: "自定义提示词", icon: Settings2 },
] as const;
type SectionId = typeof sections[number]["id"];
type Modal = { type: "create-scheme" | "copy-scheme" | "rename-scheme" | "delete-scheme" | "add-column" | "create-prompt" | "edit-prompt" | "delete-prompt" | "deleted-prompts"; promptId?: string };
const promptScopes = ["选题", "标题", "调研", "撰写", "润色", "核查", "配图", "排版"];
function PreferenceSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <Select label={label} value={value} onChange={onChange} options={options.map(option => ({ value: option, label: option }))} />;
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <div className={`${styles.field} ${className}`}><span className={styles.fieldLabel}>{label}</span>{children}</div>;
}

function Section({ id, number, description, children, action }: { id: SectionId; number: number; description: string; children: ReactNode; action?: ReactNode }) {
  const section = sections.find(section => section.id === id)!;
  return <section id={`preferences-${id}`} aria-labelledby={`preferences-${id}-heading`} className={styles.section}>
    <div className={styles.sectionHeading}><div><h2 id={`preferences-${id}-heading`}>{number}. {section.label}</h2><p>{description}</p></div>{action}</div>
    {children}
  </section>;
}

export default function CreationPreferences() {
  const [active, setActive] = useState<SectionId>("audience");
  const [schemes, setSchemes] = useState<Scheme[]>(initialSchemes), [savedSchemes, setSavedSchemes] = useState<Scheme[]>(initialSchemes);
  const [schemeId, setSchemeId] = useState("routine"), [defaultId, setDefaultId] = useState("routine"), [savedDefaultId, setSavedDefaultId] = useState("routine");
  const scheme = schemes.find(item => item.id === schemeId) || schemes[0];
  const values = scheme.values;
  const dirty = JSON.stringify(schemes) !== JSON.stringify(savedSchemes) || defaultId !== savedDefaultId;
  const [modal, setModal] = useState<Modal | null>(null), [notice, setNotice] = useState("");
  const [name, setName] = useState(""), [copyCurrent, setCopyCurrent] = useState(false), [validation, setValidation] = useState("");
  const [promptDraft, setPromptDraft] = useState<Prompt>({ id: "", title: "", scopes: ["撰写"], content: "", enabled: true });
  const [dragging, setDragging] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null), menu = useRef<HTMLDetailsElement>(null);
  const patch = (change: Partial<Scheme>) => { setSchemes(previous => previous.map(item => item.id === scheme.id ? { ...item, ...change } : item)); };
  const patchValue = (key: keyof PreferenceValues, value: string) => patch({ values: { ...values, [key]: value } });
  const textInput = (key: keyof PreferenceValues, label: string) => <input aria-label={label} value={values[key]} onChange={event => patchValue(key, event.target.value)} />;
  const textArea = (key: keyof PreferenceValues, label: string, rows: number) => <textarea aria-label={label} rows={rows} value={values[key]} onChange={event => patchValue(key, event.target.value)} />;
  const select = (key: keyof PreferenceValues, label: string, options: string[]) => <PreferenceSelect label={label} value={values[key]} options={options} onChange={value => patchValue(key, value)} />;
  const open = (next: Modal) => {
    if (menu.current) menu.current.open = false;
    setValidation(""); setCopyCurrent(false);
    setName(next.type === "rename-scheme" ? scheme.name : next.type === "copy-scheme" ? `${scheme.name}（副本）` : "");
    setPromptDraft(next.type === "edit-prompt" ? { ...scheme.prompts.find(prompt => prompt.id === next.promptId)! } : { id: "", title: "", scopes: ["撰写"], content: "", enabled: true });
    setModal(next);
  };
  const close = () => { dialog.current?.close(); setModal(null); };
  useEffect(() => { if (modal) { if (!dialog.current?.open) dialog.current?.showModal(); (dialog.current?.querySelector<HTMLInputElement>("input:not([type=checkbox]), textarea") || dialog.current?.querySelector<HTMLButtonElement>("button"))?.focus(); } else dialog.current?.close(); }, [modal]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(""), 3200); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => { const outside = (event: PointerEvent) => { if (!menu.current?.contains(event.target as Node) && menu.current) menu.current.open = false; }; document.addEventListener("pointerdown", outside); return () => document.removeEventListener("pointerdown", outside); }, []);
  const duplicatePrompt = (prompt: Prompt) => { patch({ prompts: [...scheme.prompts, { ...prompt, id: crypto.randomUUID(), title: `${prompt.title}（副本）`, scopes: [...prompt.scopes] }] }); setNotice("已复制提示词"); };
  const reorder = (sourceId: string, targetId: string) => patch({ prompts: movePrompt(scheme.prompts, sourceId, targetId) });
  const submitModal = (event: FormEvent) => {
    event.preventDefault(); if (!modal) return;
    const cleanName = name.trim();
    if (["create-scheme", "copy-scheme", "rename-scheme"].includes(modal.type)) {
      if (!cleanName) { setValidation("请填写方案名称。"); return; }
      if (schemes.some(item => item.name === cleanName && (modal.type !== "rename-scheme" || item.id !== scheme.id))) { setValidation("已有同名方案，请换一个名称。"); return; }
      if (modal.type === "rename-scheme") patch({ name: cleanName });
      else {
        const id = crypto.randomUUID(), shouldCopy = modal.type === "copy-scheme" || copyCurrent;
        const next: Scheme = shouldCopy ? { ...structuredClone(scheme), id, name: cleanName, prompts: scheme.prompts.map(prompt => ({ ...prompt, id: crypto.randomUUID() })), deletedPrompts: [] } : { id, name: cleanName, values: { ...emptyValues }, columns: [], prompts: [], deletedPrompts: [] };
        setSchemes(previous => [...previous, next]); setSchemeId(id);
      }
      setNotice(modal.type === "rename-scheme" ? "方案名称已更新" : "已创建偏好方案");
    } else if (modal.type === "add-column") {
      if (!cleanName) { setValidation("请填写栏目名称。"); return; }
      if (scheme.columns.includes(cleanName)) { setValidation("已有同名栏目。"); return; }
      patch({ columns: [...scheme.columns, cleanName] });
    } else if (modal.type === "create-prompt" || modal.type === "edit-prompt") {
      if (!promptDraft.title.trim() || !promptDraft.content.trim()) { setValidation("请填写提示词名称和内容。"); return; }
      if (!promptDraft.scopes.length) { setValidation("请至少选择一个适用环节。"); return; }
      const prompt = { ...promptDraft, id: promptDraft.id || crypto.randomUUID(), title: promptDraft.title.trim(), content: promptDraft.content.trim() };
      patch({ prompts: modal.type === "edit-prompt" ? scheme.prompts.map(item => item.id === prompt.id ? prompt : item) : [...scheme.prompts, prompt] });
      setNotice(modal.type === "edit-prompt" ? "提示词已更新" : "已添加提示词");
    } else if (modal.type === "delete-prompt") {
      const prompt = scheme.prompts.find(item => item.id === modal.promptId);
      if (prompt) patch({ prompts: scheme.prompts.filter(item => item.id !== prompt.id), deletedPrompts: [prompt, ...scheme.deletedPrompts] });
      setNotice("提示词已移至已删除列表，可随时恢复");
    } else if (modal.type === "delete-scheme") {
      if (schemes.length === 1) { setValidation("至少保留一个方案，请先新建其他方案。"); return; }
      const next = schemes.filter(item => item.id !== scheme.id); setSchemes(next); setSchemeId(next[0].id); if (defaultId === scheme.id) setDefaultId(next[0].id); setNotice("方案已删除，保存前可通过撤销修改恢复");
    }
    close();
  };
  const toolbar = useRef<HTMLDivElement>(null), navigation = useRef<HTMLElement>(null);
  const [toolbarHeight, setToolbarHeight] = useState(78);

  useEffect(() => {
    const element = toolbar.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setToolbarHeight(element.getBoundingClientRect().height));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const offset = toolbarHeight + (window.innerWidth <= 760 ? (navigation.current?.offsetHeight || 0) : 0) + 32;
      let next: SectionId = "audience";
      for (const section of sections) {
        const element = document.getElementById(`preferences-${section.id}`);
        if (element && element.getBoundingClientRect().top <= offset) next = section.id;
      }
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) next = "prompts";
      setActive(next);
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [toolbarHeight]);

  return <main className={styles.page} style={{ "--preferences-toolbar-height": `${toolbarHeight}px` } as CSSProperties}>
    <div className={styles.heading}><h1>创作偏好</h1><p>为每次创作，保留你的表达习惯。</p></div>
    <div ref={toolbar} className={styles.toolbar}>
      <div className={styles.scheme}><span>偏好方案</span><Select label="偏好方案" value={scheme.id} options={schemes.map(item => ({ value: item.id, label: item.name }))} onChange={setSchemeId} />{defaultId === scheme.id && <span className={styles.defaultBadge}>默认</span>}<button type="button" className={styles.outlineButton} onClick={() => open({ type: "create-scheme" })}><Plus size={15} strokeWidth={1.6} />新建方案</button><details ref={menu} className={styles.schemeMenu} onKeyDown={event => { if (event.key === "Escape" && menu.current) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } }}><summary className={styles.moreButton} aria-label="管理偏好方案"><MoreHorizontal size={17} /></summary><div className={styles.menuPanel}><button onClick={() => open({ type: "rename-scheme" })}><Pencil size={14} />重命名方案</button><button onClick={() => open({ type: "copy-scheme" })}><Copy size={14} />复制方案</button><button onClick={() => { setDefaultId(scheme.id); setNotice(defaultId === scheme.id ? "当前已是默认方案" : "已设为默认方案"); if (menu.current) menu.current.open = false; }}><Check size={14} />设为默认方案</button><button className={styles.dangerText} onClick={() => open({ type: "delete-scheme" })}><Trash2 size={14} />删除方案</button></div></details></div>
      <div className={styles.saveActions}><span className={styles.saveStatus} role="status">{dirty ? "有未保存的修改" : "当前方案已就绪"}</span><button type="button" className={styles.outlineButton} onClick={() => { setSchemes(structuredClone(savedSchemes)); setDefaultId(savedDefaultId); if (!savedSchemes.some(item => item.id === schemeId)) setSchemeId(savedSchemes[0].id); setNotice(dirty ? "已撤销未保存的修改" : "没有需要撤销的修改"); }}>撤销修改</button><button type="button" className="primary-button" onClick={() => { setSavedSchemes(structuredClone(schemes)); setSavedDefaultId(defaultId); setNotice("修改已保留在本次预览中，刷新后重置"); }}><Check size={15} />保存修改</button></div>
    </div>
    <div className={styles.layout}>
      <nav ref={navigation} className={styles.contents} aria-label="创作偏好页内导航"><span className={styles.contentsLabel}>本页内容</span><div className={styles.contentsLinks}>{sections.map(({ id, label, icon: Icon }) => <a key={id} href={`#preferences-${id}`} aria-current={active === id ? "location" : undefined} onClick={event => {
        event.preventDefault();
        const element = document.getElementById(`preferences-${id}`);
        if (!element) return;
        setActive(id);
        element.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      }}><Icon size={18} strokeWidth={1.65} /><span>{label}</span></a>)}</div><p className={styles.contentsHint}>点击目录，快速定位设置</p></nav>
      <div className={styles.form}>
        <Section id="audience" number={1} description="明确你在为谁写，和希望持续关注的内容。">
          <div className={styles.twoColumns}><Field label="公众号名称">{textInput("account", "公众号名称")}</Field><Field label="目标读者">{textInput("audience", "目标读者")}</Field></div>
          <Field label="内容方向">{textInput("themes", "内容方向")}</Field>
          <Field label="长期栏目"><div className={styles.columns}>{scheme.columns.map(column => <span key={column}>{column}<button type="button" aria-label={`移除栏目${column}`} onClick={() => patch({ columns: scheme.columns.filter(item => item !== column) })}><X size={12} /></button></span>)}<button type="button" className={styles.outlineButton} onClick={() => open({ type: "add-column" })}><Plus size={14} />添加</button></div></Field>
        </Section>
        <Section id="writing" number={2} description="保留熟悉的表达方式，也给每篇文章留下变化。">
          <Field label="写作语气"><div className={styles.tones} role="group" aria-label="写作语气">{["自然真诚", "理性客观", "温暖细腻", "轻松幽默", "鲜明犀利"].map(value => <button type="button" key={value} aria-pressed={values.tone === value} onClick={() => patchValue("tone", value)}>{value}</button>)}</div></Field>
          <div className={styles.twoColumns}><Field label="叙述视角">{select("perspective", "叙述视角", ["第一人称", "第三人称", "根据内容决定"])}</Field><Field label="默认篇幅">{select("length", "默认篇幅", ["800–1500 字", "1500–2500 字", "2500–4000 字", "根据内容决定"])}</Field></div>
          <Field label="开头、结尾与标题偏好">{textArea("structure", "开头、结尾与标题偏好", 3)}</Field>
        </Section>
        <Section id="boundaries" number={3} description="把需要坚持的边界，写得具体一点。">
          <div className={styles.twoColumns}><Field label="避免的表达">{textArea("avoid", "避免的表达", 3)}</Field><Field label="事实与经历约束">{textArea("facts", "事实与经历约束", 3)}</Field></div>
        </Section>
        <Section id="research" number={4} description="让观点有出处，让不确定的信息被看见。">
          <div className={styles.twoColumns}><Field label="来源偏好">{select("sources", "来源偏好", ["优先原始资料", "优先官方与专业机构", "结合多种可靠来源"])}</Field><Field label="信息时效">{select("recency", "信息时效", ["根据话题判断", "优先近一年", "优先近三个月"])}</Field></div>
          <Field label="引用与核查要求">{textArea("citations", "引用与核查要求", 2)}</Field>
        </Section>
        <Section id="visuals" number={5} description="让图片和版式，配合内容的阅读节奏。">
          <div className={styles.threeColumns}><Field label="配图方式">{select("images", "配图方式", ["根据内容需要", "每节一张", "暂不配图"])}</Field><Field label="图片风格">{select("imageStyle", "图片风格", ["简洁自然", "真实摄影", "手绘插画"])}</Field><Field label="默认排版">{select("layout", "默认排版", ["简约留白", "阅读手记", "自然叙事"])}</Field></div>
          <p className={styles.helper}>单篇文章可进一步调整配图与排版要求。</p>
        </Section>
        <Section id="prompts" number={6} description="补充更具体的规则，并独立选择是否启用。" action={<button type="button" className={styles.outlineButton} onClick={() => open({ type: "create-prompt" })}><Plus size={14} />新建提示词</button>}>
          <div className={styles.promptList}>{scheme.prompts.length ? scheme.prompts.map((prompt, index) => <div key={prompt.id} className={`${styles.promptRow} ${dragging === prompt.id ? styles.draggingPrompt : ""}`} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={event => { event.preventDefault(); reorder(event.dataTransfer.getData("text/plain"), prompt.id); setDragging(null); }}>
            <button type="button" className={styles.dragHandle} draggable aria-label={`调整${prompt.title}顺序`} data-tooltip="拖动排序，或按上下方向键调整" onDragStart={event => { event.dataTransfer.setData("text/plain", prompt.id); event.dataTransfer.effectAllowed = "move"; setDragging(prompt.id); }} onDragEnd={() => setDragging(null)} onKeyDown={event => { if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return; event.preventDefault(); const target = scheme.prompts[index + (event.key === "ArrowUp" ? -1 : 1)]; if (target) reorder(prompt.id, target.id); }}><GripVertical size={16} strokeWidth={1.6} /></button>
            <div className={styles.promptCopy}><div className={styles.promptTitle}><strong>{prompt.title}</strong><div className={styles.scopes}>{prompt.scopes.map(scope => <span key={scope}>{scope}</span>)}</div></div><p>{prompt.content}</p></div>
            <div className={styles.promptActions}><button type="button" aria-label={`编辑${prompt.title}`} onClick={() => open({ type: "edit-prompt", promptId: prompt.id })}><Pencil size={14} strokeWidth={1.6} /><span>编辑</span></button><button type="button" aria-label={`复制${prompt.title}`} data-tooltip="复制提示词" onClick={() => duplicatePrompt(prompt)}><Copy size={15} strokeWidth={1.6} /></button><label className={styles.switch}><input type="checkbox" role="switch" aria-label={`启用${prompt.title}`} checked={prompt.enabled} onChange={event => patch({ prompts: scheme.prompts.map(item => item.id === prompt.id ? { ...item, enabled: event.target.checked } : item) })} /><span /></label></div>
          </div>) : <div className={styles.emptyPrompts}><FileText size={24} strokeWidth={1.4} /><p>还没有自定义提示词</p><button type="button" className={styles.outlineButton} onClick={() => open({ type: "create-prompt" })}><Plus size={14} />新建提示词</button></div>}</div>
          <div className={styles.promptFooter}><button type="button" onClick={() => open({ type: "deleted-prompts" })}><Trash2 size={13} />已删除的提示词{scheme.deletedPrompts.length > 0 && `（${scheme.deletedPrompts.length}）`}</button><p>新建文章时可查看并调整实际使用的提示词。</p></div>
        </Section>
        <p className={styles.pageNote}>修改仅影响之后新建的文章。</p>
      </div>
    </div>
    {notice && <div className="toast" role="status"><Check size={15} />{notice}</div>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="preference-dialog-title" onClose={() => setModal(null)} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      {modal && <><div className={styles.dialogHeading}><h2 id="preference-dialog-title">{{ "create-scheme": "新建偏好方案", "copy-scheme": "复制偏好方案", "rename-scheme": "重命名方案", "delete-scheme": "删除偏好方案", "add-column": "添加长期栏目", "create-prompt": "新建提示词", "edit-prompt": "编辑提示词", "delete-prompt": "删除提示词", "deleted-prompts": "已删除的提示词" }[modal.type]}</h2><button type="button" aria-label="关闭弹窗" onClick={close}><X size={19} /></button></div>
        {modal.type === "deleted-prompts" ? <><p className={styles.dialogDescription}>恢复后的提示词会回到当前方案，原有内容与启用状态保持不变。</p>{scheme.deletedPrompts.length ? <div className={styles.deletedList}>{scheme.deletedPrompts.map(prompt => <div key={prompt.id}><div><strong>{prompt.title}</strong><p>{prompt.content}</p></div><button type="button" className={styles.outlineButton} onClick={() => { patch({ prompts: [...scheme.prompts, prompt], deletedPrompts: scheme.deletedPrompts.filter(item => item.id !== prompt.id) }); setNotice("提示词已恢复"); }}>恢复</button></div>)}</div> : <div className={styles.emptyPrompts}><Trash2 size={26} strokeWidth={1.4} /><p>没有已删除的提示词</p></div>}<div className={styles.dialogActions}><button type="button" className="primary-button" onClick={close}>完成</button></div></> : <form onSubmit={submitModal}>
          {["create-scheme", "copy-scheme", "rename-scheme", "add-column"].includes(modal.type) && <><p className={styles.dialogDescription}>{modal.type === "add-column" ? "给长期关注的内容留一个固定栏目。" : modal.type === "copy-scheme" ? "复制当前方案的全部偏好与提示词，作为新的起点。" : modal.type === "rename-scheme" ? "使用容易辨认的名称，方便在创作时选择。" : "为不同的写作场景保存一组独立偏好。"}</p><label className={styles.field}><span className={styles.fieldLabel}>{modal.type === "add-column" ? "栏目名称" : "方案名称"}</span><input autoFocus aria-label={modal.type === "add-column" ? "栏目名称" : "方案名称"} value={name} onChange={event => { setName(event.target.value); setValidation(""); }} maxLength={40} required placeholder={modal.type === "add-column" ? "例如：每周观察" : "例如：阅读随笔"} /></label>{modal.type === "create-scheme" && <label className={styles.checkboxLabel}><Checkbox className={styles.dialogCheckbox} checked={copyCurrent} onChange={event => setCopyCurrent(event.target.checked)} />基于当前方案「{scheme.name}」创建</label>}</>}
          {(modal.type === "create-prompt" || modal.type === "edit-prompt") && <><p className={styles.dialogDescription}>写下具体的要求，并选择它适用的创作环节。</p><label className={styles.field}><span className={styles.fieldLabel}>提示词名称</span><input autoFocus aria-label="提示词名称" value={promptDraft.title} onChange={event => setPromptDraft({ ...promptDraft, title: event.target.value })} maxLength={60} required placeholder="例如：科技观察写作规则" /></label><Field label="适用环节"><div className={styles.scopeChoices}>{promptScopes.map(scope => <label key={scope}><Checkbox className={styles.dialogCheckbox} checked={promptDraft.scopes.includes(scope)} onChange={event => setPromptDraft({ ...promptDraft, scopes: event.target.checked ? [...promptDraft.scopes, scope] : promptDraft.scopes.filter(item => item !== scope) })} />{scope}</label>)}</div></Field><label className={styles.field}><span className={styles.fieldLabel}>提示词内容</span><textarea aria-label="提示词内容" rows={6} required value={promptDraft.content} onChange={event => setPromptDraft({ ...promptDraft, content: event.target.value })} placeholder="描述希望遵循的规则、表达方式和需要避免的问题…" /></label><label className={styles.checkboxLabel}><Checkbox className={styles.dialogCheckbox} checked={promptDraft.enabled} onChange={event => setPromptDraft({ ...promptDraft, enabled: event.target.checked })} />在当前方案中启用</label></>}
          {modal.type === "delete-scheme" && <p className={styles.dialogDescription}>确定删除「{scheme.name}」及其中的偏好和提示词吗？保存前，可以通过顶部的撤销修改恢复。{schemes.length === 1 && "至少需要保留一个偏好方案。"}</p>}
          {modal.type === "delete-prompt" && <p className={styles.dialogDescription}>将「{scheme.prompts.find(prompt => prompt.id === modal.promptId)?.title}」移至已删除列表？之后可以随时恢复。</p>}
          {validation && <p className={styles.validation} role="alert">{validation}</p>}
          <div className={styles.dialogActions}>{modal.type === "edit-prompt" && <button type="button" className={styles.deletePrompt} onClick={() => setModal({ type: "delete-prompt", promptId: modal.promptId })}><Trash2 size={14} />删除提示词</button>}<button type="button" className={styles.outlineButton} onClick={close}>取消</button><button type="submit" className={`primary-button ${modal.type.startsWith("delete-") ? styles.dangerButton : ""}`}>{modal.type.startsWith("delete-") ? "确认删除" : modal.type === "rename-scheme" || modal.type === "edit-prompt" ? "保存修改" : modal.type === "add-column" ? "添加栏目" : modal.type === "copy-scheme" ? "创建副本" : "创建"}</button></div>
        </form>}
      </>}
    </dialog>
  </main>;
}
