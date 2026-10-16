"use client";
import type { ReactNode } from "react";
import Checkbox from "./checkbox";
import styles from "./collection-controls.module.css";
export type TableColumn<T> = { key: string; heading: ReactNode; render: (row: T) => ReactNode; className?: string };
export default function DataTable<T extends { id: string; title: string }>({ rows, columns, selected, onSelectionChange, className = "" }: { rows: T[]; columns: TableColumn<T>[]; selected: Set<string>; onSelectionChange: (selected: Set<string>) => void; className?: string }) {
  const all = rows.length > 0 && rows.every(row => selected.has(row.id));
  const toggle = (id: string) => { const next = new Set(selected); if (next.has(id)) next.delete(id); else next.add(id); onSelectionChange(next); };
  return <div className={styles.tableWrap}><table className={`${styles.table} ${className}`}><thead><tr><th className={styles.checkCell}><Checkbox aria-label="选择本页全部文章" checked={all} indeterminate={!all && rows.some(row => selected.has(row.id))} onChange={() => { const next = new Set(selected); rows.forEach(row => all ? next.delete(row.id) : next.add(row.id)); onSelectionChange(next); }} /></th>{columns.map(column => <th key={column.key} className={column.className}>{column.heading}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id} data-selected={selected.has(row.id) || undefined}><td className={styles.checkCell}><Checkbox aria-label={`选择：${row.title}`} checked={selected.has(row.id)} onChange={() => toggle(row.id)} /></td>{columns.map(column => <td key={column.key} className={column.className}>{column.render(row)}</td>)}</tr>)}</tbody></table></div>;
}
