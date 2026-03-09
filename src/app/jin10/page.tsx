import Link from "next/link";

import { getJin10NewsRows } from "@/lib/data";

type SearchParams = Promise<{
  importance?: string;
  start?: string;
  end?: string;
  page?: string;
}>;

function normalizeDateTimeLocal(raw: string | undefined): string {
  if (!raw) {
    return "";
  }
  const v = raw.trim();
  // datetime-local 允许 "YYYY-MM-DDTHH:mm"
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? v : "";
}

function toSupabaseTime(raw: string): string | null {
  if (!raw) {
    return null;
  }
  return `${raw}:00`;
}

function formatDisplayTime(raw: string | null): string {
  if (!raw) {
    return "-";
  }
  const normalized = raw.replace("T", " ").slice(0, 19);
  return normalized;
}

export default async function Jin10Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const importanceRaw = (params.importance ?? "all").trim();
  const importance = importanceRaw === "1" ? 1 : importanceRaw === "0" ? 0 : null;
  const pageRaw = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isNaN(pageRaw) ? 1 : Math.max(1, pageRaw);

  const start = normalizeDateTimeLocal(params.start);
  const end = normalizeDateTimeLocal(params.end);
  const result = await getJin10NewsRows({
    page,
    pageSize: 30,
    importance,
    startTime: toSupabaseTime(start),
    endTime: toSupabaseTime(end),
  });
  const rows = result.rows;

  const buildPageHref = (targetPage: number): string => {
    const search = new URLSearchParams();
    search.set("page", String(targetPage));
    if (importanceRaw !== "all") {
      search.set("importance", importanceRaw);
    }
    if (start) {
      search.set("start", start);
    }
    if (end) {
      search.set("end", end);
    }
    return `/jin10?${search.toString()}`;
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <main style={{ display: "grid", gap: 16 }}>
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <div>
            <h1 style={{ fontSize: 28 }}>快讯</h1>
            <p style={{ color: "#666", marginTop: 6 }}>每页30条，支持按重要性与时间区间筛选</p>
          </div>
          <Link href="/" style={{ color: "#2563eb" }}>
            返回板块看板
          </Link>
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
          <form action="/jin10" method="get" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <label htmlFor="importance" style={{ fontSize: 14 }}>
              重要性：
            </label>
            <select id="importance" name="importance" defaultValue={importanceRaw} style={{ padding: "4px 8px" }}>
              <option value="all">全部</option>
              <option value="1">仅重要</option>
              <option value="0">仅普通</option>
            </select>

            <label htmlFor="start" style={{ fontSize: 14 }}>
              开始时间：
            </label>
            <input id="start" name="start" type="datetime-local" defaultValue={start} style={{ padding: "4px 8px" }} />

            <label htmlFor="end" style={{ fontSize: 14 }}>
              结束时间：
            </label>
            <input id="end" name="end" type="datetime-local" defaultValue={end} style={{ padding: "4px 8px" }} />

            <button type="submit" style={{ padding: "4px 10px", cursor: "pointer" }}>
              筛选
            </button>
            <Link href="/jin10" style={{ color: "#2563eb", paddingLeft: 2 }}>
              重置
            </Link>
          </form>
        </section>

        {rows.length === 0 ? (
          <div style={{ color: "#666" }}>暂无快讯数据，请先运行采集程序并写入 Supabase。</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ color: "#666", fontSize: 14 }}>
              共 {result.total} 条，当前第 {result.page} / {result.totalPages} 页
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", width: 210 }}>时间</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", width: 90 }}>重要性</th>
                    <th style={{ textAlign: "left", padding: "10px 12px" }}>标题</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.news_id} style={{ borderTop: "1px solid #eee" }}>
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{formatDisplayTime(row.news_time)}</td>
                      <td style={{ padding: "10px 12px", color: row.importance === 1 ? "#d32f2f" : "#666" }}>
                        {row.importance === 1 ? "重要" : "普通"}
                      </td>
                      <td style={{ padding: "10px 12px" }}>{row.title || "(无标题)"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <section style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {result.page > 1 ? (
                <Link href={buildPageHref(result.page - 1)} style={{ color: "#2563eb" }}>
                  上一页
                </Link>
              ) : (
                <span style={{ color: "#999" }}>上一页</span>
              )}
              <span style={{ color: "#999" }}>|</span>
              {result.page < result.totalPages ? (
                <Link href={buildPageHref(result.page + 1)} style={{ color: "#2563eb" }}>
                  下一页
                </Link>
              ) : (
                <span style={{ color: "#999" }}>下一页</span>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
