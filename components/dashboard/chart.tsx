"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart, BarChart, PieChart, RadarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, RadarComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

echarts.use([LineChart, BarChart, PieChart, RadarChart, GridComponent, TooltipComponent, RadarComponent, CanvasRenderer]);
export default function Chart({ option, dark, label, className="" }: { option:EChartsCoreOption; dark:boolean; label:string; className?:string }) {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!ref.current)return;
    const chart=echarts.init(ref.current);
    chart.setOption({textStyle:{fontFamily:'Arial,"Microsoft YaHei",sans-serif',fontSize:13,color:dark?"#aaaab2":"#777b84"},...option});
    const observer=new ResizeObserver(()=>chart.resize());observer.observe(ref.current);
    return()=>{observer.disconnect();chart.dispose()};
  },[option,dark]);
  return <div ref={ref} className={`analytics-chart ${className}`} role="img" aria-label={label}/>;
}
