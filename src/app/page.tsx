import Link from "next/link";
import { MomentumHeatmap } from "@/components/momentum-heatmap";
import { SectorTable } from "@/components/sector-table";
import { getAvailableTradeDates, getMomentumData, getSectorRows } from "@/lib/data";

type SearchParams = Promise<{ date?: string; tab?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const currentTab = params.tab === "momentum" ? "momentum" : "concept";
  const { tradeDate, rows } = await getSectorRows(params.date);
  const momentum = await getMomentumData(14);
  const availableDates = await getAvailableTradeDates(90);
  const conceptHref = params.date ? `/?date=${encodeURIComponent(params.date)}&tab=concept` : "/?tab=concept";
  const momentumHref = params.date
    ? `/?date=${encodeURIComponent(params.date)}&tab=momentum`
    : "/?tab=momentum";

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <main style={{ display: "grid", gap: 16 }}>
        <section style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
          <div>
            <h1 style={{ fontSize: 28 }}>今日领涨板块看板</h1>
            <p style={{ color: "#666", marginTop: 6 }}>交易日：{tradeDate}</p>
          </div>
          <p style={{ color: "#666" }}>共 {rows.length} 个板块</p>
        </section>

        <section style={{ display: "flex", gap: 8 }}>
          <Link
            href={conceptHref}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: currentTab === "concept" ? "#111827" : "#fff",
              color: currentTab === "concept" ? "#fff" : "#111",
            }}
          >
            概念板块五要素
          </Link>
          <Link
            href={momentumHref}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: currentTab === "momentum" ? "#111827" : "#fff",
              color: currentTab === "momentum" ? "#fff" : "#111",
            }}
          >
            行业板块动量图
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
          <form action="/" method="get" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="hidden" name="tab" value={currentTab} />
            <label htmlFor="trade-date" style={{ fontSize: 14 }}>
              交易日筛选：
            </label>
            <select id="trade-date" name="date" defaultValue={tradeDate} style={{ padding: "4px 8px" }}>
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button type="submit" style={{ padding: "4px 10px", cursor: "pointer" }}>
              查看
            </button>
          </form>
        </section>

        {currentTab === "concept" ? (
          rows.length === 0 ? (
            <div style={{ color: "#666" }}>暂无数据，请先同步到 Supabase。</div>
          ) : (
            <SectorTable tradeDate={tradeDate} rows={rows} />
          )
        ) : (
          <>
            <MomentumHeatmap title="涨幅动量图（近14交易日 × 前30）" matrix={momentum.up} />
            <MomentumHeatmap title="跌幅动量图（近14交易日 × 前30）" matrix={momentum.down} />
          </>
        )}
      </main>
    </div>
  );
}
