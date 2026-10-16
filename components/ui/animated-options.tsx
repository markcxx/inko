"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./collection-controls.module.css";
export type AnimatedOption = { value: string; label: ReactNode; count?: number; color?: string };
export default function AnimatedOptions({ value, options, onChange, label, variant = "tabs" }: { value: string; options: AnimatedOption[]; onChange: (value: string) => void; label: string; variant?: "tabs" | "segment" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const update = () => {
      const button = ref.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      if (button) setPosition({ left: button.offsetLeft, width: button.offsetWidth });
    };
    update();
    const observer = new ResizeObserver(update);
    if (ref.current) observer.observe(ref.current);
    ref.current?.querySelectorAll("button").forEach(button => observer.observe(button));
    return () => observer.disconnect();
  }, [value, options]);
  return <div ref={ref} className={`${styles.options} ${variant === "tabs" ? styles.tabs : styles.segment}`} aria-label={label}><span aria-hidden="true" className={styles.indicator} style={{ transform: `translateX(${position.left}px)`, width: position.width }} />{options.map(option => <button key={option.value} aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}{option.count !== undefined && <span className={styles.badge} style={{ color: option.color, backgroundColor: `${option.color}16` }}>{option.count}</span>}</button>)}</div>;
}
