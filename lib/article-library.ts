export type LibraryStatus = "草稿" | "创作中" | "待审阅" | "已完成";
export type LibraryArticle = {
  id: string;
  title: string;
  topic: string;
  words: number;
  status: LibraryStatus;
  excerpt: string;
  cover: number | null;
  updatedAt: string;
};
export const statusColors: Record<LibraryStatus, string> = { 草稿: "gray", 创作中: "purple", 待审阅: "blue", 已完成: "green" };
const examples: Omit<LibraryArticle, "id" | "updatedAt">[] = [
  { title: "AI 时代，创作者真正的竞争力是什么", topic: "科技观察", words: 2486, status: "创作中", excerpt: "工具不断变化，独立判断依然重要。", cover: 0 },
  { title: "普通人如何建立自己的知识体系", topic: "个人成长", words: 1263, status: "待审阅", excerpt: "让零散的信息，慢慢形成自己的理解。", cover: 1 },
  { title: "把生活调成自己喜欢的频道", topic: "生活方式", words: 937, status: "已完成", excerpt: "找回自己的节奏，从一点留白开始。", cover: 2 },
  { title: "为什么我们越来越需要长期主义", topic: "观点洞察", words: 1850, status: "草稿", excerpt: "那些短期看不见的积累，最终会留下痕迹。", cover: 3 },
  { title: "周末阅读清单：在文字中找到新的可能", topic: "阅读分享", words: 2105, status: "已完成", excerpt: "从这几本书里，打开另一种观察世界的方式。", cover: 4 },
  { title: "关于下一篇文章的几个想法", topic: "未分类", words: 0, status: "草稿", excerpt: "记录一点灵感，留给下一次创作。", cover: null },
  { title: "用 AI 整理信息，先学会问对问题", topic: "科技观察", words: 1672, status: "待审阅", excerpt: "让提问成为思考的起点。", cover: 5 },
  { title: "给忙碌生活留一点空白", topic: "生活方式", words: 1428, status: "已完成", excerpt: "在日常的缝隙里，重新发现生活。", cover: 2 },
];
const moreTitles = ["写作是一场与自己的对话", "建立一个真正能坚持的阅读习惯", "我们需要什么样的信息生活", "把复杂的问题讲清楚", "不必追赶每一次热点", "从一张白纸开始思考", "如何找到自己的表达方式", "走出效率焦虑的第一步", "比答案更重要的是问题", "那些值得反复阅读的句子", "用小习惯改变一天", "慢下来，才能看见细节", "分享知识，也分享真实的困惑", "为什么好故事总能打动人", "观察生活的另一种方式", "如何整理你的灵感笔记", "留住那些一闪而过的想法", "让工具服务于创作", "在日常里发现新的可能", "给自己一段专注的时间"];
export const libraryArticles: LibraryArticle[] = [
  ...examples,
  ...moreTitles.map((title, index) => ({ ...examples[index % examples.length], title, status: (index < 4 ? "草稿" : index < 7 ? "创作中" : index === 7 ? "待审阅" : "已完成") as LibraryStatus, words: 950 + index * 127 })),
].map((article, index) => ({ ...article, id: `article-${index + 1}`, updatedAt: new Date(Date.UTC(2026, 9, 16 - Math.floor(index / 2), index % 2 ? 3 : 6, index % 2 ? 8 : 32)).toISOString() }));
export function editedLabel(date: string) {
  const day = date.slice(0, 10);
  const time = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai", hour12: false }).format(new Date(date));
  if (day === "2026-10-16") return `今天 ${time}`;
  if (day === "2026-10-15") return `昨天 ${time}`;
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", timeZone: "Asia/Shanghai" }).format(new Date(date));
}
