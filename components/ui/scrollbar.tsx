"use client";

import { useEffect, useRef, useState } from "react";

export default function Scrollbar() {
  const [metrics, setMetrics] = useState({ top: 0, height: 0, range: 0, track: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ y: number; scroll: number } | null>(null);
  useEffect(() => {
    const measure = () => {
      const root = document.documentElement;
      const track = window.innerHeight;
      const range = Math.max(0, root.scrollHeight - track);
      const height = Math.min(track, Math.max(36, track * track / root.scrollHeight));
      setMetrics({ top: range ? window.scrollY / range * (track - height) : 0, height, range, track });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);
  useEffect(() => {
    let active: Element | null = null;
    const activate = (element: Element | null) => {
      if (active === element) return;
      active?.removeAttribute("data-scrollbar-hover");
      active = element;
      active?.setAttribute("data-scrollbar-hover", "");
    };
    const move = (event: PointerEvent) => {
      const root = document.documentElement;
      const viewportRight = Math.min(root.clientWidth, root.getBoundingClientRect().right);
      // The viewport scrollbar lies outside the document's client area.
      if ((root.scrollHeight > root.clientHeight && event.clientX >= viewportRight) ||
          (root.scrollWidth > root.clientWidth && event.clientY >= root.clientHeight)) {
        activate(root);
        return;
      }
      let element = event.target instanceof Element ? event.target : null;
      while (element && element !== root) {
        if (element instanceof HTMLElement) {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const vertical = /auto|scroll/.test(style.overflowY) && element.scrollHeight > element.clientHeight;
          const horizontal = /auto|scroll/.test(style.overflowX) && element.scrollWidth > element.clientWidth;
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const inVertical = vertical && x >= element.clientLeft + element.clientWidth && x < element.offsetWidth - parseFloat(style.borderRightWidth);
          const inHorizontal = horizontal && y >= element.clientTop + element.clientHeight && y < element.offsetHeight - parseFloat(style.borderBottomWidth);
          if (inVertical || inHorizontal) {
            activate(element);
            return;
          }
        }
        element = element.parentElement;
      }
      activate(null);
    };
    const clear = () => activate(null);
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", clear);
    window.addEventListener("blur", clear);
    return () => {
      clear();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", clear);
      window.removeEventListener("blur", clear);
    };
  }, []);
  return metrics.range > 0 ? <div className={`page-scrollbar${dragging ? " is-dragging" : ""}`}>
    <div className="page-scrollbar-thumb" role="scrollbar" aria-label="页面滚动条"
      aria-orientation="vertical" aria-valuemin={0} aria-valuemax={Math.round(metrics.range)}
      aria-valuenow={Math.round(metrics.top / Math.max(1, metrics.track - metrics.height) * metrics.range)}
      aria-controls="page-content" tabIndex={0}
      style={{ top: metrics.top, height: metrics.height }}
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.preventDefault();
        drag.current = { y: event.clientY, scroll: window.scrollY };
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (!drag.current) return;
        const distance = Math.max(1, metrics.track - metrics.height);
        window.scrollTo(0, drag.current.scroll + (event.clientY - drag.current.y) * metrics.range / distance);
      }}
      onPointerUp={event => {
        drag.current = null;
        setDragging(false);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onLostPointerCapture={() => { drag.current = null; setDragging(false); }}
      onPointerCancel={() => { drag.current = null; setDragging(false); }}
      onKeyDown={event => {
        const delta = { ArrowDown: 40, ArrowUp: -40, PageDown: window.innerHeight * .9, PageUp: -window.innerHeight * .9 }[event.key];
        if (delta !== undefined) { event.preventDefault(); window.scrollBy(0, delta); }
        if (event.key === "Home" || event.key === "End") { event.preventDefault(); window.scrollTo(0, event.key === "Home" ? 0 : metrics.range); }
      }}
    />
  </div> : null;
}
