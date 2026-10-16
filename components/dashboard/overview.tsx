"use client";

import { useMemo, type ReactNode } from "react";
import type { EChartsCoreOption } from "echarts/core";
import { ArrowDownRight, ArrowUpRight, ChartColumn, ChartLine, ChartPie, Radar, type LucideIcon } from "lucide-react";
import Chart from "./chart";
import EmptyState from "@/components/ui/empty-state";
import ActivityCalendar from "./activity-calendar";
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
    const previousDaily=dates.map(date=>{const d=new Date(date+"T12:00:00");d.setDate(d.getDate()-days);const key=dayKey(d);return {date:key,words:previous.articles.filter(a=>dayKey(new Date(a.createdAt))===key).reduce((sum,a)=>sum+a.words,0)};});
    const lengths=[{name:"短篇 · 1,000 字以内",value:current.articles.filter(a=>a.words<=1000).length},{name:"中篇 · 1,001–2,000 字",value:current.articles.filter(a=>a.words>1000&&a.words<=2000).length},{name:"长篇 · 2,001–3,000 字",value:current.articles.filter(a=>a.words>2000&&a.words<=3000).length},{name:"深度长文 · 3,000 字以上",value:current.articles.filter(a=>a.words>3000).length}];
    const weekdays=["周一","周二","周三","周四","周五","周六","周日"].map((name,index)=>({name,value:current.articles.filter(a=>(new Date(a.createdAt).getDay()+6)%7===index).length}));
    return {total,prior,labels,daily,categories,status,previousDaily,lengths,weekdays};
  },[data,days,now]);
  const {total,prior,labels,daily,categories,status,previousDaily,lengths,weekdays}=analytics;
  const previousLabel=days===7?"上周同期":"上一周期";
  const ink=dark?"#c6c2ff":"#222324",text=dark?"#aaaab2":"#777b84",line=dark?"#3a3a3c":"#e8ebef";
  const palette=[ink,"#9fa7ef","#a8d7e9","#a5d9c0"];
  const tooltip={trigger:"axis",backgroundColor:dark?"#f3f3f5":"#242426",borderWidth:0,padding:[10,14],extraCssText:"border-radius:10px;box-shadow:0 6px 22px #0002;line-height:1.7;",textStyle:{color:dark?"#252528":"#f7f7f8",fontSize:12}};
  const axis={axisLine:{lineStyle:{color:line}},axisTick:{show:false},axisLabel:{color:text,fontSize:13},splitLine:{lineStyle:{color:line}}};
  const base={tooltip,grid:{left:48,right:20,top:22,bottom:40},xAxis:{...axis,type:"category",data:labels,boundaryGap:false,splitLine:{show:false}},yAxis:{...axis,type:"value",minInterval:1}};
  const trend:EChartsCoreOption={...base,tooltip:{...tooltip,formatter:(params:unknown)=>{const items=params as {dataIndex:number;marker:string;seriesName:string;value:number}[];return items.map((item,i)=>`${item.marker} ${item.seriesName} · ${i===0?labels[item.dataIndex]:previousDaily[item.dataIndex].date.slice(5).replace("-","/")}：${item.value.toLocaleString()} 字`).join("<br/>")}},series:[{name:"本期",type:"line",data:daily.map(d=>d.words),smooth:true,symbolSize:5,lineStyle:{color:ink,width:3},itemStyle:{color:ink},areaStyle:{color:dark?"#c6c2ff15":"#a8c9dd24"}},{name:previousLabel,type:"line",data:previousDaily.map(d=>d.words),smooth:true,symbolSize:4,lineStyle:{color:"#9fa7cf",width:2,type:"dashed"},itemStyle:{color:"#9fa7cf"}}]};
  const theme:EChartsCoreOption={...base,grid:{left:88,right:24,top:15,bottom:30},xAxis:{...axis,type:"value",minInterval:1},yAxis:{...axis,type:"category",data:categories.map(c=>c.name),inverse:true,splitLine:{show:false}},series:[{name:"文章数",type:"bar",barMaxWidth:25,data:categories.map((c,i)=>({value:c.value,itemStyle:{color:palette[i%4],borderRadius:[0,5,5,0]}}))}]};
  const pie:EChartsCoreOption={tooltip:{...tooltip,trigger:"item",formatter:"{b}：{c} 篇（{d}%）"},color:palette,series:[{type:"pie",radius:["55%","78%"],center:["33%","50%"],label:{show:false},itemStyle:{borderRadius:7,borderWidth:4,borderColor:dark?"#282828":"#f7f9fb"},data:status}]};
  const calls:EChartsCoreOption={...base,xAxis:{...base.xAxis,boundaryGap:true},series:[{name:"成功",type:"bar",stack:"calls",barMaxWidth:22,itemStyle:{color:"#a5d9c0"},data:daily.map(d=>d.ok)},{name:"失败",type:"bar",stack:"calls",itemStyle:{color:"#e3b3ae",borderRadius:[3,3,0,0]},data:daily.map(d=>d.fail)}]};
  const lengthChart:EChartsCoreOption={tooltip:{...tooltip,trigger:"axis"},grid:{left:164,right:35,top:22,bottom:30},xAxis:{...axis,type:"value",minInterval:1},yAxis:{...axis,type:"category",data:lengths.map(d=>d.name),inverse:true,splitLine:{show:false}},series:[{name:"文章数",type:"bar",barMaxWidth:24,label:{show:true,position:"right",color:text,formatter:"{c} 篇"},data:lengths.map((d,i)=>({value:d.value,itemStyle:{color:["#a8d7e9","#9fa7ef","#a5d9c0",ink][i],borderRadius:[0,5,5,0]}}))}]};
  const rhythm:EChartsCoreOption={tooltip:{...tooltip,trigger:"item"},radar:{indicator:weekdays.map(day=>({name:day.name,max:Math.max(1,...weekdays.map(d=>d.value))})),center:["50%","53%"],radius:"67%",splitNumber:4,axisName:{color:text,fontSize:12},axisLine:{lineStyle:{color:line}},splitLine:{lineStyle:{color:line}},splitArea:{areaStyle:{color:dark?["#ffffff02","#ffffff04"]:["#ffffff00","#ffffff80"]}}},series:[{type:"radar",name:"新建文章",symbol:"circle",symbolSize:5,lineStyle:{color:"#9fa7cf",width:2},itemStyle:{color:"#9fa7cf"},areaStyle:{color:"#9fa7ef",opacity:.22},data:[{name:`近 ${days} 天 · 新建文章（篇）`,value:weekdays.map(day=>day.value)}]}]};
  const metrics=[{name:"新建文章",value:total.articles,previous:prior.articles,unit:"篇",description:"按创建时间统计"},{name:"文章总字数",value:total.words,previous:prior.words,unit:"字",description:"区间内新建文章的当前字数"},{name:"生成图片",value:total.images,previous:prior.images,unit:"张",description:"成功任务实际产出的图片"},{name:"AI 调用",value:total.calls,previous:prior.calls,unit:"次",description:"包含成功与失败请求"}];
  const render=(option:EChartsCoreOption,label:string,empty:boolean,Icon:LucideIcon=ChartColumn)=>empty?<EmptyState icon={Icon} title="暂无记录" description="有相关创作记录后，将自动生成统计" hint="从一次小小的创作开始" />:<Chart option={option} dark={dark} label={label}/>;
  return <>
    <section className="stat-grid" aria-label="创作数据概况">{metrics.map((m,i)=>{const delta=m.previous?((m.value-m.previous)/m.previous*100):null;return <div className={`stat-card ${i%2?"lavender":"blue"}`} key={m.name}><h2>{m.name}</h2><div className="stat-bottom"><div><strong>{m.value.toLocaleString()}</strong><small>{m.unit}</small></div><span data-tooltip="与前一个等长时间区间比较">{delta===null?"上期无数据":<>{delta>=0?"+":""}{delta.toFixed(1)}%{delta>=0?<ArrowUpRight size={14}/>:<ArrowDownRight size={14}/>}</>}</span></div><p className="metric-description">{m.description}</p></div>})}</section>
    <div className="analytics-summary"><span>文章完成率 <strong>{total.articles?`${(status[3].value/total.articles*100).toFixed(0)}%`:"—"}</strong></span><span>已完成文章 <strong>{status[3].value} 篇</strong></span><span>平均篇幅 <strong>{total.articles?`${Math.round(total.words/total.articles).toLocaleString()} 字`:"—"}</strong></span><span>活跃天数 <strong>{daily.filter(d=>d.activity>0).length} / {days} 天</strong></span></div>
    <div className="analytics-grid">
      <Panel title="创作字数趋势" note={`近 ${days} 天 · 对比前 ${days} 天`} wide><div className="trend-comparison-legend"><span><i />本期</span><span><i className="previous" />{previousLabel}</span></div>{render(trend,"本期与上一周期每日创作字数对比图",!total.articles&&!prior.articles,ChartLine)}</Panel>
      <Panel title="内容主题分布" note={`${total.articles} 篇文章`}>{render(theme,"内容主题横向条形图",!total.articles)}</Panel>
      <Panel title="文章状态分布" note="当前状态快照"><div className="status-chart">{render(pie,"文章状态环形图",!total.articles,ChartPie)}{!!total.articles&&<div className="status-chart-legend">{status.map((s,i)=><div key={s.name}><span><i style={{background:palette[i]}}/>{s.name}</span><strong>{s.value} 篇</strong></div>)}</div>}</div></Panel>
      <Panel title="AI 调用结果" note="每日请求数"><div className="inline-legend"><span><i style={{background:"#a5d9c0"}}/>成功</span><span><i style={{background:"#e3b3ae"}}/>失败</span></div>{render(calls,"每日 AI 调用成功失败堆叠柱状图",!total.calls)}</Panel>
      <Panel title="文章篇幅分布" note="找到适合你的表达长度">{render(lengthChart,"短篇、中篇、长篇与深度长文数量分布",!total.articles)}</Panel>
      <Panel title="创作活跃日历" note="近 180 天 · 每格一天"><ActivityCalendar data={data} now={now} /></Panel>
      <Panel title="每周创作节奏" note={`近 ${days} 天 · 按星期汇总文章数`}>{render(rhythm,"周一至周日新建文章数量雷达图",!total.articles,Radar)}</Panel>
    </div>
  </>;
}
