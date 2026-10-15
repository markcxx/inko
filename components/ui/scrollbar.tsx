"use client";

import { useEffect } from "react";

export default function Scrollbar() {
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
  return null;
}
