"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
type Option = { value: string; label: string };
export default function Select({ value, options, onChange, label }: { value: string; options: Option[]; onChange: (value: string) => void; label: string }) {
  const [open,setOpen]=useState(false), [active,setActive]=useState(0);
  const ref=useRef<HTMLDivElement>(null), button=useRef<HTMLButtonElement>(null);
  const id=useId();
  const selected=Math.max(0,options.findIndex(o=>o.value===value));
  const show=()=>{setActive(selected);setOpen(true)};
  const choose=(index:number)=>{onChange(options[index].value);setOpen(false);button.current?.focus()};
  useEffect(()=>{ if(!open)return; const close=(event:PointerEvent)=>{if(!ref.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[open]);
  return <div className="select" ref={ref} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false)}}>
    <button ref={button} type="button" className="select-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>open?setOpen(false):show()} onKeyDown={e=>{
      if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();if(!open)show();else setActive(i=>(i+(e.key==="ArrowDown"?1:-1)+options.length)%options.length)}
      else if(e.key==="Escape"){setOpen(false)} else if(e.key==="Home"&&open){e.preventDefault();setActive(0)}else if(e.key==="End"&&open){e.preventDefault();setActive(options.length-1)}
      else if((e.key==="Enter"||e.key===" ")&&open){e.preventDefault();choose(active)}
    }} aria-activedescendant={open?`${id}-${active}`:undefined}>{options[selected]?.label}<ChevronDown size={16} className={open?"rotated":""}/></button>
    {open&&<div id={id} role="listbox" aria-label={label} className="select-menu">{options.map((option,i)=><div id={`${id}-${i}`} role="option" aria-selected={value===option.value} key={option.value} className={`select-option ${active===i?"focused":""}`} onPointerMove={()=>setActive(i)} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(i)}>{option.label}{value===option.value&&<Check size={15}/>}</div>)}</div>}
  </div>;
}
