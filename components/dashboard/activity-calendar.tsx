import { dayKey, inRange, rangeStart, type Dataset } from "@/lib/analytics";

export default function ActivityCalendar({ data, now }: { data: Dataset; now: Date }) {
  const days = 180;
  const start = rangeStart(now, days);
  const offset = (start.getDay() + 6) % 7;
  const counts = new Map<string, number>();
  for (const record of [...data.articles, ...data.events]) {
    if (!inRange(record.createdAt, now, days)) continue;
    const key = dayKey(new Date(record.createdAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index - offset);
    const key = dayKey(date);
    const count = counts.get(key) ?? 0;
    return { key, date, count, outside: index < offset || index >= offset + days,
      level: count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4 };
  });
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7));
  let lastMonth = -1;
  const months = weeks.map(week => {
    const first = week.find(day => !day.outside);
    const month = first?.date.getMonth() ?? lastMonth;
    const label = month !== lastMonth ? `${month + 1}月` : "";
    lastMonth = month;
    return label;
  });
  let streak = 0;
  let longest = 0;
  for (const day of cells.filter(day => !day.outside)) {
    streak = day.count ? streak + 1 : 0;
    longest = Math.max(longest, streak);
  }
  return <div className="activity-calendar">
    <div className="activity-calendar-scroll" role="group" aria-label="近 180 天创作活跃日历，每个方格代表一天">
      <div className="activity-calendar-board">
        <div className="activity-weekdays" aria-hidden="true"><span>一</span><span>三</span><span>五</span><span>日</span></div>
        <div className="activity-weeks">
          {weeks.map((week, index) => <div className="activity-week" key={week[0].key}>
            <span className="activity-month">{months[index]}</span>
            {week.map(day => day.outside ? <span key={day.key} className="activity-cell outside" aria-hidden="true" /> :
              <span key={day.key} className={`activity-cell level-${day.level}`} tabIndex={0} role="img"
                aria-label={`${day.key}，${day.count} 条创作记录`} data-tooltip={`${day.key} · ${day.count} 条创作记录`} />)}
          </div>)}
        </div>
      </div>
    </div>
    <div className="activity-calendar-footer">
      <p>活跃 <strong>{counts.size}</strong> 天<span>最长连续 <strong>{longest}</strong> 天</span></p>
      <div className="activity-scale" aria-label="颜色从浅到深表示活跃程度从少到多"><span>少</span>{[0, 1, 2, 3, 4].map(level => <i key={level} className={`activity-cell level-${level}`} />)}<span>多</span></div>
    </div>
    <p className="activity-calendar-note">记录每一次新建文章与 AI 创作，让持续积累看得见。</p>
  </div>;
}
