import { getNewsBriefRows } from "@/lib/data";

type SearchParams = Promise<{
  type?: string;
}>;

function formatDisplayTime(raw: string | null): string {
  if (!raw) {
    return "-";
  }
  return raw.replace("T", " ").slice(0, 19);
}

export default async function BriefsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const briefTypeRaw = (params.type ?? "all").trim();
  const briefType =
    briefTypeRaw === "important_hourly" || briefTypeRaw === "normal_3hourly" ? briefTypeRaw : null;
  const rows = await getNewsBriefRows({
    limit: 30,
    briefType,
  });

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <main style={{ display: "grid", gap: 16 }}>
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <div>
            <h1 style={{ fontSize: 28 }}>快讯简报</h1>
            <p style={{ color: "#666", marginTop: 6 }}>重要快讯每1小时一条，普通快讯每3小时一条</p>
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
              简报类型：
            </label>
            <select id="type" name="type" defaultValue={briefTypeRaw} style={{ padding: "4px 8px" }}>
              <option value="all">全部</option>
              <option value="important_hourly">重要（每小时）</option>
              <option value="normal_3hourly">普通（每3小时）</option>
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
                  <strong>{row.brief_type === "important_hourly" ? "重要（每小时）" : "普通（每3小时）"}</strong>
                  <span style={{ color: "#666", fontSize: 13 }}>
                    窗口：{formatDisplayTime(row.period_start)} ~ {formatDisplayTime(row.period_end)}
                  </span>
                </div>
                <p style={{ color: "#333", lineHeight: 1.6 }}>{row.summary}</p>
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
