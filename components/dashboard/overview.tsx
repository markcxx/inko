"use client";

import { useMemo, type ReactNode } from "react";
import type { EChartsCoreOption } from "echarts/core";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Chart from "./chart";
import { dayKey, inRange, rangeStart, summarize, type Dataset } from "@/lib/analytics";
function Panel({title,note,children,wide=false}:{title:string;note:string;children:ReactNode;wide?:boolean}) { return <section className={`card analytics-panel ${wide?"wide":""}`}><div className="card-heading"><h2>{title}</h2><span className="subtle">{note}</span></div>{children}</section> }
export default function Overview({data,dark,days,now}:{data:Dataset;dark:boolean;days:number;now:Date}) {
  const analytics=useMemo(()=>{
    const current={articles:data.articles.filter(a=>inRange(a.createdAt,now,days)),events:data.events.filter(e=>inRange(e.createdAt,now,days))};
    const previousEnd=new Date(rangeStart(now,days).getTime()-1);
    const previous={articles:data.articles.filter(a=>inRange(a.createdAt,previousEnd,days)),events:data.events.filter(e=>inRange(e.createdAt,previousEnd,days))};
    const total=summarize(current),prior=summarize(previous);
    const dates=Array.from({length:days},(_,i)=>{const d=rangeStart(now,days);d.setDate(d.getDate()+i);return dayKey(d)});
    const labels=dates.map(d=>d.slice(5).replace("-","/"));
    const daily=dates.map(date=>({words:current.articles.filter(a=>dayKey(new Date(a.createdAt))===date).reduce((sum,a)=>sum+a.words,0),ok:current.events.filter(e=>dayKey(new Date(e.createdAt))===date&&e.success).length,fail:current.events.filter(e=>dayKey(new Date(e.createdAt))===date&&!e.success).length,activity:current.articles.filter(a=>dayKey(new Date(a.createdAt))===date).length+current.events.filter(e=>dayKey(new Date(e.createdAt))===date).length}));
    const categories=[...new Set(current.articles.map(a=>a.category))].map(name=>({name,value:current.articles.filter(a=>a.category===name).length})).sort((a,b)=>b.value-a.value);
    const status=["草稿","撰写中","待润色","已完成"].map(name=>({name,value:current.articles.filter(a=>a.status===name).length}));
    return {current,total,prior,dates,labels,daily,categories,status};
  },[data,days,now]);
  const {current,total,prior,dates,labels,daily,categories,status}=analytics;
  const ink=dark?"#c6c2ff":"#222324",text=dark?"#aaaab2":"#777b84",line=dark?"#3a3a3c":"#e8ebef";
  const palette=[ink,"#9fa7ef","#a8d7e9","#a5d9c0"];
  const tooltip={trigger:"axis",backgroundColor:dark?"#333":"#fff",borderWidth:0,textStyle:{color:dark?"#eee":"#222",fontSize:14}};
  const axis={axisLine:{lineStyle:{color:line}},axisTick:{show:false},axisLabel:{color:text,fontSize:13},splitLine:{lineStyle:{color:line}}};
  const base={tooltip,grid:{left:48,right:20,top:22,bottom:40},xAxis:{...axis,type:"category",data:labels,boundaryGap:false,splitLine:{show:false}},yAxis:{...axis,type:"value",minInterval:1}};
  const trend:EChartsCoreOption={...base,series:[{name:"文章字数",type:"line",data:daily.map(d=>d.words),smooth:true,symbolSize:5,lineStyle:{color:ink,width:3},itemStyle:{color:ink},areaStyle:{color:dark?"#c6c2ff15":"#a8c9dd24"}}]};
  const theme:EChartsCoreOption={...base,grid:{left:88,right:24,top:15,bottom:30},xAxis:{...axis,type:"value",minInterval:1},yAxis:{...axis,type:"category",data:categories.map(c=>c.name),inverse:true,splitLine:{show:false}},series:[{name:"文章数",type:"bar",barMaxWidth:25,data:categories.map((c,i)=>({value:c.value,itemStyle:{color:palette[i%4],borderRadius:[0,5,5,0]}}))}]};
  const pie:EChartsCoreOption={tooltip:{...tooltip,trigger:"item",formatter:"{b}：{c} 篇（{d}%）"},color:palette,series:[{type:"pie",radius:["55%","78%"],center:["33%","50%"],label:{show:false},itemStyle:{borderRadius:7,borderWidth:4,borderColor:dark?"#282828":"#f7f9fb"},data:status}]};
  const calls:EChartsCoreOption={...base,xAxis:{...base.xAxis,boundaryGap:true},series:[{name:"成功",type:"bar",stack:"calls",barMaxWidth:22,itemStyle:{color:"#a5d9c0"},data:daily.map(d=>d.ok)},{name:"失败",type:"bar",stack:"calls",itemStyle:{color:"#e3b3ae",borderRadius:[3,3,0,0]},data:daily.map(d=>d.fail)}]};
  const scatter:EChartsCoreOption={...base,grid:{left:50,right:25,top:35,bottom:45},tooltip:{...tooltip,trigger:"item",formatter:(params:unknown)=>{const v=(params as {value:number[]}).value;return `消耗 ${v[0].toLocaleString()} Tokens<br/>耗时 ${v[1]} 秒`}},xAxis:{...axis,type:"value",name:"Tokens",nameLocation:"middle",nameGap:28},yAxis:{...axis,type:"value",name:"耗时 / 秒"},series:[{type:"scatter",symbolSize:9,itemStyle:{color:"#9fa7ef",opacity:.7},data:current.events.filter(e=>e.success).map(e=>[e.tokens,e.duration])}]};
  const first=rangeStart(now,days);first.setDate(first.getDate()-(first.getDay()+6)%7);
  const weeks:string[]=[];const heat=dates.map((date,i)=>{const d=new Date(date+"T12:00:00");const week=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(first.getFullYear(),first.getMonth(),first.getDate()))/604800000);weeks[week]=`${new Date(first.getFullYear(),first.getMonth(),first.getDate()+week*7).getMonth()+1}/${new Date(first.getFullYear(),first.getMonth(),first.getDate()+week*7).getDate()}`;return [week,(d.getDay()+6)%7,daily[i].activity,date]});
  const activity:EChartsCoreOption={tooltip:{...tooltip,position:"top",formatter:(p:unknown)=>{const v=(p as {value:(string|number)[]}).value;return `${v[3]}<br/>${v[2]} 条创作记录`}},grid:{left:45,right:20,top:15,bottom:55},xAxis:{...axis,type:"category",data:weeks,splitLine:{show:false}},yAxis:{...axis,type:"category",data:["一","二","三","四","五","六","日"],inverse:true,splitLine:{show:false}},visualMap:{dimension:2,min:0,max:Math.max(1,...daily.map(d=>d.activity)),calculable:false,orient:"horizontal",left:"center",bottom:0,text:["活跃","安静"],textStyle:{color:text},inRange:{color:dark?["#34343a","#777da7","#c6c2ff"]:["#ebedf2","#c5cbea","#858dc8"]}},series:[{type:"heatmap",data:heat,itemStyle:{borderColor:dark?"#282828":"#f7f9fb",borderWidth:5,borderRadius:7},emphasis:{itemStyle:{borderColor:ink,borderWidth:2}}}]};
  const metrics=[{name:"新建文章",value:total.articles,previous:prior.articles,unit:"篇",description:"按创建时间统计"},{name:"文章总字数",value:total.words,previous:prior.words,unit:"字",description:"区间内新建文章的当前字数"},{name:"生成图片",value:total.images,previous:prior.images,unit:"张",description:"成功任务实际产出的图片"},{name:"AI 调用",value:total.calls,previous:prior.calls,unit:"次",description:"包含成功与失败请求"}];
  const render=(option:EChartsCoreOption,label:string,empty:boolean)=>empty?<div className="chart-empty">暂无记录<span>有相关创作记录后，将自动生成统计</span></div>:<Chart option={option} dark={dark} label={label}/>;
  return <>
    <section className="stat-grid" aria-label="创作数据概况">{metrics.map((m,i)=>{const delta=m.previous?((m.value-m.previous)/m.previous*100):null;return <div className={`stat-card ${i%2?"lavender":"blue"}`} key={m.name}><h2>{m.name}</h2><div className="stat-bottom"><div><strong>{m.value.toLocaleString()}</strong><small>{m.unit}</small></div><span title="与前一个等长时间区间比较">{delta===null?"上期无数据":<>{delta>=0?"+":""}{delta.toFixed(1)}%{delta>=0?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>}</>}</span></div><p className="metric-description">{m.description}</p></div>})}</section>
    <div className="analytics-summary"><span>AI 成功率 <strong>{total.calls?`${(total.success/total.calls*100).toFixed(1)}%`:"—"}</strong></span><span>Token 消耗 <strong>{total.tokens.toLocaleString()}</strong></span><span>成功请求平均耗时 <strong>{total.success?`${(current.events.filter(e=>e.success).reduce((s,e)=>s+e.duration,0)/total.success).toFixed(1)} 秒`:"—"}</strong></span><span>活跃天数 <strong>{daily.filter(d=>d.activity>0).length} / {days} 天</strong></span></div>
    <div className="analytics-grid">
      <Panel title="创作字数趋势" note="按文章创建日归属 · 当前字数" wide>{render(trend,"每日新建文章字数面积图",!total.articles)}</Panel>
      <Panel title="内容主题分布" note={`${total.articles} 篇文章`}>{render(theme,"内容主题横向条形图",!total.articles)}</Panel>
      <Panel title="文章状态分布" note="当前状态快照"><div className="status-chart">{render(pie,"文章状态环形图",!total.articles)}{!!total.articles&&<div className="status-chart-legend">{status.map((s,i)=><div key={s.name}><span><i style={{background:palette[i]}}/>{s.name}</span><strong>{s.value} 篇</strong></div>)}</div>}</div></Panel>
      <Panel title="AI 调用结果" note="每日请求数"><div className="inline-legend"><span><i style={{background:"#a5d9c0"}}/>成功</span><span><i style={{background:"#e3b3ae"}}/>失败</span></div>{render(calls,"每日 AI 调用成功失败堆叠柱状图",!total.calls)}</Panel>
      <Panel title="Token 与响应耗时" note="仅统计成功请求">{render(scatter,"Token 消耗与请求耗时散点图",!total.success)}</Panel>
      <Panel title="创作活跃日历" note="每日新建文章 + AI 请求次数" wide>{render(activity,"每日创作活跃度热力图",!total.articles&&!total.calls)}</Panel>
    </div>
  </>;
}
