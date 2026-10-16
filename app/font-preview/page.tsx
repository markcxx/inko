"use client";

import { useState } from "react";
import Link from "next/link";
import "@fontsource/orbitron/600.css";
import "@fontsource/audiowide/400.css";
import "@fontsource/oxanium/600.css";
import "@fontsource/michroma/400.css";
import "@fontsource/syncopate/700.css";
import "@fontsource/bruno-ace/400.css";
import "@fontsource/tektur/600.css";
import "@fontsource/chakra-petch/600.css";
import "@fontsource/electrolize/400.css";
import "@fontsource/quantico/700.css";
import "@fontsource/anta/400.css";
import "@fontsource/geo/400.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/share-tech-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/rajdhani/600.css";
import "@fontsource/exo-2/600.css";
import "@fontsource/sora/600.css";
import styles from "./preview.module.css";

const fonts = [
  { name: "Orbitron", weight: 600, category: "未来感", note: "方形轮廓 · 科幻控制台" },
  { name: "Audiowide", weight: 400, category: "未来感", note: "宽体曲线 · 复古未来" },
  { name: "Oxanium", weight: 600, category: "未来感", note: "切角字形 · 数字界面" },
  { name: "Michroma", weight: 400, category: "未来感", note: "扁宽比例 · 航天仪表" },
  { name: "Syncopate", weight: 700, category: "未来感", note: "宽字距 · 极简未来" },
  { name: "Bruno Ace", weight: 400, category: "未来感", note: "几何切口 · 太空感" },
  { name: "Tektur", weight: 600, category: "机械感", note: "方正折角 · 工业结构" },
  { name: "Chakra Petch", weight: 600, category: "机械感", note: "硬朗切角 · 电子设备" },
  { name: "Electrolize", weight: 400, category: "机械感", note: "直线骨架 · 电路感" },
  { name: "Quantico", weight: 700, category: "机械感", note: "紧凑方体 · 工程气质" },
  { name: "Anta", weight: 400, category: "机械感", note: "不规则切面 · 个性字标" },
  { name: "Geo", weight: 400, category: "机械感", note: "模块化笔画 · 数字实验" },
  { name: "Space Mono", weight: 700, category: "等宽", note: "复古终端 · 鲜明字形" },
  { name: "Share Tech Mono", weight: 400, category: "等宽", note: "窄体终端 · 轻量科技" },
  { name: "JetBrains Mono", weight: 600, category: "等宽", note: "代码气质 · 清晰克制" },
  { name: "Rajdhani", weight: 600, category: "简洁科技", note: "窄体几何 · 轻巧利落" },
  { name: "Exo 2", weight: 600, category: "简洁科技", note: "柔和方角 · 现代产品" },
  { name: "Sora", weight: 600, category: "简洁科技", note: "几何骨架 · 精致数字感" },
];

export default function FontPreview() {
  const [size, setSize] = useState(24);
  const [uppercase, setUppercase] = useState(false);
  const [category, setCategory] = useState("全部");
  const [selected, setSelected] = useState<number | null>(null);
  return <div className={styles.page}>
    <header className={styles.header}>
      <Link href="/">← 返回首页</Link>
      <span>inko · 字标试衣间</span>
    </header>
    <section className={styles.intro}>
      <h1>给 inko 一点科技感</h1>
      <p>18 款科技感字体 · 未来、机械、等宽与简洁几何。均为真实字体，按侧栏尺寸预览。</p>
      <label className={styles.control}>字标大小 <input type="range" min="20" max="28" value={size} onChange={e => setSize(Number(e.target.value))} /> <strong>{size}px</strong></label>
      <div className={styles.filters}><div>{["全部", "未来感", "机械感", "等宽", "简洁科技"].map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><button type="button" aria-pressed={uppercase} onClick={() => setUppercase(!uppercase)}>字形：{uppercase ? "INKO" : "inko"} ⇄</button></div>
    </section>
    <div className={styles.grid}>
      {fonts.map((font, index) => (category === "全部" || font.category === category) && <button key={font.name} type="button" className={`${styles.card} ${selected === index ? styles.selected : ""}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>
        <div className={styles.meta}><span>{String(index + 1).padStart(2, "0")} / {font.name}</span><span>{selected === index ? "已选中 ✓" : "点击选择"}</span></div>
        <div className={styles.sample}>
          <span className={styles.symbol}>✳</span>
          <div><div className={styles.wordmark} style={{ fontFamily: `"${font.name}", sans-serif`, fontSize: size, fontWeight: font.weight }}>{uppercase ? "INKO" : "inko"}</div><div className={styles.caption}>创作，由此发生</div></div>
        </div>
        <p className={styles.note}>{font.note}</p>
      </button>)}
    </div>
    <p className={styles.result}>{selected === null ? "选好后，把编号或字体名称告诉我即可。" : `你选的是 ${String(selected + 1).padStart(2, "0")} · ${fonts[selected].name}，${size}px，${uppercase ? "INKO" : "inko"}。把这个选择告诉我，我会替换首页字标。`}</p>
  </div>;
}
