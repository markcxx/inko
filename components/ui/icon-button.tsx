"use client";

import type { LucideIcon } from "lucide-react";

export default function IconButton({ icon: Icon, label, onClick, active = false }: { icon: LucideIcon; label: string; onClick?: () => void; active?: boolean }) { return <button className={`icon-button ${active ? "active" : ""}`} title={label} aria-label={label} onClick={onClick}><Icon size={19} strokeWidth={1.65} /></button>; }
