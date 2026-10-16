export type Article = { id: string; title: string; category: string; words: number; status: "草稿" | "撰写中" | "待润色" | "已完成"; createdAt: string };
export type AIEvent = { id: string; kind: "写作" | "配图" | "调研"; createdAt: string; success: boolean; tokens: number; duration: number; images: number };
export type Dataset = { articles: Article[]; events: AIEvent[] };
export const periods = [{ value: "7", label: "近 7 天" }, { value: "30", label: "近 30 天" }, { value: "90", label: "近 90 天" }];
export function dayKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export function rangeStart(now: Date, days: number) { const date = new Date(now); date.setHours(0,0,0,0); date.setDate(date.getDate()-days+1); return date; }
export function inRange(date: string, now: Date, days: number) { const time = new Date(date).getTime(); return time >= rangeStart(now,days).getTime() && time <= now.getTime(); }
export function summarize(data: Dataset) {
  return { articles: data.articles.length, words: data.articles.reduce((sum,a)=>sum+a.words,0), images: data.events.reduce((sum,e)=>sum+(e.success?e.images:0),0), calls: data.events.length, tokens: data.events.reduce((sum,e)=>sum+e.tokens,0), success: data.events.filter(e=>e.success).length };
}
export function demoDataset(now: Date): Dataset {
  const articles: Article[] = [], events: AIEvent[] = [];
  const titles = ["为什么我们越来越需要「长期主义」？", "普通人如何建立自己的知识体系", "把生活调成自己喜欢的频道", "AI 时代，创作者真正的竞争力是什么", "周末阅读清单：在文字中找到新的可能"];
  const categories = ["观点洞察", "个人成长", "生活方式", "科技观察", "阅读分享"];
  for(let day=0;day<180;day++) {
    const date=new Date(now);date.setDate(date.getDate()-day);date.setHours(9,0,0,0); if(date>now)date.setTime(now.getTime());
    if(day%4!==3) for(let j=0;j<(day%3===0?2:1);j++) { const i=articles.length; articles.push({id:`demo-${i}`,title:titles[i%5],category:categories[i%5],words:day===0&&j===0?2486:800+(day*137+j*463)%2800,status:(["撰写中","待润色","已完成","已完成","草稿"] as const)[i%5],createdAt:date.toISOString()}); }
    for(let j=0;j<2+day%5;j++) { const i=events.length, success=i%11!==7; events.push({id:`event-${i}`,kind:(["写作","配图","调研"] as const)[i%3],createdAt:date.toISOString(),success,tokens:400+(i*367)%7600,duration:2+(i*13)%85,images:i%3===1?2:0}); }
  }
  return {articles,events};
}
