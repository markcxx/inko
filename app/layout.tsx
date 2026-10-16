import type { Metadata } from "next";
import "./globals.css";
import Scrollbar from "@/components/ui/scrollbar";
export const metadata: Metadata = {
  title: "inko创作空间 · AI 创作工作台",
  description: "为公众号创作者打造的 AI 内容工作台，让选题、调研、写作与配图自然发生。",
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="zh-CN"><body><Scrollbar /><div id="page-content">{children}</div></body></html>;
}
