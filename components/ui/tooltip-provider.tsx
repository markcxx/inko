"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Hint = { anchor: HTMLElement; text: string; dark: boolean };
export default function TooltipProvider() {
  const [hint, setHint] = useState<Hint | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active: HTMLElement | null = null;
    let describedBy: string | null = null;
    const close = () => {
      clearTimeout(timer);
      if (active) {
        if (describedBy) active.setAttribute("aria-describedby", describedBy);
        else active.removeAttribute("aria-describedby");
      }
      active = null;
      setHint(null);
    };
    const enter = (event: Event) => {
      if (event instanceof PointerEvent && event.pointerType === "touch") return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-tooltip]") : null;
      if (anchor === active) return;
      close();
      if (!anchor || !anchor.dataset.tooltip) return;
      active = anchor;
      describedBy = anchor.getAttribute("aria-describedby");
      timer = setTimeout(() => {
        if (!anchor.isConnected) return;
        anchor.setAttribute("aria-describedby", [describedBy, id].filter(Boolean).join(" "));
        setHint({ anchor, text: anchor.dataset.tooltip!, dark: !!anchor.closest(".dark") });
      }, event.type === "focusin" ? 120 : 350);
    };
    const leave = (event: Event) => {
      const related = (event as FocusEvent | PointerEvent).relatedTarget;
      if (active && related instanceof Node && active.contains(related)) return;
      close();
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("pointerover", enter);
    document.addEventListener("pointerout", leave);
    document.addEventListener("focusin", enter);
    document.addEventListener("focusout", leave);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    const observer = new MutationObserver(close);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
    return () => {
      clearTimeout(timer);
      if (active) { if (describedBy) active.setAttribute("aria-describedby", describedBy); else active.removeAttribute("aria-describedby"); }
      document.removeEventListener("pointerover", enter);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("focusin", enter);
      document.removeEventListener("focusout", leave);
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      observer.disconnect();
    };
  }, [id]);
  useLayoutEffect(() => {
    if (!hint || !box.current) return;
    const rect = hint.anchor.getBoundingClientRect(), tooltip = box.current;
    const width = tooltip.offsetWidth, height = tooltip.offsetHeight;
    const below = rect.top < height + 18;
    const left = Math.max(10, Math.min(innerWidth - width - 10, rect.left + rect.width / 2 - width / 2));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${below ? rect.bottom + 10 : rect.top - height - 10}px`;
    tooltip.style.setProperty("--tooltip-arrow-x", `${Math.max(12, Math.min(width - 12, rect.left + rect.width / 2 - left))}px`);
    tooltip.dataset.side = below ? "bottom" : "top";
  }, [hint]);
  if (!hint) return null;
  return createPortal(<div ref={box} id={id} role="tooltip" className={`global-tooltip${hint.dark ? " global-tooltip-dark" : ""}`}>{hint.text}<span className="global-tooltip-arrow" /></div>, hint.anchor.closest("dialog[open]") || document.body);
}
