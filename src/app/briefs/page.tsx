import { getNewsBriefRows } from "@/lib/data";

type SearchParams = Promise<{
  type?: string;
}>;

const WINDOW_LABELS: Record<string, string> = {
  pre_market_08: "盘前狙击 (08:00)",
  midday_12: "午间复盘 (12:00)",
  post_market_17: "盘后沉淀 (17:00)",
  evening_21: "夜盘前瞻 (21:00)",
  midnight_24: "深夜哨兵 (24:00)",
  // 兼容旧数据
  important_hourly: "重要（每小时·旧）",
  normal_3hourly: "普通（每3小时·旧）",
};

const VALID_TYPES = new Set([
  "pre_market_08",
  "midday_12",
  "post_market_17",
  "evening_21",
  "midnight_24",
]);

function formatDisplayTime(raw: string | null): string {
  if (!raw) return "-";
  return raw.replace("T", " ").slice(0, 19);
}

function getBriefLabel(briefType: string): string {
  return WINDOW_LABELS[briefType] ?? briefType;
}

export default async function BriefsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const briefTypeRaw = (params.type ?? "all").trim();
  const briefType = VALID_TYPES.has(briefTypeRaw) ? briefTypeRaw : null;
  const rows = await getNewsBriefRows({ limit: 30, briefType });

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <main style={{ display: "grid", gap: 16 }}>
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <div>
            <h1 style={{ fontSize: 28 }}>快讯简报</h1>
            <p style={{ color: "#666", marginTop: 6 }}>每日5个定点窗口生成A股事件研判简报</p>
          </div>
          <p style={{ color: "#666" }}>最近 {rows.length} 条</p>
        </section>

        <section
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 10,
          }}
        >
          <form action="/briefs" method="get" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label htmlFor="type" style={{ fontSize: 14 }}>
              窗口类型：
            </label>
            <select id="type" name="type" defaultValue={briefTypeRaw} style={{ padding: "4px 8px" }}>
              <option value="all">全部</option>
              <option value="pre_market_08">盘前狙击 (08:00)</option>
              <option value="midday_12">午间复盘 (12:00)</option>
              <option value="post_market_17">盘后沉淀 (17:00)</option>
              <option value="evening_21">夜盘前瞻 (21:00)</option>
              <option value="midnight_24">深夜哨兵 (24:00)</option>
            </select>
            <button type="submit" style={{ padding: "4px 10px", cursor: "pointer" }}>
              筛选
            </button>
          </form>
        </section>

        {rows.length === 0 ? (
          <div style={{ color: "#666" }}>暂无简报数据，请先运行采集程序。</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {rows.map((row) => (
              <article key={row.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                  <strong>{getBriefLabel(row.brief_type)}</strong>
                  <span style={{ color: "#666", fontSize: 13 }}>
                    窗口：{formatDisplayTime(row.period_start)} ~ {formatDisplayTime(row.period_end)}
                  </span>
                </div>
                <div style={{ color: "#333", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {row.summary}
                </div>
                <div style={{ color: "#777", marginTop: 8, fontSize: 12 }}>
                  样本数：{row.news_count} | 模型：{row.model_name ?? "-"} | 生成时间：{formatDisplayTime(row.created_at)}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
