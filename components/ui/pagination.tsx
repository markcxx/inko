"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Select from "./select";
import styles from "./collection-controls.module.css";
export default function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange }: { total: number; page: number; pageSize: number; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const numbers = Array.from(new Set([1, ...Array.from({ length: 5 }, (_, i) => page - 2 + i).filter(n => n > 1 && n < pages), pages])).sort((a, b) => a - b);
  return <div className={styles.pagination}><span>{total ? `显示 ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} 条，共 ${total} 条` : "共 0 条"}</span><nav aria-label="文章分页"><Select label="每页条数" value={String(pageSize)} onChange={value => onPageSizeChange(Number(value))} options={[6, 8, 12, 24].map(value => ({ value: String(value), label: `每页 ${value} 条` }))} /><button aria-label="上一页" disabled={page === 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={17} /></button>{numbers.map((n, index) => <span className={styles.pageItem} key={n}>{index > 0 && n - numbers[index - 1] > 1 && <span className={styles.ellipsis}>…</span>}<button aria-label={`第 ${n} 页`} aria-current={n === page ? "page" : undefined} onClick={() => onPageChange(n)}>{n}</button></span>)}<button aria-label="下一页" disabled={page === pages} onClick={() => onPageChange(page + 1)}><ChevronRight size={17} /></button></nav></div>;
}
