"use client";
import { useEffect, useRef, type InputHTMLAttributes } from "react";
import styles from "./collection-controls.module.css";
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { indeterminate?: boolean };
export default function Checkbox({ indeterminate = false, className = "", ...props }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <span className={`${styles.checkbox} ${className}`}><input {...props} ref={ref} type="checkbox" /><svg viewBox="0 0 16 16" aria-hidden="true"><path className={styles.tick} d="m3.5 8 3 3 6-6" /><path className={styles.dash} d="M4 8h8" /></svg></span>;
}
