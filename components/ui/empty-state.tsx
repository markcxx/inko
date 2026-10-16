import { Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function EmptyState({ icon: Icon, title, description, hint, action }: {
  icon: LucideIcon;
  title: string;
  description: string;
  hint?: string;
  action?: ReactNode;
}) {
  return <div className="chart-empty">
    <div className="chart-empty-art" aria-hidden="true">
      <div className="chart-empty-icon"><Icon size={30} strokeWidth={1.35} /></div>
      <span className="chart-empty-spark"><Sparkles size={13} strokeWidth={1.5} /></span>
    </div>
    <div className="chart-empty-copy"><strong>{title}</strong><p>{description}</p></div>
    {hint && <span className="chart-empty-hint">{hint}</span>}
    {action && <div className="empty-state-action">{action}</div>}
  </div>;
}
