export type PreferenceValues = {
  account: string; audience: string; themes: string; tone: string; perspective: string;
  length: string; structure: string; avoid: string; facts: string; sources: string;
  recency: string; citations: string; images: string; imageStyle: string; layout: string;
};
export type Prompt = { id: string; title: string; scopes: string[]; content: string; enabled: boolean };
export type Scheme = { id: string; name: string; values: PreferenceValues; columns: string[]; prompts: Prompt[]; deletedPrompts: Prompt[] };
export const emptyValues: PreferenceValues = {
  account: "", audience: "", themes: "", tone: "自然真诚", perspective: "第一人称", length: "1500–2500 字", structure: "", avoid: "", facts: "", sources: "优先原始资料", recency: "根据话题判断", citations: "", images: "根据内容需要", imageStyle: "简洁自然", layout: "简约留白",
};
const routine: Scheme = {
  id: "routine", name: "日常观察",
  values: { ...emptyValues, account: "慢慢观察", audience: "关注科技与生活的年轻创作者", themes: "科技观察、个人成长与日常思考", structure: "从具体观察切入，标题清楚直接，结尾留一个值得思考的问题。", avoid: "避免夸张宣传、空泛口号和生硬的转折句。", facts: "不编造作者经历、数据与引语；未经确认的事实须明确标注。", citations: "注明来源与时间；区分事实和观点，保留不同证据与不确定性。" },
  columns: ["每周观察", "阅读手记", "工具体验"],
  prompts: [
    { id: "tech-rule", title: "科技观察写作规则", scopes: ["撰写", "润色"], content: "先说明现象，再提供证据，最后给出有边界的判断。", enabled: true },
    { id: "title-rule", title: "标题生成习惯", scopes: ["选题", "标题"], content: "表达具体，不夸大收益，不用情绪化悬念。", enabled: false },
  ], deletedPrompts: [],
};
export const initialSchemes: Scheme[] = [routine, {
  ...routine, id: "analysis", name: "深度分析", values: { ...routine.values, tone: "理性客观", perspective: "第三人称", length: "2500–4000 字", recency: "优先近三个月", structure: "从问题切入，梳理论据与不同解释，最后讨论结论的适用边界。" }, columns: ["专题分析", "行业观察"],
  prompts: [{ id: "analysis-rule", title: "深度分析与核查要求", scopes: ["调研", "撰写", "核查"], content: "优先追溯原始来源，交叉验证关键结论。明确区分事实、推断和仍待确认的信息。", enabled: true }], deletedPrompts: [],
}];
export function movePrompt(prompts: Prompt[], sourceId: string, targetId: string) {
  const from = prompts.findIndex(prompt => prompt.id === sourceId), to = prompts.findIndex(prompt => prompt.id === targetId);
  if (from < 0 || to < 0 || from === to) return prompts;
  const next = [...prompts], [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
