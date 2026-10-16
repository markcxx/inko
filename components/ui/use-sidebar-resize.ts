"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

const MIN_WIDTH = 220;
const MAX_WIDTH = 420;
const COLLAPSE_AT = 150;
const EXPAND_AT = 180;

export default function useSidebarResize() {
  const [width, setWidth] = useState(232);
  const [open, setOpen] = useState(true);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{ pointerId: number; width: number; open: boolean; left: number } | null>(null);
  const maxWidth = () => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth * .4));
  const toggle = () => setOpen(value => !value);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    gesture.current = { pointerId: event.pointerId, width, open, left: event.currentTarget.parentElement?.getBoundingClientRect().left ?? 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    const next = event.clientX - gesture.current.left;
    if (next < COLLAPSE_AT) setOpen(false);
    else if (next >= EXPAND_AT) {
      setWidth(Math.min(maxWidth(), Math.max(MIN_WIDTH, next)));
      setOpen(true);
    }
  };
  const finish = (event: PointerEvent<HTMLDivElement>, cancel = false) => {
    const start = gesture.current;
    if (!start || start.pointerId !== event.pointerId) return;
    if (cancel) { setWidth(start.width); setOpen(start.open); }
    gesture.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") { event.preventDefault(); toggle(); }
    else if (event.key === "Home") { event.preventDefault(); setOpen(false); }
    else if (event.key === "End") { event.preventDefault(); setWidth(maxWidth()); setOpen(true); }
    else if (event.key === "ArrowRight") { event.preventDefault(); setOpen(true); setWidth(value => Math.min(maxWidth(), value + 16)); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); if (width <= MIN_WIDTH) setOpen(false); else setWidth(value => Math.max(MIN_WIDTH, value - 16)); }
  };
  return { width, open, dragging, toggle, handleProps: {
    onPointerDown, onPointerMove, onPointerUp: (event: PointerEvent<HTMLDivElement>) => finish(event),
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => finish(event, true),
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => finish(event, true),
    onDoubleClick: toggle, onKeyDown,
  } };
}
